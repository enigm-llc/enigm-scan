"""Contract tests against the pinned installed MVT API, using synthetic modules."""
import unittest
import tempfile
import os
import io
from pathlib import Path
from ios_fixture import encrypted_fixture, PASSWORD, PAYLOAD, FILE_ID
work = tempfile.TemporaryDirectory(prefix="enigm-mvt-test-")
os.environ["MVT_CONFIG_FOLDER"] = work.name
os.environ["MVT_NETWORK_ACCESS_ALLOWED"] = "false"
from mvt_entry import observe_modules, decrypt_backup
from mvt.common.module import MVTModule, DatabaseNotFoundError
from mvt.common import module as api


class Completed(MVTModule):
    def run(self):
        self.results = [{"synthetic": True}]
    def check_indicators(self):
        pass


class Missing(Completed):
    def run(self):
        raise DatabaseNotFoundError("synthetic missing database")


class Empty(Completed):
    def run(self):
        self.results = []


class NoIndicators(Completed):
    def check_indicators(self):
        raise NotImplementedError


class Broken(Completed):
    def check_indicators(self):
        raise ValueError("synthetic parser failure")


class CoverageTest(unittest.TestCase):
    def test_real_synthetic_encrypted_backup_and_wrong_password(self):
        with tempfile.TemporaryDirectory(dir=work.name) as folder:
            root = Path(folder)
            source = root / 'source'
            encrypted_fixture(source)
            original = (source / 'Manifest.db').read_bytes()
            with self.assertRaises(ValueError):
                decrypt_backup(str(source), str(root / 'wrong'), io.BytesIO(b'wrong-password'))
            output = root / 'decrypted'
            decrypt_backup(str(source), str(output), io.BytesIO(PASSWORD.encode()))
            self.assertEqual((output / FILE_ID[:2] / FILE_ID).read_bytes(), PAYLOAD)
            self.assertEqual((source / 'Manifest.db').read_bytes(), original)
            # Corrupting an individual encrypted artifact is caught upstream;
            # our adapter must still reject this partial result.
            (source / FILE_ID[:2] / FILE_ID).write_bytes(b'broken')
            with self.assertRaises(ValueError):
                decrypt_backup(str(source), str(root / 'partial'), io.BytesIO(PASSWORD.encode()))

    def test_selective_encrypted_copy_retains_manifest_of_omitted_payloads(self):
        import sqlite3
        from contextlib import closing
        with tempfile.TemporaryDirectory(dir=work.name) as folder:
            root = Path(folder)
            source = root / "source"
            encrypted_fixture(source)
            original = (source / "Manifest.db").read_bytes()
            (source / FILE_ID[:2] / FILE_ID).unlink()
            output = root / "selected"
            decrypt_backup(str(source), str(output), io.BytesIO(PASSWORD.encode()))
            self.assertEqual((source / "Manifest.db").read_bytes(), original)
            self.assertFalse((output / FILE_ID[:2] / FILE_ID).exists())
            with closing(sqlite3.connect(output / "Manifest.db")) as db:
                self.assertEqual(db.execute("SELECT fileID FROM Files").fetchone()[0], FILE_ID)

    def test_records_caught_failures_and_missing_data(self):
        original = api.run_module
        try:
            coverage = observe_modules()
            for module in [Completed(), Missing(), Empty(), NoIndicators(), Broken()]:
                api.run_module(module)
            self.assertEqual(coverage, [
                {"module": "Completed", "extraction": "completed", "indicators": "completed"},
                {"module": "Missing", "extraction": "skipped", "indicators": "skipped"},
                {"module": "Empty", "extraction": "empty", "indicators": "completed"},
                {"module": "NoIndicators", "extraction": "completed", "indicators": "none"},
                {"module": "Broken", "extraction": "completed", "indicators": "failed"},
            ])
        finally:
            api.run_module = original


if __name__ == "__main__":
    unittest.main()
