"""Keep the published Windows 1.5.4 update log aligned across all locales."""
import unittest
from xml.etree import ElementTree

from test_mouse_gesture_help import Document, LOCALES, ROOT


REPLY_TERMS = {
    "": ("PC", "Android", "원본", "답장"),
    "en": ("PC", "Android", "original", "reply"),
    "es": ("PC", "Android", "original", "respuesta"),
    "ja": ("PC", "Android", "元", "返信"),
    "zh": ("电脑", "Android", "原始", "回复"),
}


class UpdateLogTest(unittest.TestCase):
    def newest_entry(self, locale):
        updates = Document(ROOT / locale / "technical.html").by_id("updates")
        entries = [node for node in updates.walk()
                   if "log-item" in node.attrs.get("class", "").split()]
        self.assertEqual(10, len(entries))
        self.assertTrue(all(node.tag == "div" for node in entries))
        return entries[0]

    def test_latest_release_is_first_and_has_four_changes(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                entry = self.newest_entry(locale)
                date, = [node for node in entry.walk() if node.tag == "time"]
                self.assertEqual("2026-10-10", date.attrs.get("datetime"))
                self.assertEqual("2026.10.10", date.text())
                self.assertIn("Windows 1.5.4", entry.text())
                items = [node for node in entry.walk() if node.tag == "li"]
                self.assertEqual(4, len(items))
                self.assertTrue(all(len(node.text()) > 25 for node in items))

    def test_reply_support_conditions_are_localized(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                items = [node for node in self.newest_entry(locale).walk()
                         if node.tag == "li"]
                reply = items[1].text().casefold()
                for term in REPLY_TERMS[locale]:
                    self.assertIn(term.casefold(), reply)

    def test_sitemap_technical_dates_match_release_date(self):
        namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        sitemap = ElementTree.parse(ROOT / "sitemap.xml")
        dates = {node.findtext("sm:loc", namespaces=namespace):
                 node.findtext("sm:lastmod", namespaces=namespace)
                 for node in sitemap.findall("sm:url", namespace)}
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                prefix = f"/{locale}" if locale else ""
                self.assertEqual("2026-10-10", dates[
                    f"https://onemouse.pages.dev{prefix}/technical"])


if __name__ == "__main__":
    unittest.main()
