"""Install the hash-pinned python.org runtime on ephemeral macOS CI only.
The hosted Intel runtime links Homebrew OpenSSL requiring macOS 15; the official
universal2 distribution supports macOS 10.15+. Final Mach-O checks still enforce
our product floor of 13.0. This installer is never shipped or run on user Macs.
Source: https://www.python.org/downloads/release/python-3149/
"""
import hashlib, os, pathlib, platform, subprocess, tempfile, urllib.request
if os.environ.get('GITHUB_ACTIONS') != 'true' or platform.system() != 'Darwin':
    raise SystemExit('Only intended for the ephemeral macOS CI runner')
url = 'https://www.python.org/ftp/python/3.14.9/python-3.14.9-macos11.pkg'
sha256 = '08e312f20844b524c2f8c5e5b2e7f49608c22e8c7cb194f5834d385c94383462'
with tempfile.TemporaryDirectory(prefix='enigm-python-') as folder:
    package = pathlib.Path(folder) / 'python.pkg'
    with urllib.request.urlopen(url, timeout=90) as response, package.open('wb') as output:
        while chunk := response.read(1024 * 1024): output.write(chunk)
    with package.open('rb') as source:
        if hashlib.file_digest(source, 'sha256').hexdigest() != sha256:
            raise SystemExit('Official Python installer checksum mismatch')
    subprocess.run(['sudo', 'installer', '-pkg', str(package), '-target', '/'], check=True)
venv = pathlib.Path('.local-tools/macos-python').resolve()
subprocess.run(['/Library/Frameworks/Python.framework/Versions/3.14/bin/python3.14', '-m', 'venv', str(venv)], check=True)
python = str(venv / 'bin/python')
subprocess.run([python, '-m', 'pip', 'install', 'certifi==2026.10.19'], check=True)
cert = subprocess.check_output([python, '-c', 'import certifi; print(certifi.where())'], text=True).strip()
with open(os.environ['GITHUB_PATH'], 'a') as output: output.write(str(venv / 'bin') + '\n')
with open(os.environ['GITHUB_ENV'], 'a') as output: output.write('SSL_CERT_FILE=' + cert + '\n')
subprocess.run([python, '-c', 'import platform, ssl; print(platform.python_version(), platform.machine(), ssl.OPENSSL_VERSION)'], check=True)

# cryptography 50 has no Intel macOS wheel and otherwise links the runner's
# Homebrew OpenSSL (macOS 15). Build its static dependency for our actual floor.
# Recipe: https://cryptography.io/en/latest/installation/#static-wheels
# Source checksum: https://formulae.brew.sh/api/formula/openssl@3.json
import tarfile
openssl_url = 'https://github.com/openssl/openssl/releases/download/openssl-3.5.9/openssl-3.5.9.tar.gz'
openssl_sha = '603f5602e2eef00d77fbd429d34dcd5822bb301757a1bc9cdb24c670f1eb859a'
openssl_prefix = pathlib.Path('.local-tools/macos-openssl').resolve()
with tempfile.TemporaryDirectory(prefix='enigm-openssl-') as folder:
    archive = pathlib.Path(folder) / 'openssl.tar.gz'
    with urllib.request.urlopen(openssl_url, timeout=90) as response, archive.open('wb') as output:
        while chunk := response.read(1024 * 1024): output.write(chunk)
    with archive.open('rb') as source:
        if hashlib.file_digest(source, 'sha256').hexdigest() != openssl_sha:
            raise SystemExit('OpenSSL source checksum mismatch')
    with tarfile.open(archive) as source: source.extractall(folder, filter='data')
    source_dir = pathlib.Path(folder) / 'openssl-3.5.9'
    notices = pathlib.Path('src-tauri/resources/engines/notices')
    notices.mkdir(parents=True, exist_ok=True)
    (notices / 'OpenSSL-3.5.9-LICENSE.txt').write_bytes((source_dir / 'LICENSE.txt').read_bytes())
    subprocess.run(['./Configure', 'darwin64-x86_64-cc', 'no-shared', 'no-tests',
                    '-mmacosx-version-min=13.0', '--prefix=' + str(openssl_prefix)], cwd=source_dir, check=True)
    subprocess.run(['make', '-j3'], cwd=source_dir, check=True)
    subprocess.run(['make', 'install_sw'], cwd=source_dir, check=True)
with open(os.environ['GITHUB_ENV'], 'a') as output:
    output.write('OPENSSL_DIR=' + str(openssl_prefix) + '\nOPENSSL_STATIC=1\nPIP_NO_CACHE_DIR=1\n')
