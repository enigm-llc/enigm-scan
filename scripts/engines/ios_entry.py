# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright 2026 Enigm (https://enigm.io)
#
# This file uses pymobiledevice3, which is licensed under the GPL-3.0, so it is
# distributed under the GPL-3.0 or later (see LICENSES/GPL-3.0.txt), unlike the
# rest of Enigm Scan.
"""Narrow USB-only adapter to pinned pymobiledevice3 (separately GPL-3.0).
No CLI passthrough, restore, remote tunnel, firmware operation or Apple login.
"""
import asyncio
import json
import os
import plistlib
from pathlib import Path
import re
import socket
import shutil
import struct
import sys
import uuid

VERSION = "11.45.0"
# The phone's network is observed for at least this long and, while the copy
# still runs, up to NETWORK_MAX_SECONDS.
NETWORK_SECONDS = 120
NETWORK_MAX_SECONDS = 900
# The capture file's limit, well inside what the analysis reads. Packets keep
# only what the analysis reads (see `kept_length`), so this holds millions of
# them, even while the phone downloads photos or updates.
CAPTURE_LIMIT_BYTES = 256 * 1024 ** 2
# Bytes kept after the IP and transport headers of an ordinary packet.
CAPTURE_TAIL = 32
HTTP_METHODS = (b"GET ", b"POST ", b"HEAD ", b"PUT ", b"DELETE ", b"OPTIONS ", b"PATCH ")
# If the phone ends the capture early it is started again, this many times.
CAPTURE_RESTARTS = 5
CAPTURE_RESTART_PAUSE = 1.0
# Starting pcapd must not hold back the copy (and the phone's prompts) for long.
CAPTURE_START_SECONDS = 20
DISCOVERY_SECONDS = 12
# Each phone's trust check, well inside the discovery deadline.
PROBE_SECONDS = 4
# How long the phone may show "Trust This Computer?" before we give up.
TRUST_SECONDS = 180
# Copies restarted when the phone dropped an unanswered passcode prompt.
PASSCODE_RETRIES = 2
PASSCODE_RETRY_PAUSE = 5
MIN_FREE_SPACE = 512 * 1024 ** 2
# Free space reported to the phone. Its MobileBackup2 estimate sizes the whole
# backup, but personal photo/video payloads are discarded while streaming, so
# the real requirement is usually far smaller. The local disk guard enforces the
# actual limit (see stream_transfer and acquire's budget).
REPORTED_FREE_SPACE = 4 * 1024 ** 4


def valid_id(value):
    return isinstance(value, str) and re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9:_.-]{0,127}", value) is not None


def usb_only(event, args):
    if event == "socket.connect":
        sock, address = args
        if sock.family == getattr(socket, "AF_UNIX", None) and address in ("/var/run/usbmuxd", "/run/usbmuxd"):
            return
        if sock.family == socket.AF_INET and address == ("127.0.0.1", 27015):
            return
        raise PermissionError("usb_transport_only")
    if event == "socket.sendmsg" and args[1] is None:
        # asyncio writes queued buffers with sendmsg() on the already connected
        # USB stream (its connect() was restricted above). Blocking this broke
        # long backups mid-transfer. Only explicitly addressed sends are denied.
        return
    if event in {"socket.getaddrinfo", "socket.gethostbyname", "socket.sendto", "socket.sendmsg", "socket.bind"}:
        raise PermissionError("usb_transport_only")


async def stream_transfer(link, size, code, destination=None):
    """Drain arbitrarily large protocol frames with at most 64 KiB in memory."""
    from pymobiledevice3.services.device_link import CODE_FILE_DATA, SIZE_FORMAT, CODE_FORMAT
    while size and code == CODE_FILE_DATA:
        if size < 0:
            raise ValueError("invalid_transfer_frame")
        remaining = size
        while remaining:
            if destination is not None and shutil.disk_usage(link.root_path).free < MIN_FREE_SPACE:
                raise ValueError("insufficient_disk_space")
            chunk = await link._recvall(min(remaining, 64 * 1024))
            if not chunk:
                raise ValueError("incomplete_transfer_frame")
            SESSION["receivedBytes"] += len(chunk)
            if destination is not None:
                destination.write(chunk)
                SESSION["storedBytes"] += len(chunk)
            remaining -= len(chunk)
            await asyncio.sleep(0)  # cancellation and the disk guard remain responsive
        (size,) = struct.unpack(SIZE_FORMAT, await link._recvall(struct.calcsize(SIZE_FORMAT)))
        (code,) = struct.unpack(CODE_FORMAT, await link._recvall(struct.calcsize(CODE_FORMAT)))
        size -= struct.calcsize(CODE_FORMAT)
    if size < 0:
        raise ValueError("invalid_transfer_frame")
    return size, code


async def report_room_for_selective_copy(link, _message):
    """Answer DLMessageGetFreeDiskSpace with room for the selective copy, so the
    phone does not refuse a backup whose stored part fits on this computer.
    Writing still stops with insufficient_disk_space before the disk runs low."""
    actual = shutil.disk_usage(link.root_path).free
    reported = max(actual, REPORTED_FREE_SPACE)
    link._reported_free_space = reported
    await link.status_response(0, status_dict=reported)


# Session state for device notifications observed during a backup.
SESSION = {"work": None, "cancelled_on_device": False, "phase": "acquiring", "percent": None,
           "kept": 0, "discarded": 0, "receivedBytes": 0, "storedBytes": 0,
           "capturing": False, "before_prompt": None, "prompted": False}


