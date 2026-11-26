"""Package canonical Enigm PNG exports into native containers without resampling."""
from pathlib import Path
import struct
import shutil
ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'assets/brand/app-icons'
output = ROOT / 'src-tauri/icons'
output.mkdir(exist_ok=True)
for size, name in [(32, '32x32.png'), (128, '128x128.png'), (256, '128x128@2x.png')]:
    shutil.copyfile(source / f'enigm-linux-icon-{size}.png', output / name)
entries, images = [], []
sizes = [16, 24, 32, 48, 64, 128, 256]
offset = 6 + len(sizes) * 16
for size in sizes:
    data = (source / f'enigm-windows-icon-{size}.png').read_bytes()
    entries.append(struct.pack('<BBBBHHII', size % 256, size % 256, 0, 0, 1, 32, len(data), offset))
    images.append(data)
    offset += len(data)
(output / 'icon.ico').write_bytes(struct.pack('<HHH', 0, 1, len(sizes)) + b''.join(entries + images))
chunks = []
for size, kind in [(16,b'icp4'),(32,b'icp5'),(64,b'icp6'),(128,b'ic07'),(256,b'ic08'),(512,b'ic09'),(1024,b'ic10')]:
    data = (source / f'enigm-macos-icon-{size}.png').read_bytes()
    chunks.append(kind + struct.pack('>I', len(data) + 8) + data)
body = b''.join(chunks)
(output / 'icon.icns').write_bytes(b'icns' + struct.pack('>I', len(body) + 8) + body)
