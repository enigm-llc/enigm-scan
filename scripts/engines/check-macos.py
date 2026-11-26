"""Reject packaged native code requiring a newer macOS than our declared floor.
Checks the interpreter, installed extensions (also embedded by PyInstaller),
application and engine resources; it does not claim testing on physical Ventura.
"""
import ast, pathlib, platform, subprocess, sys, re
arch = platform.machine()
root = pathlib.Path(__file__).resolve().parents[2]
paths = {pathlib.Path(sys.executable).resolve()}
# Analysis records the exact native inputs embedded in the one-file engine.
# The interpreter installation also contains link-time objects such as python.o;
# those are not shipped and have no minimum runtime OS load command.
tocs = list((root / '.local-tools/mvt-build/work').rglob('Analysis-00.toc')) + list((root / '.local-tools/ios-build/work').rglob('Analysis-00.toc'))
native_inputs = set()
def collect(node):
    if isinstance(node, (list, tuple)):
        if len(node) == 3 and isinstance(node[2], str) and node[2] in ('BINARY', 'EXTENSION'):
            native_inputs.add(pathlib.Path(node[1]).resolve())
        else:
            for child in node: collect(child)
for toc in tocs:
    collect(ast.literal_eval(toc.read_text()))
if not native_inputs: raise SystemExit('Missing packaged native dependency inventory')
paths.update(native_inputs)
for base in [root / 'src-tauri/target/release/bundle/macos', root / 'src-tauri/resources/engines']:
    paths.update(p for p in base.rglob('*') if p.is_file() and not p.is_symlink())
checked = 0
for path in sorted(paths):
    with path.open('rb') as f: magic = f.read(4)
    if magic not in [b'\xcf\xfa\xed\xfe', b'\xce\xfa\xed\xfe', b'\xca\xfe\xba\xbe', b'\xca\xfe\xba\xbf']:
        continue
    result = subprocess.run(['lipo','-archs',str(path)],capture_output=True,text=True,check=True)
    if arch not in result.stdout.split(): raise SystemExit(f'Missing {arch} architecture: {path.name}')
    header = subprocess.run(['otool','-arch',arch,'-hv',str(path)],capture_output=True,text=True,check=True)
    if re.search(r'\b(?:MH_)?OBJECT\b', header.stdout):
        continue  # Link-time object, not an executable or loadable library.
    result = subprocess.run(['otool','-arch',arch,'-l',str(path)],capture_output=True,text=True,check=True)
    versions = re.findall(r'\bminos\s+(\d+(?:\.\d+)*)', result.stdout)
    versions += re.findall(r'cmd LC_VERSION_MIN_MACOSX\s+cmdsize \d+\s+version (\d+(?:\.\d+)*)',result.stdout)
    if not versions: raise SystemExit(f'Missing macOS minimum version: {path.name}')
    if any(tuple(map(int,v.split('.')))[:2] > (13,0) for v in versions): raise SystemExit(f'{path.name} requires macOS {versions}, above 13.0')
    checked += 1
print(f'Validated {checked} Mach-O files for {arch}, macOS floor <= 13.0')