def observe_backup_notification(_service, event):
    """Turn the phone's own backup notifications into user guidance: the
    passcode prompt appeared or closed, or the copy was cancelled on the phone."""
    from pymobiledevice3.services import mobilebackup2 as backup
    name = event.get("Name") if isinstance(event, dict) else None
    work = SESSION["work"]
    if name == backup.NP_SYNC_CANCEL_REQUEST:
        SESSION["cancelled_on_device"] = True
    elif work is not None and name == backup.NP_LOCAL_AUTH_PRESENTED:
        SESSION["prompted"] = True
        if SESSION["phase"] != "awaiting_passcode":
            SESSION["before_prompt"] = SESSION["phase"]
        phase(work, "awaiting_passcode")
    elif work is not None and name == backup.NP_LOCAL_AUTH_DISMISSED and SESSION["phase"] == "awaiting_passcode":
        # Return to whatever the phone was doing before it prompted.
        phase(work, SESSION["before_prompt"] or "acquiring")
        SESSION["before_prompt"] = None


def classify(error):
    """Map transport errors to actionable codes; None keeps the generic failure."""
    from pymobiledevice3 import exceptions as e
    if device_locked(error) or isinstance(error, e.PasswordRequiredError):
        return "device_locked"
    if isinstance(error, e.NotEnoughDiskSpaceError):
        return "insufficient_disk_space"
    if isinstance(error, e.UserDeniedPairingError):
        return "device_trust_denied"
    if isinstance(error, e.PairingDialogResponsePendingError):
        return "device_not_trusted"
    if isinstance(error, (e.ConnectionTerminatedError, e.ConnectionFailedError, e.NoDeviceConnectedError,
                          e.DeviceNotFoundError, ConnectionError, asyncio.IncompleteReadError)):
        return "device_disconnected"
    return None


# USB link speed per serial, as reported by usbmuxd ("ConnectionSpeed", bit/s).
USB_SPEEDS = {}


def record_usb_speed(original):
    def process(self, response):
        try:
            if response.get("MessageType") == "Attached":
                properties = response.get("Properties") or {}
                speed, serial = properties.get("ConnectionSpeed"), properties.get("SerialNumber")
                if (isinstance(speed, int) and not isinstance(speed, bool) and 0 < speed <= 100_000_000_000
                        and valid_id(serial)):
                    USB_SPEEDS[serial] = speed
        except AttributeError:
            pass
        return original(self, response)
    process.records_speed = True
    return process


def api():
    from pymobiledevice3 import usbmux
    if not getattr(usbmux.PlistMuxConnection._process_device_state, "records_speed", False):
        usbmux.PlistMuxConnection._process_device_state = record_usb_speed(usbmux.PlistMuxConnection._process_device_state)
    from pymobiledevice3.usbmux import list_devices
    from pymobiledevice3.lockdown import create_using_usbmux
    from pymobiledevice3.services.mobilebackup2 import Mobilebackup2Service
    from pymobiledevice3.services.device_link import DeviceLink
    DeviceLink._consume_file_transfer = stream_transfer
    DeviceLink.get_free_disk_space = report_room_for_selective_copy
    Mobilebackup2Service._log_backup_notification = observe_backup_notification
    return list_devices, create_using_usbmux, Mobilebackup2Service


def preload(mode):
    """Import everything a mode uses before any deadline starts. Loading the
    adapter's libraries can take tens of seconds (on macOS each freshly
    unpacked library is checked before it loads), and that must never count
    as time the phone or the person took. Startup has its own allowance in
    the runtime."""
    loaded = api()
    if mode in ("backup", "self-check"):
        from pymobiledevice3 import exceptions  # noqa: F401
        from pymobiledevice3.services import mobilebackup2  # noqa: F401
        from pymobiledevice3.services.device_link import CODE_FILE_DATA  # noqa: F401
        from pymobiledevice3.services.pcapd import PcapdService  # noqa: F401
        diagnostics_api()
        import tarfile  # noqa: F401
    return loaded


async def listing(work):
    list_devices, connect, _ = api()
    result = []
    # USB enumeration never pairs or creates a host trust relationship.
    try:
        attached = await list_devices()
    except Exception as error:
        raise RuntimeError("ios_transport_unavailable") from error
    async def probe(device, item):
        async with await connect(serial=device.serial, connection_type="USB", autopair=False,
                                 pairing_records_cache_folder=work / "pairing", label="Enigm Scan") as client:
            item["authorized"] = bool(client.paired)
            item["needsTrust"] = not client.paired
            item["name"] = (client.display_name or "iPhone")[:80]

    async def bounded(device, item):
        # A phone that does not answer the trust check in time (locked, stale
        # or half-finished pairing) is still listed as needing trust: the scan
        # asks for "Trust" itself. Before, one silent phone made the whole
        # search time out and the iPhone never appeared.
        try:
            await asyncio.wait_for(probe(device, item), PROBE_SECONDS)
        except Exception:
            pass  # Present USB presence, never invent trust.

    checks = []
    for device in attached[:32]:
        if device.connection_type != "USB" or not valid_id(device.serial):
            continue
        item = {"id": device.serial, "platform": "ios", "authorized": False, "needsTrust": True, "name": "iPhone"}
        if device.serial in USB_SPEEDS:
            item["usbSpeed"] = USB_SPEEDS[device.serial]
        checks.append(bounded(device, item))
        result.append(item)
    await asyncio.gather(*checks)
    return result


