# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright 2026 Enigm (https://enigm.io)
#
# This file uses pymobiledevice3, which is licensed under the GPL-3.0, so it is
# distributed under the GPL-3.0 or later (see LICENSES/GPL-3.0.txt), unlike the
# rest of Enigm Scan.
import asyncio
import io
import os
import json
import plistlib
import importlib.util
from pathlib import Path
import socket
import struct
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch
import ios_entry as adapter


class FakeClient:
    def __init__(self, paired=True, encrypted=False):
        self.paired = paired
        self.encrypted = encrypted
        self.pair_record = {"HostID": "existing"} if paired else None
        self.display_name = "iPhone test"
        self.events = []
    async def __aenter__(self): return self
    async def __aexit__(self, *args): await self.close()
    async def pair(self, timeout):
        self.events.append("pair")
        self.pair_record = {"HostID": "temporary"}
        await self.save_pair_record()
    async def validate_pairing(self):
        self.paired = True
        return True
    async def save_pair_record(self): raise AssertionError("Must not persist a new pairing")
    async def unpair(self): self.events.append("unpair")
    async def close(self): self.events.append("close")


class Backup:
    def __init__(self, client): self.client = client
    async def __aenter__(self): return self
    async def __aexit__(self, *args): pass
    async def get_will_encrypt(self): return self.client.encrypted
    async def backup(self, full, backup_directory, **kwargs):
        self.client.events.append("backup")
        root = backup_directory / "device-1"
        root.mkdir()
        (root / "Manifest.db").write_bytes(b"synthetic")
        (root / "Status.plist").write_bytes(plistlib.dumps({"SnapshotState": "finished"}))


class FakeAfc:
    """Crash report folder of a phone: path -> (bytes, mtime)."""
    def __init__(self, files):
        self.files = files
        self.handles = {}
        self.listings = 0
    async def dirlist(self, root, depth):
        yield "/"
        for path in sorted(self.files):
            yield "/" + path
    async def listdir(self, path):
        self.listings += 1
        prefix = path.rstrip("/") + "/"
        return [p[len(prefix):] for p in self.files if p.startswith(prefix) and "/" not in p[len(prefix):]]
    async def stat(self, path):
        from datetime import datetime
        data, mtime = self.files[path]
        return {"st_ifmt": "S_IFREG", "st_size": len(data), "st_mtime": datetime.fromtimestamp(mtime)}
    async def fopen(self, path):
        handle = len(self.handles) + 1
        self.handles[handle] = [self.files[path][0], 0]
        return handle
    async def fread(self, handle, size):
        data, offset = self.handles[handle]
        self.handles[handle][1] = offset + size
        return data[offset:offset + size]
    async def fclose(self, handle):
        del self.handles[handle]
    async def connect(self):
        self.connected = True


class FakeCrashReports:
    def __init__(self, files):
        self.afc = FakeAfc(files)
        self.flushed = self.closed = False
    def __call__(self, client):
        return self
    async def flush(self): self.flushed = True
    async def aclose(self): self.closed = True


def sysdiagnose_archive(shutdown_log):
    import io, tarfile
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode="w:gz") as tar:
        for name, data in (("sysdiagnose_x/logs/personal.log", b"private system log"),
                           ("sysdiagnose_x/system_logs.logarchive/Extra/shutdown.log", shutdown_log),
                           ("../../escape/Extra/shutdown.log.bak", b"ignored")):
            info = tarfile.TarInfo(name)
            info.size = len(data)
            tar.addfile(info, io.BytesIO(data))
    return buffer.getvalue()


