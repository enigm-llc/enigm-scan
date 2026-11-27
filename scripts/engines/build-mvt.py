"""Build the pinned offline MVT sidecar on the current target OS."""
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from ios_fixture import encrypted_fixture, PASSWORD, PAYLOAD, FILE_ID
from engine_tree import drop_python_framework, install

ROOT = Path(__file__).resolve().parents[2]
VERSION = "2026.10.12"
if importlib.metadata.version("mvt") != VERSION:
    raise SystemExit("Install exactly mvt==2026.10.12 before packaging")
work = ROOT / ".local-tools" / "mvt-build"
work.mkdir(parents=True, exist_ok=True)
env = {**os.environ, "MVT_CONFIG_FOLDER": str(work / "config"), "MVT_NETWORK_ACCESS_ALLOWED": "false"}
# One-dir for the same reason as the iPhone adapter (see build-ios.py).
args = [sys.executable, "-m", "PyInstaller", "--noconfirm", "--clean", "--onedir",
        "--exclude-module", "IPython", "--exclude-module", "jedi", "--exclude-module", "parso", "--name", "mvt-engine", "--distpath", str(work / "dist"), "--workpath", str(work / "work"), "--specpath", str(work), "--copy-metadata", "mvt", "--collect-all", "mvt", "--collect-all", "tld", "--collect-all", "tzdata", str(ROOT / "scripts/engines/mvt_entry.py")]
subprocess.run(args, env=env, check=True)
filename = "mvt-engine.exe" if sys.platform == "win32" else "mvt-engine"
exe = work / "dist" / "mvt-engine" / filename
drop_python_framework(work / "dist" / "mvt-engine")
# Smoke-check both parser entry points using the packaged executable, offline.
for platform, command in [("ios", "check-backup"), ("android", "check-androidqf")]:
    result = subprocess.run([str(exe), platform, "--disable-update-check", "--disable-indicator-update-check", command, "--help"], env=env, check=True, capture_output=True, timeout=60)
    if command.encode() not in result.stdout:
        raise SystemExit("Packaged engine did not expose the expected adapter")
# Execute a synthetic acquisition through the packaged parser, not only --help.
with tempfile.TemporaryDirectory(prefix="enigm-mvt-fixture-", dir=work) as folder:
    fixture = Path(folder)
    evidence = fixture / "androidqf"
    evidence.mkdir()
    (evidence / "getprop.txt").write_text("[ro.product.model]: [Synthetic fixture]\\n[persist.sys.timezone]: [UTC]\\n".replace("\\n", "\n"), encoding="utf-8")
    fixture_env = {**env, "ENIGM_MVT_COVERAGE": "1"}
    result = subprocess.run([str(exe), "android", "--disable-update-check", "--disable-indicator-update-check", "check-androidqf", "--non-interactive", "--output", str(fixture / "output"), str(evidence)], cwd=fixture, env=fixture_env, capture_output=True, timeout=90)
    if result.returncode != 0:
        raise SystemExit("Packaged MVT failed the synthetic acquisition test")
    coverage = json.loads((fixture / "mvt-coverage.json").read_text(encoding="utf-8"))
    if not any(item["module"] == "AQFGetProp" and item["extraction"] == "completed" for item in coverage):
        raise SystemExit("Packaged MVT did not parse the synthetic artifact")
    encrypted = fixture / "encrypted-ios"
    encrypted_fixture(encrypted)
    for password, name, succeeds in [(b"wrong-password", "wrong", False), (PASSWORD.encode(), "decrypted", True)]:
        output = fixture / name
        result = subprocess.run([str(exe), "ios-decrypt", str(encrypted), str(output)], input=password,
                                cwd=fixture, env=fixture_env, capture_output=True, timeout=60)
        if (result.returncode == 0) != succeeds or password in result.stdout + result.stderr:
            raise SystemExit("Packaged backup password handling failed")
        if succeeds and (output / FILE_ID[:2] / FILE_ID).read_bytes() != PAYLOAD:
            raise SystemExit("Packaged backup decryption did not reproduce the synthetic artifact")
resources = ROOT / "src-tauri/resources/engines"
resources.mkdir(parents=True, exist_ok=True)
if (resources / filename).is_file():
    (resources / filename).unlink()  # earlier one-file layout
installed, tree_sha = install(work / "dist" / "mvt-engine", resources, "mvt-engine")
sha = hashlib.sha256(installed.read_bytes()).hexdigest()
manifest_path = resources / "manifest.json"
manifest = json.loads(manifest_path.read_text())
manifest = [entry for entry in manifest if entry["id"] not in {"mvt-ios", "mvt-android"}]
manifest += [{"id": "mvt-" + platform, "file": "mvt-engine/" + filename, "version": VERSION, "sha256": sha,
              "tree": "mvt-engine", "tree_sha256": tree_sha} for platform in ["ios", "android"]]
manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
# Preserve upstream distribution license and installed dependency metadata.
notices = resources / "notices"
notices.mkdir(exist_ok=True)
for dist in importlib.metadata.distributions():
    name = dist.metadata.get("Name", "unknown").replace("/", "_")
    for relative in dist.files or []:
        if "license" in str(relative).lower() and ("dist-info" in str(relative)):
            candidate = dist.locate_file(relative)
            if candidate.is_file():
                (notices / (name + "-" + candidate.name)).write_bytes(candidate.read_bytes())
(resources / "python-sbom.json").write_text(json.dumps([{"name": d.metadata.get("Name"), "version": d.version} for d in importlib.metadata.distributions()], indent=2) + "\n")
print(json.dumps({"engine": "MVT", "version": VERSION, "sha256": sha}))

# Rule-source attribution must accompany redistributed native bundles.
for name in ["LICENSE", "AMNESTY_ATTRIBUTION.txt"]:
    source_notice = ROOT / "intelligence/sources" / name
    if source_notice.is_file():
        (notices / ("indicator-source-" + name)).write_bytes(source_notice.read_bytes())