def publish(work):
    """Atomically publish real acquisition progress for the runtime: the phase,
    the completion percentage reported by the phone, and observed counters."""
    status = {"phase": SESSION["phase"], "capturing": bool(SESSION["capturing"])}
    if SESSION["percent"] is not None:
        status["percent"] = SESSION["percent"]
    if SESSION.get("sysdiagnose") in ("generating", "ready"):
        status["sysdiagnose"] = SESSION["sysdiagnose"]
    for key in ("kept", "discarded", "receivedBytes", "storedBytes"):
        status[key] = SESSION[key]
    temporary = work / "acquisition-status.tmp"
    temporary.write_text(json.dumps(status))
    temporary.replace(work / "acquisition-status.json")


def phase(work, value):
    SESSION["phase"] = value
    publish(work)


def on_backup_progress(value):
    """MobileBackup2 completion percentage, as reported by the phone."""
    if isinstance(value, (int, float)) and not isinstance(value, bool) and 0 <= value <= 100:
        SESSION["percent"] = max(float(value), SESSION["percent"] or 0.0)


def kept_length(payload):
    """How much of an IP packet the capture keeps: whole DNS messages, TLS
    handshakes (the server name) and HTTP request headers; of everything
    else, the IP and transport headers and a few bytes. Content the phone
    downloads or sends is never stored, and the file stays small."""
    version = payload[0] >> 4
    if version == 4 and len(payload) >= 20:
        header, proto = (payload[0] & 15) * 4, payload[9]
    elif version == 6 and len(payload) >= 40:
        header, proto = 40, payload[6]
    else:
        return len(payload)
    if proto == 17 and len(payload) >= header + 8:
        ports = struct.unpack(">HH", payload[header:header + 4])
        if 53 in ports:
            return len(payload)
        return min(len(payload), header + 8 + CAPTURE_TAIL)
    if proto == 6 and len(payload) >= header + 20:
        start = header + (payload[header + 12] >> 4) * 4
        data = payload[start:]
        if data[:2] == b"\x16\x03":
            return len(payload)
        if data.startswith(HTTP_METHODS):
            return min(len(payload), start + 4096)
        return min(len(payload), start + CAPTURE_TAIL)
    return min(len(payload), header + CAPTURE_TAIL)


async def capture_network(client, work, ready=None, copied=None):
    """Observe the phone's own traffic through pcapd: at least NETWORK_SECONDS
    and, while the copy still runs (until `copied` is set), up to
    NETWORK_MAX_SECONDS.

    Runs alongside the backup: pcapd and MobileBackup2 are separate services.
    `ready` is set once pcapd has been started (or failed to start), so the
    caller can start the backup without interleaving lockdown requests. If the
    phone ends the capture early, it is started again (up to CAPTURE_RESTARTS
    times) and the time observed adds up. The result, with the reason it
    ended, is always written to network-status.json, also when cancelled;
    "completed" only when at least NETWORK_SECONDS were observed."""
    from pymobiledevice3.services.pcapd import PcapdService
    loop = asyncio.get_running_loop()
    target = work / "device-network.pcap"
    size = 24
    packets = 0
    observed = 0.0
    restarts = 0
    began = False
    reason = "not_started"

    def finished():
        return observed >= NETWORK_MAX_SECONDS or (
            observed >= NETWORK_SECONDS and (copied is None or copied.is_set()))

    async def pump(capture, output):
        nonlocal size, packets
        async for packet in capture.watch(packets_count=-1):
            # watch() supplies an Ethernet envelope, including for cellular.
            payload = packet.data[14:]
            if not payload or payload[0] >> 4 not in (4, 6):
                continue
            if len(payload) > 65535 or not 0 <= packet.microseconds < 1000000:
                continue
            kept = kept_length(payload)
            if size + 16 + kept > CAPTURE_LIMIT_BYTES:
                return "size_limit"
            output.write(struct.pack("<IIII", packet.seconds, packet.microseconds, kept, len(payload)))
            output.write(payload[:kept])
            size += 16 + kept
            packets += 1
        return "stream_ended"

    def record(why):
        complete = observed >= NETWORK_SECONDS and why in ("duration_reached", "size_limit")
        result = {"status": "completed" if complete else "partial", "reason": why,
                  "durationSeconds": observed, "minimumSeconds": NETWORK_SECONDS,
                  "packets": packets, "restarts": restarts}
        (work / "network-status.json").write_text(json.dumps(result))
        SESSION["capturing"] = False
        publish(work)
        return result

    try:
        with target.open("xb") as output:
            output.write(struct.pack("<IHHIIII", 0xa1b2c3d4, 2, 4, 0, 0, 65535, 101))
            while True:
                stop = False
                session = None
                try:
                    async with PcapdService(client) as capture:
                        if ready is not None:
                            ready.set()
                        began = True
                        session = loop.time()
                        SESSION["capturing"] = True
                        publish(work)
                        task = asyncio.create_task(pump(capture, output))
                        try:
                            while True:
                                if task.done():
                                    reason = task.result()
                                    stop = reason == "size_limit"
                                    break
                                now = observed + loop.time() - session
                                if now >= NETWORK_MAX_SECONDS or (
                                        now >= NETWORK_SECONDS and (copied is None or copied.is_set())):
                                    reason, stop = "duration_reached", True
                                    break
                                await asyncio.sleep(0.05)
                        finally:
                            if not task.done():
                                task.cancel()
                            await asyncio.gather(task, return_exceptions=True)
                except Exception:
                    reason = "interrupted" if began else "not_started"
                finally:
                    if session is not None:
                        observed += loop.time() - session
                    if ready is not None:
                        ready.set()
                if stop or finished() or restarts >= CAPTURE_RESTARTS:
                    break
                # The phone ended the capture early: start it again.
                restarts += 1
                SESSION["capturing"] = False
                publish(work)
                await asyncio.sleep(CAPTURE_RESTART_PAUSE)
    except asyncio.CancelledError:
        record("interrupted")
        raise
    return record(reason)


