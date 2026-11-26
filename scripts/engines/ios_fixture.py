"""Small encrypted synthetic backup for adapter tests; contains no device data.
The deliberately cheap KDF parameters are for tests only, never real backups.
"""
import hashlib
import plistlib
import sqlite3
import struct
from contextlib import closing
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad

PASSWORD = 'synthetic-only-pässword'
PAYLOAD = b'Synthetic authorized artifact. No phone data.\n'
FILE_ID = hashlib.sha1(b'HomeDomain-Library/synthetic.txt').hexdigest()


def encrypted_fixture(root):
    root.mkdir()
    salt = b'synthetic-salt!!'
    first = hashlib.pbkdf2_hmac('sha256', PASSWORD.encode(), salt, 2, 32)
    derived = hashlib.pbkdf2_hmac('sha1', first, salt, 2, 32)
    class_key, manifest_key, file_key = b'c' * 32, b'm' * 32, b'f' * 32
    def wrap(key, value):
        return AES.new(key, AES.MODE_KW).seal(value)
    def tlv(tag, value):
        if isinstance(value, int):
            value = struct.pack('>I', value)
        return tag + struct.pack('>I', len(value)) + value
    keybag = b''.join(tlv(tag, value) for tag, value in [
        (b'TYPE', 1), (b'UUID', b'b' * 16), (b'WRAP', 2),
        (b'DPSL', salt), (b'DPIC', 2), (b'SALT', salt), (b'ITER', 2),
        (b'UUID', b'k' * 16), (b'CLAS', 4), (b'WRAP', 2),
        (b'WPKY', wrap(derived, class_key)),
    ])
    metadata = plistlib.dumps({'$top': {'root': plistlib.UID(1)}, '$objects': [
        '$null', {'Size': len(PAYLOAD), 'ProtectionClass': 4, 'EncryptionKey': plistlib.UID(2)},
        {'NS.data': struct.pack('<I', 4) + wrap(class_key, file_key)},
    ]}, fmt=plistlib.FMT_BINARY)
    manifest = root / 'Manifest.db'
    # sqlite3's transaction context does not close the handle. Windows keeps
    # the fixture locked until that handle is explicitly released.
    with closing(sqlite3.connect(manifest)) as db, db:
        db.execute('CREATE TABLE Files (fileID TEXT, domain TEXT, relativePath TEXT, flags INTEGER, file BLOB)')
        db.execute('INSERT INTO Files VALUES (?, ?, ?, 1, ?)', (FILE_ID, 'HomeDomain', 'Library/synthetic.txt', metadata))
    def encrypt(key, value):
        return AES.new(key, AES.MODE_CBC, iv=bytes(16)).encrypt(pad(value, 16))
    manifest.write_bytes(encrypt(manifest_key, manifest.read_bytes()))
    (root / 'Manifest.plist').write_bytes(plistlib.dumps({
        'IsEncrypted': True, 'BackupKeyBag': keybag,
        'ManifestKey': struct.pack('<I', 4) + wrap(class_key, manifest_key),
    }))
    (root / FILE_ID[:2]).mkdir()
    (root / FILE_ID[:2] / FILE_ID).write_bytes(encrypt(file_key, PAYLOAD))