class DiagnosticsTests(unittest.IsolatedAsyncioTestCase):
    async def collect(self, files, wait=0):
        manager = FakeCrashReports(files)
        with tempfile.TemporaryDirectory() as work, patch.object(adapter, "diagnostics_api", return_value=manager):
            status = await adapter.collect_diagnostics(object(), Path(work), wait_seconds=wait)
            root = Path(work) / adapter.DIAGNOSTICS
            kept = sorted(str(p.relative_to(root)) for p in root.rglob("*") if p.is_file())
            shutdown = (root / "shutdown.log").read_bytes() if (root / "shutdown.log").exists() else None
            self.assertEqual(json.loads((root / "status.json").read_text()), status)
        self.assertTrue(manager.flushed and manager.closed)
        return status, kept, shutdown

    async def test_keeps_crash_reports_and_only_the_shutdown_log_of_the_newest_sysdiagnose(self):
        log = b"remaining client pid: 1 (/private/var/db/x/bh)\nSIGTERM: [1700000000]\n"
        files = {
            "WebContent-2026-11-20-101010.ips": (b'{"bug_type":"309"}\n{}', 1),
            "Retired/IMTranscoderAgent-2026-11-19-101010.ips": (b"{}", 1),
            "Analytics-2026-11-20-000000.ips.ca.synced": (b"usage", 1),
            "Analytics-Journal-2026.ips": (b"usage", 1),
            "big-2026.ips": (b"x" * (adapter.CRASH_LIMITS["file_bytes"] + 1), 1),
            "DiagnosticLogs/sysdiagnose/sysdiagnose_2026.11.01_old.tar.gz": (sysdiagnose_archive(b"old"), 100),
            "DiagnosticLogs/sysdiagnose/sysdiagnose_2026.11.24_new.tar.gz": (sysdiagnose_archive(log), 200),
        }
        status, kept, shutdown = await self.collect(files)
        self.assertEqual(kept, ["crash/Retired/IMTranscoderAgent-2026-11-19-101010.ips",
                                "crash/WebContent-2026-11-20-101010.ips", "shutdown.log", "status.json"])
        self.assertEqual(shutdown, log)
        self.assertEqual(status["crashReports"], {"status": "completed", "files": 2, "bytes": 23, "skipped": 1})
        self.assertEqual(status["sysdiagnose"]["status"], "completed")
        self.assertEqual(status["sysdiagnose"]["archive"], "sysdiagnose_2026.11.24_new.tar.gz")

    async def test_absent_or_still_generating_sysdiagnose_is_reported_not_invented(self):
        status, kept, shutdown = await self.collect({"a.ips": (b"{}", 1)})
        self.assertEqual(status["sysdiagnose"], {"status": "absent"})
        self.assertIsNone(shutdown)
        status, _, _ = await self.collect({"DiagnosticLogs/sysdiagnose/IN_PROGRESS_sysdiagnose_x.tar.gz": (b"", 1)})
        self.assertEqual(status["sysdiagnose"], {"status": "timeout"})

    async def test_a_failing_service_never_fails_the_scan(self):
        class Broken(FakeCrashReports):
            async def flush(self): raise ConnectionError()
        manager = Broken({})
        async def broken_dirlist(root, depth):
            raise ConnectionError()
            yield
        manager.afc.dirlist = broken_dirlist
        async def broken_listdir(path): raise ConnectionError()
        manager.afc.listdir = broken_listdir
        with tempfile.TemporaryDirectory() as work, patch.object(adapter, "diagnostics_api", return_value=manager):
            status = await adapter.collect_diagnostics(object(), Path(work), wait_seconds=0)
        self.assertEqual(status["crashReports"]["status"], "failed")
        self.assertEqual(status["sysdiagnose"]["status"], "absent")

    async def test_the_copy_reports_when_the_owner_starts_and_finishes_a_sysdiagnose(self):
        afc = FakeAfc({"DiagnosticLogs/sysdiagnose/sysdiagnose_old.tar.gz": (b"x", 1)})
        adapter.SESSION["sysdiagnose"] = None
        with patch.object(adapter, "WATCH_SECONDS", 0.01):
            watcher = asyncio.create_task(adapter.watch_sysdiagnose(afc))
            await asyncio.sleep(0.05)
            self.assertIsNone(adapter.SESSION["sysdiagnose"])  # an older one does not count
            afc.files["DiagnosticLogs/sysdiagnose/IN_PROGRESS_sysdiagnose_new.tar.gz"] = (b"", 2)
            await asyncio.sleep(0.05)
            self.assertEqual(adapter.SESSION["sysdiagnose"], "generating")
            del afc.files["DiagnosticLogs/sysdiagnose/IN_PROGRESS_sysdiagnose_new.tar.gz"]
            afc.files["DiagnosticLogs/sysdiagnose/sysdiagnose_new.tar.gz"] = (b"x", 3)
            await asyncio.wait_for(watcher, 1)
        self.assertEqual(adapter.SESSION["sysdiagnose"], "ready")
        with tempfile.TemporaryDirectory() as work:
            adapter.publish(Path(work))
            self.assertEqual(json.loads((Path(work) / "acquisition-status.json").read_text())["sysdiagnose"], "ready")
        adapter.SESSION["sysdiagnose"] = None

    async def test_a_sysdiagnose_started_before_the_copy_is_confirmed_at_once(self):
        afc = FakeAfc({
            "DiagnosticLogs/sysdiagnose/sysdiagnose_old.tar.gz": (b"x", 1),
            "DiagnosticLogs/sysdiagnose/IN_PROGRESS_sysdiagnose_now.tar.gz": (b"", 2),
        })
        adapter.SESSION["sysdiagnose"] = None
        with patch.object(adapter, "WATCH_SECONDS", 0.01):
            watcher = asyncio.create_task(adapter.watch_sysdiagnose(afc))
            await asyncio.sleep(0.05)
            self.assertEqual(adapter.SESSION["sysdiagnose"], "generating")
            del afc.files["DiagnosticLogs/sysdiagnose/IN_PROGRESS_sysdiagnose_now.tar.gz"]
            afc.files["DiagnosticLogs/sysdiagnose/sysdiagnose_now.tar.gz"] = (b"x", 3)
            await asyncio.wait_for(watcher, 1)
        self.assertEqual(adapter.SESSION["sysdiagnose"], "ready")
        adapter.SESSION["sysdiagnose"] = None

    async def test_the_copy_waits_for_the_deep_check_and_confirms_it(self):
        manager = FakeCrashReports({})
        manager.afc.files = {"DiagnosticLogs/sysdiagnose/sysdiagnose_old.tar.gz": (b"x", 1)}
        adapter.SESSION.update(sysdiagnose=None, phase="acquiring", capturing=False, percent=None,
                               kept=0, discarded=0, receivedBytes=0, storedBytes=0)
        with tempfile.TemporaryDirectory() as work, patch.object(adapter, "diagnostics_api", return_value=manager), \
                patch.object(adapter, "DEEP_POLL_SECONDS", 0.01), patch.object(adapter, "DEEP_CONFIRM_SECONDS", 0):
            waiting = asyncio.create_task(adapter.wait_for_deep_check(object(), Path(work)))
            await asyncio.sleep(0.05)
            status = json.loads((Path(work) / "acquisition-status.json").read_text())
            self.assertEqual(status["phase"], "deep_wait")
            self.assertFalse(waiting.done())  # an older archive does not count
            manager.afc.files["DiagnosticLogs/sysdiagnose/IN_PROGRESS_sysdiagnose_new.tar.gz"] = (b"", 2)
            self.assertTrue(await asyncio.wait_for(waiting, 1))
            self.assertEqual(json.loads((Path(work) / "acquisition-status.json").read_text())["sysdiagnose"], "generating")
        adapter.SESSION["sysdiagnose"] = None

    async def test_the_owner_can_continue_without_the_deep_check(self):
        manager = FakeCrashReports({})
        adapter.SESSION.update(sysdiagnose=None, phase="acquiring", capturing=False, percent=None,
                               kept=0, discarded=0, receivedBytes=0, storedBytes=0)
        with tempfile.TemporaryDirectory() as work, patch.object(adapter, "diagnostics_api", return_value=manager), \
                patch.object(adapter, "DEEP_POLL_SECONDS", 0.01):
            waiting = asyncio.create_task(adapter.wait_for_deep_check(object(), Path(work)))
            await asyncio.sleep(0.05)
            (Path(work) / adapter.DEEP_SKIP).write_text("skip")
            self.assertFalse(await asyncio.wait_for(waiting, 1))
        with tempfile.TemporaryDirectory() as work, patch.object(adapter, "diagnostics_api", return_value=manager), \
                patch.object(adapter, "DEEP_POLL_SECONDS", 0.01):
            # Nobody presses the buttons: the copy goes on after the limit.
            self.assertFalse(await adapter.wait_for_deep_check(object(), Path(work), limit=0.05))

    async def test_a_deep_check_prepared_in_advance_waits_without_a_limit(self):
        manager = FakeCrashReports({})
        adapter.SESSION.update(sysdiagnose=None, phase="acquiring", capturing=False, percent=None,
                               kept=0, discarded=0, receivedBytes=0, storedBytes=0)
        with tempfile.TemporaryDirectory() as work, patch.object(adapter, "diagnostics_api", return_value=manager), \
                patch.object(adapter, "DEEP_POLL_SECONDS", 0.01), patch.object(adapter, "DEEP_CONFIRM_SECONDS", 0):
            waiting = asyncio.create_task(adapter.wait_for_deep_check(object(), Path(work), limit=None))
            await asyncio.sleep(0.1)
            self.assertFalse(waiting.done())  # no deadline: the owner takes their time
            manager.afc.files["DiagnosticLogs/sysdiagnose/IN_PROGRESS_sysdiagnose_now.tar.gz"] = (b"", 2)
            self.assertTrue(await asyncio.wait_for(waiting, 1))
        adapter.SESSION["sysdiagnose"] = None

    async def test_a_confirmed_deep_check_holds_the_copy_until_start(self):
        adapter.SESSION.update(sysdiagnose="generating", phase="deep_wait", capturing=False, percent=None,
                               kept=0, discarded=0, receivedBytes=0, storedBytes=0)
        for choice, network in (("network", True), ("no-network", False)):
            with tempfile.TemporaryDirectory() as work, patch.object(adapter, "START_POLL_SECONDS", 0.01):
                waiting = asyncio.create_task(adapter.wait_for_start(Path(work)))
                await asyncio.sleep(0.05)
                status = json.loads((Path(work) / "acquisition-status.json").read_text())
                self.assertEqual(status["phase"], "deep_ready")
                self.assertFalse(waiting.done())
                (Path(work) / adapter.START_COPY).write_text(choice)
                self.assertEqual(await asyncio.wait_for(waiting, 1), network)
        adapter.SESSION["sysdiagnose"] = None

    async def test_a_hanging_service_is_bounded(self):
        manager = FakeCrashReports({"a.ips": (b"{}", 1)})
        async def hang(root, depth):
            await asyncio.Event().wait()
            yield
        manager.afc.dirlist = hang
        with tempfile.TemporaryDirectory() as work, patch.object(adapter, "diagnostics_api", return_value=manager), \
                patch.object(adapter, "CRASH_STEP_SECONDS", 0.05):
            status = await adapter.collect_diagnostics(object(), Path(work), wait_seconds=0)
        self.assertEqual(status["crashReports"]["status"], "failed")
        self.assertEqual(status["crashReports"]["error"], "TimeoutError")