def device_locked(error):
    """The phone refused the backup because it was locked or its passcode prompt
    was not answered in time (MobileBackup2 MBErrorDomain/208)."""
    text = str(error)
    return "MBErrorDomain/208" in text or "'ErrorCode': 208" in text


MEDIA_EXTENSIONS = frozenset({".jpg", ".jpeg", ".heic", ".heif", ".png", ".gif", ".mov", ".mp4", ".m4v", ".avi", ".dng"})


def keep_forensic_file(item):
    # Only omit known personal-library payloads. Keep databases, sidecars,
    # message attachments, app data, executables and unknown/opaque paths.
    name = (item.device_name or "").replace("\\", "/").lower()
    if Path(name).suffix not in MEDIA_EXTENSIONS:
        return True
    library = any(part in name for part in ("/media/dcim/", "mediadomain/dcim/", "mediadomain-dcim/", "/photodata/thumbnails/"))
    return not library


# Diagnostics read after the backup, next to the evidence (never inside it).
DIAGNOSTICS = "ios-diagnostics"
CRASH_LIMITS = {"files": 3000, "file_bytes": 4 * 1024 ** 2, "total_bytes": 160 * 1024 ** 2}
SYSDIAGNOSE_DIR = "DiagnosticLogs/sysdiagnose"
SYSDIAGNOSE_MAX_BYTES = 3 * 1024 ** 3
SYSDIAGNOSE_WAIT_SECONDS = 10 * 60
SHUTDOWN_LOG_MAX_BYTES = 16 * 1024 ** 2
# The list of processes running when the sysdiagnose was created.
PROCESS_LIST_MAX_BYTES = 8 * 1024 ** 2
# A failed service start can leave pymobiledevice3 waiting forever: every
# diagnostic step is bounded so it can only reduce coverage.
CRASH_STEP_SECONDS = 10 * 60
SYSDIAGNOSE_STEP_SECONDS = 20 * 60


def diagnostics_api():
    from pymobiledevice3.services.crash_reports import CrashReportsManager
    return CrashReportsManager


def crash_report_kept(path):
    """Crash and hang reports only: no analytics or usage logs, no sysdiagnose
    archives, no other device data."""
    name = path.rsplit("/", 1)[-1]
    lower = path.lower()
    return (name.endswith((".ips", ".crash")) and not name.startswith(("Analytics", "log-aggregated", "SiriSearchFeedback"))
            and "/sysdiagnose/" not in lower and not lower.startswith("diagnosticlogs/sysdiagnose")
            and ".." not in path.split("/") and len(path) < 400)


def safe_relative(path):
    parts = [part for part in path.replace("\\", "/").split("/") if part not in ("", ".")]
    if not parts or ".." in parts or any(len(part) > 200 for part in parts):
        return None
    return Path(*[re.sub(r"[^A-Za-z0-9._+-]", "_", part) for part in parts])


async def read_file(afc, path, destination, limit):
    """Stream a device file to disk in 1 MiB chunks, stopping at `limit`."""
    handle = await afc.fopen(path)
    written = 0
    try:
        with destination.open("wb") as out:
            while True:
                chunk = await afc.fread(handle, 1024 * 1024)
                if not chunk:
                    break
                written += len(chunk)
                if written > limit:
                    raise ValueError("diagnostic_file_too_large")
                if shutil.disk_usage(destination.parent).free < MIN_FREE_SPACE:
                    raise ValueError("insufficient_disk_space")
                out.write(chunk)
    finally:
        await afc.fclose(handle)
    return written


def extract_shutdown_log(archive, destination, processes=None):
    """Read only `shutdown.log` from a sysdiagnose archive, streaming, and,
    when `processes` is given, the list of processes that were running when it
    was created (`ps.txt` at the top of the archive). Nothing else is kept.
    Member names are untrusted and never used as paths. Returns whether the
    shutdown log was found."""
    import tarfile
    found = False
    with tarfile.open(archive, "r|gz") as tar:
        for member in tar:
            if not member.isfile():
                continue
            name = member.name.replace("\\", "/")
            if not found and name.endswith("/Extra/shutdown.log") and member.size <= SHUTDOWN_LOG_MAX_BYTES:
                source = tar.extractfile(member)
                destination.write_bytes(source.read(SHUTDOWN_LOG_MAX_BYTES + 1)[:SHUTDOWN_LOG_MAX_BYTES])
                found = True
            elif processes is not None and not processes.exists() and name.count("/") == 1 \
                    and name.endswith("/ps.txt") and member.size <= PROCESS_LIST_MAX_BYTES:
                source = tar.extractfile(member)
                processes.write_bytes(source.read(PROCESS_LIST_MAX_BYTES + 1)[:PROCESS_LIST_MAX_BYTES])
            if found and (processes is None or processes.exists()):
                break
    return found


