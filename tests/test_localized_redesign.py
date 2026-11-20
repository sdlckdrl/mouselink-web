"""Check localized redesign navigation without replacing official app entry points."""
import unittest

from test_mouse_gesture_help import Document, ROOT

LOCALES = ("en", "es", "ja", "zh")
SECTIONS = ("features", "guide", "help", "compatibility", "download", "remote")


class LocalizedRedesignTests(unittest.TestCase):
    def test_localized_navigation_and_downloads(self):
        for locale in LOCALES:
            with self.subTest(locale=locale):
                home = Document(ROOT / locale / "index.html")
                hrefs = {n.attrs.get("href") for n in home.root.walk() if n.tag == "a"}
                for route in ("features", "guide", "help", "compatibility"):
                    self.assertIn(f"/{locale}/{route}", hrefs)
                for route in SECTIONS:
                    page = Document(ROOT / locale / f"{route}.html")
                    html, = [node for node in page.root.walk() if node.tag == "html"]
                    self.assertEqual(locale, html.attrs.get("lang"))
                download = Document(ROOT / locale / "download.html")
                for section in ("windows", "android", "mac"):
                    download.by_id(section)

    def test_app_guide_and_preview_keep_legacy_fragments(self):
        for locale in LOCALES:
            with self.subTest(locale=locale):
                for name in ("guide", "guide-reference"):
                    page = Document(ROOT / locale / f"{name}.html")
                    for section in ("text-to-pc", "shortcuts", "shortcuts-next-release"):
                        self.assertIsNotNone(page.by_id(section))
                official = Document(ROOT / locale / "help.html")
                preview = Document(ROOT / locale / "help-reference.html")
                for section in ("faq", "mac", "bluetooth-help"):
                    self.assertIsNotNone(official.by_id(section))
                    self.assertIsNotNone(preview.by_id(section))
