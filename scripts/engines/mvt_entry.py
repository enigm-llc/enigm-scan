"""Enigm's offline entry point for the separately licensed MVT package.
No MVT source is copied here. The build collects the installed pinned distribution.
"""
import os
import sys
import json
from pathlib import Path


def observe_modules():
    """Instrument the pinned public API; never infer coverage from exit code alone."""
    from mvt.common import module as api
    original = api.run_module
    coverage = []

    def observed(module):
        entry = {"module": type(module).__name__, "extraction": "skipped", "indicators": "skipped"}
        saved = {}
        for method, key in [("run", "extraction"), ("check_indicators", "indicators")]:
            call = getattr(module, method)
            saved[method] = call

            def tracked(call=call, key=key):
                try:
                    result = call()
                except NotImplementedError:
                    # A module without indicator matching has nothing to compare;
                    # a module that cannot extract from this source did not run.
                    entry[key] = "none" if key == "indicators" else "skipped"
                    raise
                except (api.DatabaseNotFoundError, api.InsufficientPrivileges):
                    entry[key] = "skipped"
                    raise
                except Exception:
                    entry[key] = "failed"
                    raise
                else:
                    # Ran without error but the phone had no data of this kind.
                    entry[key] = "empty" if key == "extraction" and not module.results else "completed"
                    return result
            setattr(module, method, tracked)
        try:
            return original(module)
        finally:
            for method, call in saved.items():
                setattr(module, method, call)
            if len(coverage) < 250:
                coverage.append(entry)

    api.run_module = observed
    return coverage


def deny_network(event, _args):
    if event in {"socket.connect", "socket.connect_ex", "socket.getaddrinfo", "socket.gethostbyname", "socket.sendto", "socket.sendmsg"}:
        raise PermissionError("Network access is disabled in Enigm Scan's forensic engine")


def decrypt_backup(source, destination, secret_input):
    """Pinned MVT adapter; failures caught upstream must not look successful."""
    from mvt.ios.decrypt import DecryptBackup
    password = secret_input.read(4097)
    if not password or len(password) > 4096:
        raise ValueError("invalid password input")
    password = password.decode("utf-8")
    backup = DecryptBackup(source, destination, max_workers=1)
    backup.decrypt_with_password(password)
    del password
    if not backup.can_process():
        raise ValueError("backup could not be unlocked")
    # Single-worker processing catches individual extraction exceptions in MVT.
    # Track those before the catch so a partial decryption cannot be accepted.
    original = backup._process_file
    failed = False
    def process_file(**kwargs):
        nonlocal failed
        try:
            return original(**kwargs)
        except Exception:
            failed = True
            raise
    backup._process_file = process_file
    backup.process_backup()
    if failed or not (Path(destination) / "Manifest.db").is_file():
        raise ValueError("backup decryption incomplete")


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in {"ios", "android", "ios-decrypt"}:
        raise SystemExit("An explicit ios or android adapter is required")
    platform = sys.argv.pop(1)
    os.environ["MVT_NETWORK_ACCESS_ALLOWED"] = "false"
    os.environ.pop("MVT_VT_API_KEY", None)
    sys.addaudithook(deny_network)
    if platform == "ios-decrypt":
        if len(sys.argv) != 3:
            raise SystemExit("Explicit source and destination are required")
        try:
            decrypt_backup(sys.argv[1], sys.argv[2], sys.stdin.buffer)
        except Exception:
            # Never print the password, parser exception or backup contents.
            raise SystemExit("Backup decryption failed") from None
        return
    coverage = observe_modules()
    if platform == "ios":
        from mvt.ios.cli import main as run
    else:
        from mvt.android.cli import main as run
    try:
        run()
    finally:
        # The native adapter controls cwd; only module names/statuses are retained.
        if os.environ.get("ENIGM_MVT_COVERAGE") == "1":
            Path("mvt-coverage.json").write_text(json.dumps(coverage), encoding="utf-8")


if __name__ == "__main__":
    main()