def is_sysdiagnose(name):
    """A finished sysdiagnose archive in the phone's folder."""
    return name.startswith("sysdiagnose_") and name.endswith(".tar.gz")


async def newest_sysdiagnose(afc, deadline):
    """The newest finished sysdiagnose archive, waiting for one the owner is
    generating (an `IN_PROGRESS_` entry) until `deadline`."""
    loop = asyncio.get_running_loop()
    while True:
        try:
            names = await afc.listdir(SYSDIAGNOSE_DIR)
        except Exception:
            return None, False
        generating = any(name.startswith("IN_PROGRESS_") for name in names)
        if generating and SESSION.get("work") is not None:
            # The copy is done; the web keeps showing that the phone is
            # finishing the sysdiagnose instead of looking stuck.
            SESSION["sysdiagnose"] = "generating"
            publish(SESSION["work"])
        finished = []
        for name in names:
            if is_sysdiagnose(name) and safe_relative(name) is not None:
                info = await afc.stat(f"{SYSDIAGNOSE_DIR}/{name}")
                finished.append((info["st_mtime"], name, info["st_size"]))
        if not generating or loop.time() >= deadline:
            return (max(finished) if finished else None), generating
        await asyncio.sleep(10)


WATCH_SECONDS = 5


async def watch_sysdiagnose(afc):
    """During the copy, notice when the owner starts a sysdiagnose on the
    phone ("generating") and when it is finished ("ready"), so the web can
    confirm the buttons were pressed correctly. One still being prepared when
    the copy starts counts as started; finished archives count only when they
    appear after that. A failure just stops the watch."""
    try:
        baseline = set(await afc.listdir(SYSDIAGNOSE_DIR))
    except Exception:
        baseline = set()  # the folder appears with the first sysdiagnose
    # The owner is asked to start it before the scan, so it is usually being
    # prepared already when the copy starts: say so at once. Its finished
    # archive is still new to the baseline and confirms it below.
    if any(name.startswith("IN_PROGRESS_") for name in baseline):
        SESSION["sysdiagnose"] = "generating"
    while True:
        await asyncio.sleep(WATCH_SECONDS)
        try:
            new = set(await afc.listdir(SYSDIAGNOSE_DIR)) - baseline
        except Exception:
            continue
        if any(is_sysdiagnose(name) for name in new):
            SESSION["sysdiagnose"] = "ready"
            return
        if any(name.startswith("IN_PROGRESS_") for name in new):
            SESSION["sysdiagnose"] = "generating"


async def start_sysdiagnose_watch(client):
    """Starts the crash report service before the backup, as pcapd is: lockdown
    requests must not interleave with the backup's. Its own connection is
    then polled without lockdown traffic."""
    manager = diagnostics_api()(client)
    try:
        await asyncio.wait_for(manager.afc.connect(), 10)
    except BaseException:
        try:
            await asyncio.wait_for(manager.aclose(), 5)
        except Exception:
            pass
        raise
    return manager, asyncio.create_task(watch_sysdiagnose(manager.afc))


# Before the copy, how long the owner has to start the deep check, how often
# the phone is asked, and how long its confirmation stays on screen.
DEEP_WAIT_SECONDS = 5 * 60
DEEP_POLL_SECONDS = 2
DEEP_CONFIRM_SECONDS = 3
# Written by the runtime when the owner continues without the deep check.
DEEP_SKIP = "skip-deep-check"
# Written by the runtime when the owner presses Start after preparing the
# deep check in advance: "network" or "no-network".
START_COPY = "start-copy"
START_POLL_SECONDS = 0.5
COPY_CHOICES = ("network", "no-network")


async def wait_for_deep_check(client, work, limit=DEEP_WAIT_SECONDS, until=None):
    """With the deep check chosen, hold the copy until the phone is preparing
    a sysdiagnose (the owner pressed the three buttons): it is started after
    Trust and before the passcode prompt, which the side button would close.
    Ends when the phone confirms it, when the owner continues without it, or
    after `limit` (None: no limit, while the owner prepares it in advance),
    or once `until()` is true; it never fails the scan."""
    phase(work, "deep_wait")
    loop = asyncio.get_running_loop()
    deadline = None if limit is None else loop.time() + limit
    manager = None
    try:
        manager = diagnostics_api()(client)
        await asyncio.wait_for(manager.afc.connect(), 10)
        try:
            baseline = set(await manager.afc.listdir(SYSDIAGNOSE_DIR))
        except Exception:
            baseline = set()  # the folder appears with the first sysdiagnose
        # The phone's folder and the app's choice file have no event to wait on.
        while ((deadline is None or loop.time() < deadline) and not (work / DEEP_SKIP).exists()  # NOSONAR
               and not (until is not None and until())):
            try:
                names = set(await manager.afc.listdir(SYSDIAGNOSE_DIR))
            except Exception:
                names = set()
            # One being prepared counts even if it was started before Start.
            if any(name.startswith("IN_PROGRESS_") for name in names):
                SESSION["sysdiagnose"] = "generating"
            elif any(is_sysdiagnose(name) for name in names - baseline):
                SESSION["sysdiagnose"] = "ready"
            if SESSION.get("sysdiagnose"):
                publish(work)
                await asyncio.sleep(DEEP_CONFIRM_SECONDS)
                return True
            await asyncio.sleep(DEEP_POLL_SECONDS)
        return False
    except Exception:
        return False
    finally:
        if manager is not None:
            try:
                await asyncio.wait_for(manager.aclose(), 5)
            except Exception:
                pass


