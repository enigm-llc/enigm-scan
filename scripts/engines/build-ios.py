"""Package only the fixed USB adapter, not pymobiledevice3's general-purpose CLI."""
import hashlib
import importlib.metadata as metadata
import json
import os
from pathlib import Path
import subprocess
import sys
import zipfile
sys.path.insert(0, str(Path(__file__).resolve().parent))
from engine_tree import install  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
VERSION = "11.45.0"
if metadata.version("pymobiledevice3") != VERSION:
    raise SystemExit("Install the pinned iOS transport first")
work = ROOT / ".local-tools/ios-build"
resources = ROOT / "src-tauri/resources/engines"
work.mkdir(parents=True, exist_ok=True)
# One-dir, not one-file: a one-file build unpacks its libraries into a new
# temporary folder on every run, and macOS checks each new library before it
# loads (measured at about 40 s per run on a Mac). A folder inside the app
# keeps the same files, checked once. IPython and its completion data (jedi,
# parso: thousands of files) come with pymobiledevice3's interactive shell,
# which this adapter never uses.
subprocess.run([sys.executable, "-m", "PyInstaller", "--noconfirm", "--clean", "--onedir",
    "--name", "ios-usb", "--distpath", str(work / "dist"), "--workpath", str(work / "work"),
    "--specpath", str(work), "--collect-data", "pymobiledevice3",
    "--exclude-module", "IPython", "--exclude-module", "jedi", "--exclude-module", "parso",
    "--copy-metadata", "pymobiledevice3", str(ROOT / "scripts/engines/ios_entry.py")], check=True)
filename = "ios-usb.exe" if sys.platform == "win32" else "ios-usb"
exe = work / "dist" / "ios-usb" / filename
result = subprocess.run([str(exe), "self-check"], capture_output=True, timeout=90, check=True)
if json.loads(result.stdout)["version"] != VERSION:
    raise SystemExit("Packaged iOS adapter version mismatch")
resources.mkdir(parents=True, exist_ok=True)
for stale in [resources / filename]:
    if stale.is_file():
        stale.unlink()  # earlier one-file layout
installed, tree_sha = install(work / "dist" / "ios-usb", resources, "ios-usb")
manifest_path = resources / "manifest.json"
manifest = [item for item in json.loads(manifest_path.read_text()) if item["id"] != "ios-usb"]
manifest.append({"id": "ios-usb", "file": "ios-usb/" + filename, "version": VERSION,
                 "sha256": hashlib.sha256(installed.read_bytes()).hexdigest(),
                 "tree": "ios-usb", "tree_sha256": tree_sha})
manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
# GPL upstream source and our wrapper/build source accompany the executable.
notices = resources / "notices"
notices.mkdir(exist_ok=True)
dist = metadata.distribution("pymobiledevice3")
with zipfile.ZipFile(notices / "ios-usb-corresponding-source.zip", "w", zipfile.ZIP_DEFLATED) as out:
    for relative in dist.files or []:
        path = dist.locate_file(relative)
        if path.is_file() and ".." not in Path(relative).parts and (str(relative).endswith((".py", ".json", ".pem")) or "license" in str(relative).lower() or str(relative).endswith("METADATA")):
            out.write(path, str(relative))
    for name in ["ios_entry.py", "build-ios.py", "ios-requirements.txt"]:
        out.write(ROOT / "scripts/engines" / name, "enigm/" + name)
print(json.dumps({"transport": "ios-usb", "version": VERSION}))
