"""Digest of a folder engine (PyInstaller one-dir), identical to `tree_digest`
in agent/runtime/src/engines.rs: one line per regular file ("F", path, SHA-256)
and per relative link that stays inside the folder ("L", path, target), sorted
by path bytes and joined with newlines. Paths use "/" on every system."""
import hashlib
import os
import stat
import sys
from pathlib import Path

MAX_ENTRIES = 20_000
MAX_BYTES = 2 * 1024 ** 3


def tree_digest(folder):
    folder = Path(folder)
    lines = []
    total = 0
    for current, dirs, files in os.walk(folder, followlinks=False):
        base = Path(current).relative_to(folder)
        names = list(files)
        # os.walk lists links to folders among dirs; treat them as links.
        links = [name for name in dirs if (Path(current) / name).is_symlink()]
        for name in links:
            dirs.remove(name)
            names.append(name)
        for name in names:
            path = Path(current) / name
            rel = (base / name).as_posix()
            if rel.startswith("./"):
                rel = rel[2:]
            info = path.lstat()
            if stat.S_ISLNK(info.st_mode):
                target = os.readlink(path).replace("\\", "/")
                if not target or target.startswith("/"):
                    raise SystemExit(f"Engine folder link leaves the folder: {rel}")
                parts = [p for p in rel.split("/")[:-1] if p]
                for part in target.split("/"):
                    if part in ("", "."):
                        continue
                    if part == "..":
                        if not parts:
                            raise SystemExit(f"Engine folder link leaves the folder: {rel}")
                        parts.pop()
                    else:
                        parts.append(part)
                lines.append((rel, f"L\t{rel}\t{target}"))
            elif stat.S_ISREG(info.st_mode):
                if os.name != "nt" and info.st_mode & 0o022:
                    raise SystemExit(f"Engine file is group- or world-writable: {rel}")
                total += info.st_size
                digest = hashlib.sha256()
                with path.open("rb") as handle:
                    for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                        digest.update(chunk)
                lines.append((rel, f"F\t{rel}\t{digest.hexdigest()}"))
            else:
                raise SystemExit(f"Unsupported file type in engine folder: {rel}")
            if len(lines) > MAX_ENTRIES or total > MAX_BYTES or len(rel) > 400:
                raise SystemExit("Engine folder exceeds its limits")
    lines.sort(key=lambda item: item[0].encode())
    return hashlib.sha256("\n".join(line for _, line in lines).encode()).hexdigest()


def drop_python_framework(dist_folder):
    """On macOS, keep Python as the single library the engine loads.

    With a python.org (framework) Python, PyInstaller collects the whole
    Python.framework and links `_internal/Python` to the library inside it;
    the bootloader loads `_internal/Python`. Once links are resolved into
    plain files (see `install`) the framework is no longer a valid bundle,
    and Apple refuses to notarize the copies of the library inside it. This
    replaces the link with the library itself and removes the framework,
    after checking that nothing in the engine loads the library from there.
    Run it right after PyInstaller, before the engine's smoke tests, so they
    test the engine as it ships."""
    if sys.platform != "darwin":
        return
    import shutil
    import subprocess
    internal = Path(dist_folder) / "_internal"
    framework = internal / "Python.framework"
    library = internal / "Python"
    if not framework.is_dir():
        return
    if not library.exists():
        raise SystemExit("Python.framework without _internal/Python: unexpected layout")
    for path in Path(dist_folder).rglob("*"):
        if framework in path.parents or path.is_symlink() or not path.is_file():
            continue
        with path.open("rb") as handle:
            if handle.read(4) not in (b"\xcf\xfa\xed\xfe", b"\xca\xfe\xba\xbe"):
                continue
        linked = subprocess.run(["otool", "-L", str(path)], capture_output=True, text=True, check=True).stdout
        if "Python.framework/" in linked.split("\n", 1)[-1]:
            raise SystemExit(f"{path.name} loads Python from Python.framework; keep the framework")
    resolved = library.resolve()
    library.unlink()
    shutil.copy2(resolved, library)
    shutil.rmtree(framework)


def install(dist_folder, resources, name):
    """Replace resources/<name> (file or folder) with a verbatim copy of the
    PyInstaller one-dir output and return (executable path, tree digest)."""
    import shutil
    target = Path(resources) / name
    if target.is_symlink() or target.is_file():
        target.unlink()
    elif target.exists():
        shutil.rmtree(target)
    # Links are resolved into plain files: app bundlers (Tauri resources, the
    # Windows ZIP, AppImage) copy what a link points to, and the digest must
    # describe the folder exactly as it ships.
    shutil.copytree(dist_folder, target, symlinks=False)
    for current, _, files in os.walk(target):
        for file in files:
            path = Path(current) / file
            if not path.is_symlink():
                path.chmod(path.stat().st_mode & ~0o022)
    executable = name + (".exe" if sys.platform == "win32" else "")
    return target / executable, tree_digest(target)


if __name__ == "__main__":
    print(tree_digest(sys.argv[1]))