def start_choice(work):
    """What the app last asked of a held session: "hold", "deep", or to copy
    ("network" or "no-network"). The app replaces the file whole."""
    try:
        return (work / START_COPY).read_text(encoding="ascii", errors="ignore").strip()
    except OSError:
        return "hold"


async def wait_for_start(client, work):
    """Paired, hold the copy until the owner presses Start on the ready step.
    Meanwhile the owner can choose the deep check: the phone is then asked
    for it, with no time limit, and Start waits for its confirmation.
    Returns whether to observe the phone's network, chosen on that screen."""
    def chosen():
        return start_choice(work) in COPY_CHOICES
    phase(work, "trusted")
    while not chosen():
        if start_choice(work) == "deep":
            if not await wait_for_deep_check(client, work, limit=None, until=chosen):
                if not chosen():
                    raise ValueError("deep_check_failed")
                break
            phase(work, "deep_ready")
            while not chosen():
                await asyncio.sleep(START_POLL_SECONDS)
            break
        await asyncio.sleep(START_POLL_SECONDS)
    return start_choice(work) == "network"


async def collect_diagnostics(client, work, wait_seconds=SYSDIAGNOSE_WAIT_SECONDS):
    """Crash reports and the shutdown log of the newest sysdiagnose, read over
    the authorized USB connection after the backup. Best effort: a refusal or
    failure is recorded as reduced coverage and never fails the scan."""
    root = work / DIAGNOSTICS
    root.mkdir(mode=0o700, exist_ok=True)
    status = {"crashReports": {"status": "failed"}, "sysdiagnose": {"status": "failed"}}
    try:
        manager = diagnostics_api()(client)
    except Exception:
        (root / "status.json").write_text(json.dumps(status))
        return status
    try:
        try:
            # Moves pending reports into the readable folder, as Xcode does.
            await asyncio.wait_for(manager.flush(), 20)
        except Exception:
            pass
        counts = {"files": 0, "total": 0, "skipped": 0}
        async def pull_crash_reports():
            crash_root = root / "crash"
            crash_root.mkdir(mode=0o700, exist_ok=True)
            async for path in manager.afc.dirlist("/", -1):
                path = path.lstrip("/")
                if not crash_report_kept(path):
                    continue
                relative = safe_relative(path)
                if relative is None or counts["files"] >= CRASH_LIMITS["files"] \
                        or counts["total"] >= CRASH_LIMITS["total_bytes"]:
                    counts["skipped"] += 1
                    continue
                info = await manager.afc.stat(path)
                if info.get("st_ifmt") != "S_IFREG" or info["st_size"] > CRASH_LIMITS["file_bytes"]:
                    counts["skipped"] += 1
                    continue
                target = crash_root / relative
                target.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
                counts["total"] += await read_file(manager.afc, path, target, CRASH_LIMITS["file_bytes"])
                counts["files"] += 1
        try:
            await asyncio.wait_for(pull_crash_reports(), CRASH_STEP_SECONDS)
            status["crashReports"] = {"status": "completed", "files": counts["files"], "bytes": counts["total"],
                                      "skipped": counts["skipped"]}
        except BaseException as error:
            if isinstance(error, asyncio.CancelledError) and not isinstance(error, TimeoutError):
                raise
            status["crashReports"] = {"status": "failed", "files": counts["files"], "error": type(error).__name__[:60]}
        try:
            loop = asyncio.get_running_loop()
            newest, generating = await asyncio.wait_for(
                newest_sysdiagnose(manager.afc, loop.time() + wait_seconds), wait_seconds + 60)
            if newest is None:
                status["sysdiagnose"] = {"status": "timeout" if generating else "absent"}
            else:
                modified, name, size = newest
                seconds = modified.timestamp() if hasattr(modified, "timestamp") else float(modified)
                if seconds > 1e12:  # nanoseconds
                    seconds /= 1e9
                entry = {"archive": name[:200], "modified": int(seconds)}
                if size > SYSDIAGNOSE_MAX_BYTES or shutil.disk_usage(work).free < size + 2 * MIN_FREE_SPACE:
                    status["sysdiagnose"] = {"status": "too_large", **entry}
                else:
                    archive = root / "sysdiagnose.partial"
                    try:
                        await asyncio.wait_for(read_file(manager.afc, f"{SYSDIAGNOSE_DIR}/{name}", archive,
                                                         SYSDIAGNOSE_MAX_BYTES), SYSDIAGNOSE_STEP_SECONDS)
                        found = extract_shutdown_log(archive, root / "shutdown.log", root / "ps.txt")
                    finally:
                        # The rest of the archive (system logs) is never kept.
                        archive.unlink(missing_ok=True)
                    status["sysdiagnose"] = {"status": "completed" if found else "no_shutdown_log", **entry}
        except Exception as error:
            status["sysdiagnose"] = {"status": "timeout" if isinstance(error, TimeoutError) else "failed",
                                     "error": type(error).__name__[:60]}
    finally:
        try:
            await asyncio.wait_for(manager.aclose(), 10)
        except Exception:
            pass
    (root / "status.json").write_text(json.dumps(status))
    return status


