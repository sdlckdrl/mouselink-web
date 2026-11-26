"""Ensure localized support and permission summaries stay in sync."""
import unittest

from test_mouse_gesture_help import Document, LOCALES, ROOT


class CurrentTechnicalGuidanceTest(unittest.TestCase):
    def test_all_locales_show_current_platform_requirements(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                tech = Document(ROOT / locale / "technical.html")
                scope = tech.by_id("scope")
                for term in ("x64", "Android 8.0", "macOS 13", "Google", "LAN"):
                    self.assertIn(term, scope.text())
                prefix = f"/{locale}" if locale else ""
                self.assertIn(f"{prefix}/guide", [node.attrs.get("href")
                                                   for node in scope.walk()])
                support = Document(ROOT / locale / "compatibility.html")
                self.assertIn("Android 8.0", support.root.text())

    def test_wifi_and_bluetooth_permissions_have_separate_version_cutoffs(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                tech = Document(ROOT / locale / "technical.html")
                permissions = tech.by_id("permissions")
                descriptions = [node.text() for node in permissions.walk() if node.tag == "p"]
                self.assertTrue(any("Android 13" in desc and "Android 12" in desc
                                    and "Wi-Fi" in desc for desc in descriptions))