class Tests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        # Acquisition tests use a phone without crash reports.
        patcher = patch.object(adapter, "diagnostics_api", return_value=FakeCrashReports({}))
        patcher.start()
        self.addCleanup(patcher.stop)

    async def run_backup(self, client, password=False):
        async def connect(**kwargs):
            self.assertEqual(kwargs["connection_type"], "USB")
            self.assertFalse(kwargs["autopair"])
            return client
        with tempfile.TemporaryDirectory() as work, patch.object(adapter, "api", return_value=(None, connect, Backup)):
            return await adapter.acquire("device-1", Path(work), password)

    async def test_existing_pairing_is_never_changed_or_revoked(self):
        client = FakeClient()
        await self.run_backup(client)
        self.assertEqual(client.events, ["backup", "close"])

    async def test_new_pairing_stays_in_memory_and_is_revoked(self):
        client = FakeClient(paired=False)
        await self.run_backup(client)
        self.assertEqual(client.events, ["pair", "backup", "unpair", "close"])

    async def test_encrypted_backup_requests_password_before_acquisition(self):
        client = FakeClient(paired=False, encrypted=True)
        with self.assertRaisesRegex(ValueError, "backup_password_required"):
            await self.run_backup(client)
        self.assertEqual(client.events, ["pair", "unpair", "close"])

    async def test_enumeration_excludes_network_devices_and_preserves_trust_state(self):
        async def devices():
            return [SimpleNamespace(serial="device-1", connection_type="USB"),
                    SimpleNamespace(serial="wireless", connection_type="Network")]
        client = FakeClient(paired=False)
        async def connect(**kwargs):
            self.assertFalse(kwargs["autopair"])
            return client
        with tempfile.TemporaryDirectory() as work, patch.object(adapter, "api", return_value=(devices, connect, Backup)):
            found = await adapter.listing(Path(work))
        self.assertEqual(len(found), 1)
        self.assertFalse(found[0]["authorized"])
        self.assertTrue(found[0]["needsTrust"])
        self.assertEqual(client.events, ["close"])

    async def test_slow_library_loading_does_not_count_against_the_usb_deadline(self):
        async def devices():
            return [SimpleNamespace(serial="device-1", connection_type="USB")]
        async def connect(**kwargs): return FakeClient(paired=True)
        loaded = []
        def slow_api():
            if not loaded:
                import time
                time.sleep(0.3)  # longer than the deadline below
                loaded.append(True)
            return devices, connect, Backup
        out = io.StringIO()
        with tempfile.TemporaryDirectory() as work, patch.object(adapter.Path, "cwd", return_value=Path(work)), \
                patch.object(adapter.sys, "addaudithook"), patch.object(adapter, "api", side_effect=slow_api), \
                patch.object(adapter, "DISCOVERY_SECONDS", 0.2), patch("sys.stdout", out):
            await adapter.main(["list"])
        self.assertEqual(json.loads(out.getvalue())[0]["id"], "device-1")

    async def test_a_phone_that_does_not_answer_is_still_listed_as_needing_trust(self):
        async def devices():
            return [SimpleNamespace(serial="device-1", connection_type="USB")]
        async def connect(**kwargs):
            await asyncio.sleep(60)
        with tempfile.TemporaryDirectory() as work, patch.object(adapter, "api", return_value=(devices, connect, Backup)), \
                patch.object(adapter, "PROBE_SECONDS", 0.05):
            found = await asyncio.wait_for(adapter.listing(Path(work)), 2)
        self.assertEqual([(d["id"], d["authorized"], d["needsTrust"]) for d in found], [("device-1", False, True)])

    async def test_enumeration_reports_the_usb_link_speed_from_usbmuxd(self):
        from pymobiledevice3 import usbmux
        seen = []
        def original(self, response): seen.append(response["MessageType"])
        process = adapter.record_usb_speed(original)
        adapter.USB_SPEEDS.clear()
        for speed in (480000000, True, -1, "fast", 10 ** 12):
            process(None, {"MessageType": "Attached", "Properties": {"SerialNumber": "device-1", "ConnectionSpeed": speed, "ConnectionType": "USB"}})
            if speed != 480000000:
                self.assertEqual(adapter.USB_SPEEDS, {"device-1": 480000000})
        process(None, {"MessageType": "Attached", "Properties": {"SerialNumber": "../x", "ConnectionSpeed": 5}})
        self.assertEqual(adapter.USB_SPEEDS, {"device-1": 480000000})
        self.assertEqual(len(seen), 6)
        async def devices():
            return [SimpleNamespace(serial="device-1", connection_type="USB")]
        async def connect(**kwargs): return FakeClient()
        with tempfile.TemporaryDirectory() as work, patch.object(adapter, "api", return_value=(devices, connect, Backup)):
            found = await adapter.listing(Path(work))
        self.assertEqual(found[0]["usbSpeed"], 480000000)
        adapter.USB_SPEEDS.clear()

    async def test_discovery_transport_failure_is_not_an_empty_device_list(self):
        async def broken():
            raise OSError("synthetic private transport details")
        with tempfile.TemporaryDirectory() as work, patch.object(adapter, "api", return_value=(broken, None, None)):
            with self.assertRaisesRegex(RuntimeError, "^ios_transport_unavailable$"):
                await adapter.listing(Path(work))

    async def test_discovery_deadline_is_distinct_from_interpreter_startup(self):
        async def stalled(work):
            await asyncio.sleep(60)
        with tempfile.TemporaryDirectory() as work, patch.object(adapter.Path, "cwd", return_value=Path(work)), patch.object(adapter.sys, "addaudithook"), patch.object(adapter, "listing", side_effect=stalled), patch.object(adapter, "DISCOVERY_SECONDS", 0.01):
            with self.assertRaisesRegex(RuntimeError, "^ios_discovery_timeout$"):
                await adapter.main(["list"])
            self.assertEqual((Path(work) / "ios-discovery-started").read_text(), "started")

    async def test_capture_records_real_packet_times_and_bounded_raw_ip(self):
        class Capture:
            def __init__(self, client): pass
            async def __aenter__(self): return self
            async def __aexit__(self, *args): pass
            async def watch(self, packets_count):
                yield SimpleNamespace(data=b"\0"*14 + b"\x60" + b"\0"*39, seconds=1000, microseconds=123)
        with tempfile.TemporaryDirectory() as work, patch.object(importlib.import_module("pymobiledevice3.services.pcapd"), "PcapdService", Capture):
            result = await adapter.capture_network(FakeClient(), Path(work))
            self.assertEqual(result["status"], "partial")
            self.assertEqual(result["reason"], "stream_ended")
            self.assertEqual(result["packets"], 1)
            data = (Path(work) / "device-network.pcap").read_bytes()
        self.assertEqual(struct.unpack("<I", data[20:24])[0], 101)
        self.assertEqual(struct.unpack("<IIII", data[24:40]), (1000, 123, 40, 40))
        self.assertEqual(data[40] >> 4, 6)

    async def test_capture_waits_for_full_observation_even_without_traffic(self):
        self.assertEqual(adapter.NETWORK_SECONDS, 120)
        class Capture:
            def __init__(self, client): pass
            async def __aenter__(self): return self
            async def __aexit__(self, *args): pass
            async def watch(self, packets_count):
                await asyncio.sleep(10)
                if False: yield None
        with tempfile.TemporaryDirectory() as work, patch.object(importlib.import_module("pymobiledevice3.services.pcapd"), "PcapdService", Capture), patch.object(adapter, "NETWORK_SECONDS", 0.02):
            result = await adapter.capture_network(FakeClient(), Path(work))
        self.assertEqual(result["status"], "completed")
        self.assertGreaterEqual(result["durationSeconds"], 0.02)
        self.assertEqual(result["packets"], 0)

    async def test_large_media_frames_are_drained_in_small_chunks_without_storage(self):
        from pymobiledevice3.services.device_link import CODE_FILE_DATA, CODE_SUCCESS, SIZE_FORMAT, CODE_FORMAT
        class Link:
            remaining = 40 * 1024 * 1024
            largest = 0
            header = False
            async def _recvall(self, size):
                self.largest = max(self.largest, size)
                if self.remaining:
                    self.remaining -= size
                    return b"x" * size
                if not self.header:
                    self.header = True
                    return struct.pack(SIZE_FORMAT, struct.calcsize(CODE_FORMAT))
                return struct.pack(CODE_FORMAT, CODE_SUCCESS)
        link = Link()
        self.assertEqual(await adapter.stream_transfer(link, link.remaining, CODE_FILE_DATA), (0, CODE_SUCCESS))
        self.assertLessEqual(link.largest, 64 * 1024)
        self.assertEqual(link.remaining, 0)

    def test_selective_media_policy_keeps_metadata_and_possible_exploit_attachments(self):
        for path in ["/var/mobile/Media/DCIM/100APPLE/IMG_1.HEIC", "CameraRollDomain/Media/DCIM/100APPLE/clip.MOV", "MediaDomain-DCIM/100APPLE/photo.jpg", "/var/mobile/Media/PhotoData/Thumbnails/1.png"]:
            self.assertFalse(adapter.keep_forensic_file(SimpleNamespace(device_name=path)))
        for path in ["/var/mobile/Media/PhotoData/Photos.sqlite", "/var/mobile/Media/DCIM/database.db", "HomeDomain/Library/SMS/Attachments/photo.jpg", "AppDomain-com.test/Documents/payload.png", "opaque-hash", "MediaDomain/DCIM/suspicious.bin"]:
            self.assertTrue(adapter.keep_forensic_file(SimpleNamespace(device_name=path)))
        self.assertTrue(adapter.keep_forensic_file(SimpleNamespace(device_name=None)))

    async def test_backup_uses_selection_without_mutating_the_device_manifest(self):
        class SelectedBackup(Backup):
            async def backup(self, full, backup_directory, **kwargs):
                self_test.assertFalse(kwargs["patch_manifest"])
                select = kwargs["filter_callback"]
                self_test.assertFalse(select(SimpleNamespace(device_name="/var/mobile/Media/DCIM/1.MOV")))
                self_test.assertTrue(select(SimpleNamespace(device_name="HomeDomain/Library/SMS/sms.db")))
                await super().backup(full, backup_directory)
        self_test = self
        async def connect(**kwargs): return FakeClient()
        with tempfile.TemporaryDirectory() as work, patch.object(adapter, "api", return_value=(None, connect, SelectedBackup)):
            await adapter.acquire("device-1", Path(work), False)
            import json
            summary = json.loads((Path(work) / "acquisition-summary.json").read_text())
            self.assertEqual(summary["excludedMediaFiles"], 1)
            self.assertTrue(summary["manifestPreserved"])

    async def test_unfinished_backup_is_never_reported_as_acquired(self):
        class InterruptedBackup(Backup):
            async def backup(self, full, backup_directory, **kwargs):
                await super().backup(full, backup_directory)
                (backup_directory / "device-1/Status.plist").write_bytes(plistlib.dumps({"SnapshotState": "in-progress"}))
        async def connect(**kwargs): return FakeClient()
        with tempfile.TemporaryDirectory() as work, patch.object(adapter, "api", return_value=(None, connect, InterruptedBackup)):
            with self.assertRaisesRegex(ValueError, "acquisition_incomplete"):
                await adapter.acquire("device-1", Path(work), False)

    async def test_locked_phone_is_reported_distinctly_and_temporary_pair_is_revoked(self):
        # Error observed on a physical iPhone 15 Pro when the passcode prompt timed out.
        class LockedBackup(Backup):
            async def backup(self, full, backup_directory, **kwargs):
                raise RuntimeError("The device reported an error: {'ErrorCode': 208, "
                                   "'ErrorDescription': 'Device locked (MBErrorDomain/208)'}")
        client = FakeClient(paired=False)
        async def connect(**kwargs): return client
        with tempfile.TemporaryDirectory() as work, patch.object(adapter, "api", return_value=(None, connect, LockedBackup)):
            with self.assertRaisesRegex(ValueError, "device_locked"):
                await adapter.acquire("device-1", Path(work), False)
        self.assertIn("unpair", client.events)
        self.assertFalse(adapter.device_locked(RuntimeError("other failure")))

    async def test_an_unanswered_passcode_prompt_restarts_the_copy_after_a_notice(self):
        from pymobiledevice3.services import mobilebackup2 as backup
        attempts, phases = [], []
        class TimesOutOnce(Backup):
            async def backup(self, full, backup_directory, **kwargs):
                attempts.append(sorted(p.name for p in backup_directory.iterdir()))
                if len(attempts) == 1:
                    (backup_directory / "partial").write_bytes(b"x")
                    adapter.observe_backup_notification(self, {"Name": backup.NP_LOCAL_AUTH_PRESENTED})
                    raise RuntimeError("The device reported an error: {'ErrorCode': 208}")
                phases.append(json.loads((backup_directory.parent / "acquisition-status.json").read_text())["phase"])
                await super().backup(full, backup_directory)
        client = FakeClient(paired=False)
        async def connect(**kwargs): return client
        with tempfile.TemporaryDirectory() as work, patch.object(adapter, "api", return_value=(None, connect, TimesOutOnce)), \
                patch.object(adapter, "PASSCODE_RETRY_PAUSE", 0), \
                patch.object(adapter, "phase", side_effect=lambda w, name: (phases.append(name), adapter.SESSION.update(phase=name))):
            target = await adapter.acquire("device-1", Path(work), False)
            self.assertTrue((target / "Manifest.db").is_file())
        # The partial first copy is discarded, and the notice came before the retry.
        self.assertEqual(attempts, [[], []])
        self.assertIn("passcode_retry", phases)
        self.assertLess(phases.index("passcode_retry"), len(phases) - 1)

    async def test_passcode_retries_are_bounded_and_a_locked_phone_is_not_retried(self):
        from pymobiledevice3.services import mobilebackup2 as backup
        for prompts, code, expected_attempts in ((True, "device_passcode_timeout", 3), (False, "device_locked", 1)):
            attempts = []
            class Locked(Backup):
                async def backup(self, full, backup_directory, **kwargs):
                    attempts.append(1)
                    if prompts:
                        adapter.observe_backup_notification(self, {"Name": backup.NP_LOCAL_AUTH_PRESENTED})
                    raise RuntimeError("Device locked (MBErrorDomain/208)")
            async def connect(**kwargs): return FakeClient()
            with tempfile.TemporaryDirectory() as work, patch.object(adapter, "api", return_value=(None, connect, Locked)), \
                    patch.object(adapter, "PASSCODE_RETRY_PAUSE", 0):
                with self.assertRaisesRegex(ValueError, "^" + code + "$"):
                    await adapter.acquire("device-1", Path(work), False)
            self.assertEqual(len(attempts), expected_attempts, code)

    async def test_phone_notifications_become_guidance_phases(self):
        from pymobiledevice3.services import mobilebackup2 as backup
        seen = []
        class PromptingBackup(Backup):
            async def backup(self, full, backup_directory, **kwargs):
                work = backup_directory.parent
                adapter.observe_backup_notification(self, {"Name": backup.NP_LOCAL_AUTH_PRESENTED})
                seen.append(json.loads((work / "acquisition-status.json").read_text())["phase"])
                adapter.observe_backup_notification(self, {"Name": backup.NP_LOCAL_AUTH_DISMISSED})
                seen.append(json.loads((work / "acquisition-status.json").read_text())["phase"])
                await super().backup(full, backup_directory)
        async def connect(**kwargs): return FakeClient()
        with tempfile.TemporaryDirectory() as work, patch.object(adapter, "api", return_value=(None, connect, PromptingBackup)):
            await adapter.acquire("device-1", Path(work), False)
        self.assertEqual(seen, ["awaiting_passcode", "acquiring"])

    async def test_progress_reports_phone_percentage_and_kept_and_discarded_files(self):
        published = []
        class ProgressBackup(Backup):
            async def backup(self, full, backup_directory, **kwargs):
                kwargs["progress_callback"](12.5)
                kwargs["progress_callback"](7.0)  # never moves backwards
                kwargs["filter_callback"](SimpleNamespace(device_name="HomeDomain/Library/SMS/sms.db"))
                kwargs["filter_callback"](SimpleNamespace(device_name="CameraRollDomain/Media/DCIM/100APPLE/IMG_1.HEIC"))
                adapter.publish(backup_directory.parent)
                published.append(json.loads((backup_directory.parent / "acquisition-status.json").read_text()))
                await super().backup(full, backup_directory)
        async def connect(**kwargs): return FakeClient()
        with tempfile.TemporaryDirectory() as work, patch.object(adapter, "api", return_value=(None, connect, ProgressBackup)):
            await adapter.acquire("device-1", Path(work), False)
        self.assertEqual(published[0]["phase"], "acquiring")
        self.assertEqual(published[0]["percent"], 12.5)
        self.assertEqual((published[0]["kept"], published[0]["discarded"]), (1, 1))

    async def test_copy_cancelled_on_the_phone_is_reported_as_such(self):
        from pymobiledevice3.services import mobilebackup2 as backup
        class CancelledBackup(Backup):
            async def backup(self, full, backup_directory, **kwargs):
                adapter.observe_backup_notification(self, {"Name": backup.NP_SYNC_CANCEL_REQUEST})
                raise RuntimeError("The device reported an error")
        async def connect(**kwargs): return FakeClient()
        with tempfile.TemporaryDirectory() as work, patch.object(adapter, "api", return_value=(None, connect, CancelledBackup)):
            with self.assertRaisesRegex(ValueError, "device_cancelled"):
                await adapter.acquire("device-1", Path(work), False)

    async def test_unplugged_phone_is_reported_as_disconnected(self):
        from pymobiledevice3.exceptions import ConnectionTerminatedError
        class UnpluggedBackup(Backup):
            async def backup(self, full, backup_directory, **kwargs):
                raise ConnectionTerminatedError()
        async def connect(**kwargs): return FakeClient()
        with tempfile.TemporaryDirectory() as work, patch.object(adapter, "api", return_value=(None, connect, UnpluggedBackup)):
            with self.assertRaisesRegex(ValueError, "device_disconnected"):
                await adapter.acquire("device-1", Path(work), False)

    async def test_trust_prompt_is_announced_and_refusal_or_lock_is_distinct(self):
        from pymobiledevice3.exceptions import UserDeniedPairingError, PasswordRequiredError, PairingDialogResponsePendingError
        waits = []
        for failure, code in ((UserDeniedPairingError(), "device_trust_denied"),
                              (PairingDialogResponsePendingError(), "device_not_trusted"),
                              (PasswordRequiredError(), "device_locked")):
            client = FakeClient(paired=False)
            phases = []
            async def pair(timeout, client=client, failure=failure):
                waits.append(timeout)
                phases.append(json.loads((work_path / "acquisition-status.json").read_text())["phase"])
                raise failure
            client.pair = pair
            async def connect(**kwargs): return client
            with tempfile.TemporaryDirectory() as work, patch.object(adapter, "api", return_value=(None, connect, Backup)):
                work_path = Path(work)
                with self.assertRaisesRegex(ValueError, code):
                    await adapter.acquire("device-1", work_path, False)
            self.assertEqual(phases, ["awaiting_trust"])
            self.assertIn("close", client.events)
        # The phone may show "Trust This Computer?" for three minutes.
        self.assertEqual(set(waits), {180})

    async def test_phone_is_told_there_is_room_but_local_guard_still_applies(self):
        statuses = []
        class Link:
            root_path = Path(tempfile.gettempdir())
            _reported_free_space = None
            async def status_response(self, code, status_dict=None):
                statuses.append((code, status_dict))
        link = Link()
        await adapter.report_room_for_selective_copy(link, ["DLMessageGetFreeDiskSpace"])
        self.assertEqual(statuses, [(0, adapter.REPORTED_FREE_SPACE)])
        self.assertEqual(link._reported_free_space, adapter.REPORTED_FREE_SPACE)
        # A refusal the phone still issues is reported as a space problem.
        from pymobiledevice3.exceptions import NotEnoughDiskSpaceError
        self.assertEqual(adapter.classify(NotEnoughDiskSpaceError("MBErrorDomain/105")), "insufficient_disk_space")

    async def test_low_disk_space_stops_before_backup_and_temporary_pair_is_revoked(self):
        client = FakeClient(paired=False)
        with patch.object(adapter.shutil, "disk_usage", return_value=SimpleNamespace(free=0)):
            with self.assertRaisesRegex(ValueError, "insufficient_disk_space"):
                await self.run_backup(client)
        self.assertIn("unpair", client.events)

    async def run_with_network(self, backup_cls, capture_cls, seconds=0.2):
        async def connect(**kwargs): return FakeClient()
        pcapd = importlib.import_module("pymobiledevice3.services.pcapd")
        work = tempfile.TemporaryDirectory()
        self.addCleanup(work.cleanup)
        with patch.object(adapter, "api", return_value=(None, connect, backup_cls)), \
                patch.object(pcapd, "PcapdService", capture_cls), patch.object(adapter, "NETWORK_SECONDS", seconds):
            try:
                await adapter.acquire("device-1", Path(work.name), False, capture=True)
                error = None
            except ValueError as failure:
                error = failure
        network = json.loads((Path(work.name) / "network-status.json").read_text())
        return Path(work.name), network, error

    class SlowCapture:
        started = None
        def __init__(self, client): pass
        async def __aenter__(self):
            type(self).started = asyncio.get_running_loop().time()
            return self
        async def __aexit__(self, *args): pass
        async def watch(self, packets_count):
            while True:
                await asyncio.sleep(0.01)
                yield SimpleNamespace(data=b"\0"*14 + b"\x45" + b"\0"*19, seconds=1, microseconds=0)

    async def test_copy_starts_immediately_while_network_is_observed_in_parallel(self):
        timeline = {}
        class QuickBackup(Backup):
            async def backup(self, full, backup_directory, **kwargs):
                work = backup_directory.parent
                loop = asyncio.get_running_loop()
                timeline["backup"] = loop.time()
                await asyncio.sleep(0.05)
                status = json.loads((work / "acquisition-status.json").read_text())
                timeline["status"] = status
                await super().backup(full, backup_directory)
        capture = self.SlowCapture
        work, network, error = await self.run_with_network(QuickBackup, capture)
        self.assertIsNone(error)
        # The phone's prompts come from the backup, which starts before the
        # observation window ends; the phase stays "acquiring" and flags capture.
        self.assertLess(timeline["backup"] - capture.started, 0.1)
        self.assertEqual(timeline["status"]["phase"], "acquiring")
        self.assertTrue(timeline["status"]["capturing"])
        # A backup shorter than the window still waits for the full observation.
        self.assertEqual(network["status"], "completed")
        self.assertGreaterEqual(network["durationSeconds"], 0.2)
        self.assertFalse(json.loads((work / "acquisition-status.json").read_text())["capturing"])

    async def test_failed_copy_ends_observation_as_partial_not_completed(self):
        from pymobiledevice3.exceptions import ConnectionTerminatedError
        class FailingBackup(Backup):
            async def backup(self, full, backup_directory, **kwargs):
                await asyncio.sleep(0.05)
                raise ConnectionTerminatedError()
        _, network, error = await self.run_with_network(FailingBackup, self.SlowCapture, seconds=5)
        self.assertEqual(str(error), "device_disconnected")
        self.assertEqual(network["status"], "partial")
        self.assertEqual(network["reason"], "interrupted")

    async def test_network_service_failure_never_blocks_the_copy(self):
        class Unavailable:
            def __init__(self, client): pass
            async def __aenter__(self): raise OSError("synthetic pcapd failure")
            async def __aexit__(self, *args): pass
        work, network, error = await self.run_with_network(Backup, Unavailable)
        self.assertIsNone(error)
        self.assertTrue((work / "ios-backup/device-1/Manifest.db").is_file())
        self.assertEqual((network["status"], network["reason"]), ("partial", "interrupted"))

    async def test_closing_the_passcode_prompt_restores_the_previous_phase(self):
        from pymobiledevice3.services import mobilebackup2 as backup
        with tempfile.TemporaryDirectory() as work:
            adapter.SESSION.update(work=Path(work), phase="awaiting_trust", before_prompt=None)
            adapter.observe_backup_notification(None, {"Name": backup.NP_LOCAL_AUTH_PRESENTED})
            adapter.observe_backup_notification(None, {"Name": backup.NP_LOCAL_AUTH_PRESENTED})
            self.assertEqual(adapter.SESSION["phase"], "awaiting_passcode")
            adapter.observe_backup_notification(None, {"Name": backup.NP_LOCAL_AUTH_DISMISSED})
            self.assertEqual(adapter.SESSION["phase"], "awaiting_trust")
            # A stray dismissal never overrides the current phase.
            adapter.observe_backup_notification(None, {"Name": backup.NP_LOCAL_AUTH_DISMISSED})
            self.assertEqual(adapter.SESSION["phase"], "awaiting_trust")
            adapter.SESSION.update(work=None, phase="acquiring")

    def test_unclassified_failures_expose_only_exception_class_names(self):
        try:
            try:
                raise OSError(28, "secret /private/path iPhone-of-Someone 00008110-AAAA")
            except OSError as inner:
                raise RuntimeError("The device reported: secret message") from inner
        except RuntimeError as error:
            diagnostic = adapter.failure_diagnostic(error)
        self.assertEqual(diagnostic, "exc:RuntimeError>OSError")
        self.assertEqual(adapter.failure_diagnostic(ValueError("device_locked")), "device_locked")
        self.assertEqual(adapter.failure_diagnostic(ValueError("acquisition_incomplete")), "acquisition_incomplete")
        import io, contextlib
        stderr = io.StringIO()
        with contextlib.redirect_stderr(stderr):
            code = adapter.report_failure(TimeoutError("private"))
        self.assertEqual(code, 1)
        self.assertEqual(stderr.getvalue(), "ios_transport_failed\ndiagnostic:exc:TimeoutError\n")
        self.assertNotIn("private", stderr.getvalue())

    def test_file_size_limit_failure_is_reported_as_an_exception_class(self):
        # Reproduces the ~11-minute cut on a physical iPhone: engines ran with
        # RLIMIT_FSIZE = 2 GiB, Python ignores SIGXFSZ, so writing a backup file
        # past the limit raised EFBIG inside the transfer and the adapter exited,
        # closing the USB connection, with only a generic failure. Here the
        # limit is 1 MiB and the frame 2 MiB.
        import subprocess, sys, textwrap
        script = textwrap.dedent(f"""
            import asyncio, resource, struct, sys, tempfile
            sys.path.insert(0, {str(Path(__file__).resolve().parent)!r})
            import ios_entry as adapter
            from pymobiledevice3.services.device_link import CODE_FILE_DATA
            resource.setrlimit(resource.RLIMIT_FSIZE, (1024 * 1024, 1024 * 1024))
            class Link:
                root_path = tempfile.gettempdir()
                async def _recvall(self, size): return b"x" * size
            async def run():
                with tempfile.TemporaryFile() as output:
                    await adapter.stream_transfer(Link(), 2 * 1024 * 1024, CODE_FILE_DATA, output)
            try:
                asyncio.run(run())
            except Exception as error:
                import errno
                print(getattr(error, "errno", None) == errno.EFBIG, adapter.failure_diagnostic(error))
        """)
        result = subprocess.run([sys.executable, "-c", script], capture_output=True, text=True, timeout=60)
        self.assertRegex(result.stdout.strip(), r"^True exc:OSError(>OSError)?$", result.stderr)

    @unittest.skipUnless(os.name == "posix", "Windows relies on the runtime's job object")
    async def test_copy_stops_and_removes_its_data_when_the_app_exits(self):
        # Found on a physical run: the app restarted mid-copy and the
        # adapter kept copying the iPhone, orphaned, into an unmanaged folder.
        import subprocess, sys
        parent = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(30)"])
        stopped = []
        class EndlessBackup(Backup):
            async def backup(self, full, backup_directory, **kwargs):
                (backup_directory / "partial").write_bytes(b"private")
                try:
                    await asyncio.sleep(60)
                except asyncio.CancelledError:
                    stopped.append(True)
                    raise
        client = FakeClient(paired=False)
        async def connect(**kwargs): return client
        work = Path(tempfile.mkdtemp())
        with patch.object(adapter, "api", return_value=(None, connect, EndlessBackup)), \
                patch.dict(adapter.os.environ, {"ENIGM_PARENT_PID": str(parent.pid)}), \
                patch.object(adapter, "PARENT_POLL_SECONDS", 0.05):
            running = asyncio.create_task(adapter.unless_parent_exits(adapter.acquire("device-1", work, False), work))
            await asyncio.sleep(0.3)
            self.assertTrue((work / "ios-backup/partial").exists())
            parent.kill(); parent.wait()
            with self.assertRaisesRegex(RuntimeError, "^parent_exited$"):
                await asyncio.wait_for(running, 5)
        self.assertEqual(stopped, [True])
        self.assertFalse(work.exists())
        self.assertIn("unpair", client.events)  # temporary pairing still revoked
        self.assertEqual(adapter.failure_diagnostic(RuntimeError("parent_exited")), "parent_exited")

    async def test_without_a_parent_pid_the_acquisition_runs_unchanged(self):
        async def operation(): return "done"
        with patch.dict(adapter.os.environ, {}, clear=False):
            adapter.os.environ.pop("ENIGM_PARENT_PID", None)
            self.assertEqual(await adapter.unless_parent_exits(operation(), Path("/nonexistent")), "done")
        for bad in ("", "1", "abc", "-5", "99999999999"):
            with patch.dict(adapter.os.environ, {"ENIGM_PARENT_PID": bad}):
                self.assertIsNone(adapter.parent_pid())
        # Never probe with os.kill on Windows, where it terminates the process.
        with patch.dict(adapter.os.environ, {"ENIGM_PARENT_PID": "4242"}), patch.object(adapter.os, "name", "nt"):
            self.assertIsNone(adapter.parent_pid())

    def test_network_policy_denies_external_and_arbitrary_local_services(self):
        for address in [("example.com", 443), ("127.0.0.1", 80), ("192.168.1.1", 27015)]:
            with self.assertRaises(PermissionError):
                adapter.usb_only("socket.connect", (SimpleNamespace(family=socket.AF_INET), address))
        adapter.usb_only("socket.connect", (SimpleNamespace(family=socket.AF_INET), ("127.0.0.1", 27015)))
        if hasattr(socket, "AF_UNIX"):
            adapter.usb_only("socket.connect", (SimpleNamespace(family=socket.AF_UNIX), "/var/run/usbmuxd"))
        # Connected-stream sendmsg (asyncio's multi-buffer write) is allowed;
        # addressed sends and other lookups stay denied.
        adapter.usb_only("socket.sendmsg", (SimpleNamespace(family=socket.AF_UNIX), None))
        for event, args in [("socket.sendmsg", (None, ("192.168.1.1", 53))), ("socket.sendto", (None, ("8.8.8.8", 53))),
                            ("socket.getaddrinfo", ("example.com", 443, 0, 0, 0)), ("socket.bind", (None, ("0.0.0.0", 0)))]:
            with self.assertRaises(PermissionError):
                adapter.usb_only(event, args)
        self.assertFalse(adapter.valid_id("../device"))
        self.assertFalse(adapter.valid_id("-u device"))

if __name__ == "__main__":
    unittest.main()