async def copy_once(client, backup_api, work, output, password_supplied, capture):
    """One MobileBackup2 copy into `output`; returns how many personal media
    files were left out. Raises ValueError with an actionable code."""
    async with backup_api(client) as backup:
        if await backup.get_will_encrypt() and not password_supplied:
            raise ValueError("backup_password_required")
        phase(work, "acquiring")
        output.mkdir(mode=0o700)
        excluded = 0
        def select_file(item):
            nonlocal excluded
            keep = keep_forensic_file(item)
            if not keep: excluded += 1
            SESSION["kept" if keep else "discarded"] += 1
            return keep
        reserve = max(MIN_FREE_SPACE, min(shutil.disk_usage(work).free // 20, 2 * 1024 ** 3))
        def check_budget():
            if shutil.disk_usage(work).free < reserve:
                raise ValueError("insufficient_disk_space")
        async def budget():
            while True:
                check_budget()
                publish(work)  # once per second: bounded progress updates
                await asyncio.sleep(1)
        check_budget()
        # The copy starts right away so the phone asks for "Trust" and its
        # passcode in the first seconds; the network observation runs in
        # parallel. pcapd is started first because lockdown requests from
        # both services must not interleave on the shared connection.
        network = None
        # Set when the copy ends: the observation may stop once it has also
        # lasted NETWORK_SECONDS.
        copied = asyncio.Event()
        if capture:
            ready = asyncio.Event()
            network = asyncio.create_task(capture_network(client, work, ready, copied))
            try:
                await asyncio.wait_for(ready.wait(), CAPTURE_START_SECONDS)
            except TimeoutError:
                network.cancel()
                await asyncio.gather(network, return_exceptions=True)
        watch = watcher = None
        try:
            watch, watcher = await start_sysdiagnose_watch(client)
        except Exception:
            pass  # the copy and the later diagnostics work without it
        task = asyncio.create_task(backup.backup(full=True, backup_directory=output, filter_callback=select_file, patch_manifest=False,
                                                 progress_callback=on_backup_progress))
        task.add_done_callback(lambda _: copied.set())
        guard = asyncio.create_task(budget())
        try:
            for awaited in (task, network):
                if awaited is None:
                    continue
                # The disk guard can stop either wait; the backup's own
                # failure is raised from its task.
                done, _ = await asyncio.wait([awaited, guard], return_when=asyncio.FIRST_COMPLETED)
                for finished in done:
                    await finished
                await awaited
        except Exception as error:
            if SESSION["cancelled_on_device"]:
                raise ValueError("device_cancelled") from error
            code = classify(error)
            if code:
                raise ValueError(code) from error
            raise
        finally:
            running = [pending for pending in (task, guard, network, watcher) if pending is not None]
            for pending in running:
                if not pending.done(): pending.cancel()
            await asyncio.gather(*running, return_exceptions=True)
            if watch is not None:
                try:
                    await asyncio.wait_for(watch.aclose(), 5)
                except Exception:
                    pass
        check_budget()
    return excluded


async def acquire(serial, work, password_supplied, capture=False, deep=False, hold=False):
    if not valid_id(serial):
        raise ValueError("invalid_device")
    _, connect, backup_api = api()
    # Reuse an existing user pairing read-only. New pairing material stays in
    # memory, never enters the system's usbmuxd store, and is revoked on exit.
    client = await connect(serial=serial, connection_type="USB", autopair=False,
                           local_hostname=str(uuid.uuid4()), pairing_records_cache_folder=work / "pairing",
                           label="Enigm Scan")
    temporary_pair = not client.paired
    async def memory_only():  # NOSONAR: replaces an async method
        return None
    SESSION.update(work=work, cancelled_on_device=False, phase="acquiring", percent=None,
                   kept=0, discarded=0, receivedBytes=0, storedBytes=0, sysdiagnose=None)
    try:
        if temporary_pair:
            client.save_pair_record = memory_only
            # The phone shows "Trust This Computer?" and needs to be unlocked.
            phase(work, "awaiting_trust")
            try:
                await client.pair(timeout=TRUST_SECONDS)
            except Exception as error:
                raise ValueError(classify(error) or "device_not_trusted") from error
            if not await client.validate_pairing():
                raise ValueError("device_not_trusted")
        if hold:
            # Paired while searching: the copy waits for Start, and the deep
            # check, if chosen, is prepared on the same screen.
            capture = await wait_for_start(client, work)
        elif deep:
            await wait_for_deep_check(client, work)
        output = work / "ios-backup"
        excluded = 0
        attempt = 0
        while True:
            SESSION["prompted"] = False
            try:
                # A restarted copy observes the network again, so a retry
                # never leaves the observation shorter than asked.
                excluded = await copy_once(client, backup_api, work, output, password_supplied, capture)
                break
            except ValueError as error:
                # The phone showed its passcode prompt and closed it unanswered
                # (MobileBackup2 208): say so and ask again instead of ending
                # the scan. Without a prompt, 208 means a locked phone nobody
                # is attending, which a retry would not change.
                if str(error) != "device_locked" or not SESSION["prompted"]:
                    raise
                if attempt >= PASSCODE_RETRIES:
                    raise ValueError("device_passcode_timeout") from error
                attempt += 1
                shutil.rmtree(output, ignore_errors=True)
                SESSION.update(percent=None, kept=0, discarded=0, receivedBytes=0, storedBytes=0,
                               before_prompt=None)
                phase(work, "passcode_retry")
                await asyncio.sleep(PASSCODE_RETRY_PAUSE)
        target = output / serial
        if not (target / "Manifest.db").is_file() or not (target / "Status.plist").is_file():
            raise ValueError("acquisition_incomplete")
        with (target / "Status.plist").open("rb") as status_file:
            state = plistlib.loads(status_file.read(1024 * 1024 + 1))
        if not isinstance(state, dict) or state.get("SnapshotState") != "finished":
            raise ValueError("acquisition_incomplete")
        (work / "acquisition-summary.json").write_text(json.dumps({
            "policy": "personal-library-media-v1", "excludedMediaFiles": excluded,
            "manifestPreserved": True,
        }))
        # Crash reports and the shutdown log, once the backup service is closed.
        try:
            await collect_diagnostics(client, work)
        except Exception:
            pass
        return target
    finally:
        try:
            if temporary_pair and client.pair_record:
                await asyncio.wait_for(client.unpair(), 5)
        finally:
            await client.close()


PARENT_POLL_SECONDS = 2


def parent_pid():
    """The app's process id, passed by the runtime (POSIX only).

    Windows needs no watcher: the runtime's job object already ends the
    adapter with the app, and os.kill(pid, 0) would TERMINATE the
    app there instead of probing it."""
    if os.name != "posix":
        return None
    value = os.environ.get("ENIGM_PARENT_PID", "")
    return int(value) if value.isdigit() and 1 < int(value) < 2 ** 31 else None


async def watch_parent(pid):
    """Return when the app process no longer exists."""
    while True:
        try:
            os.kill(pid, 0)
        except ProcessLookupError:
            return
        except PermissionError:
            pass  # exists, owned by someone else: keep running
        await asyncio.sleep(PARENT_POLL_SECONDS)


async def unless_parent_exits(operation, work):
    """Run the acquisition, but stop it and remove everything it wrote if the
    app exits first (closed, crashed or killed). Nobody else would clean
    this workspace, and the copy must not continue unattended."""
    pid = parent_pid()
    task = asyncio.create_task(operation)
    if pid is None:
        return await task
    watcher = asyncio.create_task(watch_parent(pid))
    try:
        done, _ = await asyncio.wait([task, watcher], return_when=asyncio.FIRST_COMPLETED)
        if task in done:
            return task.result()
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)
        shutil.rmtree(work, ignore_errors=True)
        raise RuntimeError("parent_exited")
    finally:
        watcher.cancel()
        await asyncio.gather(watcher, return_exceptions=True)


async def main(args):
    sys.addaudithook(usb_only)
    work = Path.cwd().resolve()
    if args == ["self-check"]:
        preload("self-check")
        print(json.dumps({"transport": "ios-usb", "version": VERSION}))
    elif args == ["list"]:
        preload("list")
        # Marks interpreter startup separately from the bounded USB operation.
        (work / "ios-discovery-started").write_text("started")
        try:
            print(json.dumps(await asyncio.wait_for(listing(work), DISCOVERY_SECONDS)))
        except TimeoutError as error:
            raise RuntimeError("ios_discovery_timeout") from error
    elif (len(args) in (4, 5) and args[0] == "backup" and args[2] in {"encrypted", "plain"}
          and args[3] in {"network", "no-network"}
          and (len(args) == 4 or args[4] in {"deep", "hold", "no-deep"})):
        preload("backup")
        deep = len(args) == 5 and args[4] == "deep"
        hold = len(args) == 5 and args[4] == "hold"
        await asyncio.wait_for(unless_parent_exits(
            acquire(args[1], work, args[2] == "encrypted", args[3] == "network", deep, hold), work),
            4 * 60 * 60 - 30)
    else:
        raise ValueError("invalid_operation")


KNOWN_FAILURES = {"backup_password_required", "insufficient_disk_space", "device_not_authorized", "invalid_operation",
                  "ios_transport_unavailable", "ios_discovery_timeout", "device_locked", "device_disconnected",
                  "device_not_trusted", "device_cancelled", "device_trust_denied", "device_passcode_timeout", "acquisition_incomplete", "invalid_device",
                  "parent_exited", "deep_check_failed"}
EXIT_CODES = {"backup_password_required": 78, "insufficient_disk_space": 79, "ios_discovery_timeout": 80, "device_locked": 81,
              "device_disconnected": 82, "device_not_trusted": 83, "device_cancelled": 84,
              "device_trust_denied": 85, "device_passcode_timeout": 86, "deep_check_failed": 87}


def failure_diagnostic(error):
    """A safe diagnostic for a failure: our own fixed code, or for anything
    unclassified only the chain of exception CLASS NAMES (never messages,
    paths, identifiers or phone data), e.g. "exc:ValueError>TimeoutError"."""
    code = str(error)
    if code in KNOWN_FAILURES:
        return code
    names, seen, current = [], set(), error
    while current is not None and len(names) < 4 and id(current) not in seen:
        seen.add(id(current))
        name = type(current).__name__
        names.append(name if re.fullmatch(r"[A-Za-z_]\w{0,47}", name, re.ASCII) else "Exception")
        current = current.__cause__ or (None if current.__suppress_context__ else current.__context__)
    return "exc:" + ">".join(names)


def report_failure(error):
    # Do not expose phone content, IDs, paths or raw upstream exceptions.
    code = str(error) if str(error) in KNOWN_FAILURES else "ios_transport_failed"
    print(code, file=sys.stderr)
    print("diagnostic:" + failure_diagnostic(error), file=sys.stderr)
    return EXIT_CODES.get(code, 1)


if __name__ == "__main__":
    os.umask(0o077)
    try:
        asyncio.run(main(sys.argv[1:]))
    except Exception as error:
        sys.exit(report_failure(error))
