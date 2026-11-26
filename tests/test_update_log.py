"""Keep verified app releases and website changes aligned across all locales."""
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


RELEASES = (
    ("2026-11-24", "Windows 1.7.1",
     "https://github.com/sdlckdrl/mouselink-web/releases/tag/v1.7.1"),
    ("2026-11-19", "Windows 1.7.0",
     "https://github.com/sdlckdrl/mouselink-web/releases/tag/v1.7.0"),
    ("2026-11-18", "Android · Google Play",
     "https://play.google.com/store/apps/details?id=com.mouselink.app"),
    ("2026-11-17", "macOS 1.6.8 · Apple Silicon",
     "https://github.com/sdlckdrl/mouselink-web/releases/tag/mac-v1.6.8"),
)


class UpdateLogTest(unittest.TestCase):
    def entries(self, locale):
        updates = Document(ROOT / locale / "technical.html").by_id("updates")
        entries = [node for node in updates.walk()
                   if "log-item" in node.attrs.get("class", "").split()]
        self.assertGreaterEqual(len(entries), len(RELEASES) + 10)
        self.assertTrue(all(node.tag == "div" for node in entries))
        return entries

    def published_october_entry(self, locale):
        candidates = [node for node in self.entries(locale) if "Windows 1.5.4" in node.text()]
        self.assertEqual(1, len(candidates))
        return candidates[0]

    def test_verified_releases_are_first_with_sources(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                for node, (date, heading, source) in zip(self.entries(locale), RELEASES):
                    time, = [item for item in node.walk() if item.tag == "time"]
                    link, = [item for item in node.walk() if item.tag == "a"]
                    self.assertEqual(date, time.attrs.get("datetime"))
                    self.assertEqual(date.replace("-", "."), time.text())
                    self.assertEqual(heading, link.text())
                    self.assertEqual(source, link.attrs.get("href"))

    def test_website_update_is_not_an_app_release(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                updates = Document(ROOT / locale / "technical.html").by_id("updates")
                website, = [item for item in updates.walk()
                            if "website-update" in item.attrs.get("class", "").split()]
                log, = [item for item in updates.walk()
                        if "log" in item.attrs.get("class", "").split()]
                self.assertNotIn(website, list(log.walk()))
                timestamp, = [item for item in website.walk() if item.tag == "time"]
                self.assertEqual("2026-11-20", timestamp.attrs.get("datetime"))
                prefix = f"/{locale}" if locale else ""
                self.assertEqual([f"{prefix}/compare", f"{prefix}/help#faq"], [
                    item.attrs.get("href") for item in website.walk() if item.tag == "a"])

    def test_october_release_remains_in_history_with_four_changes(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                entry = self.published_october_entry(locale)
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
                items = [node for node in self.published_october_entry(locale).walk()
                         if node.tag == "li"]
                reply = items[1].text().casefold()
                for term in REPLY_TERMS[locale]:
                    self.assertIn(term.casefold(), reply)

    def test_sitemap_technical_dates_match_page_update(self):
        namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        sitemap = ElementTree.parse(ROOT / "sitemap.xml")
        dates = {node.findtext("sm:loc", namespaces=namespace):
                 node.findtext("sm:lastmod", namespaces=namespace)
                 for node in sitemap.findall("sm:url", namespace)}
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                prefix = f"/{locale}" if locale else ""
                self.assertEqual("2026-11-26", dates[
                    f"https://onemouse.pages.dev{prefix}/technical"])


if __name__ == "__main__":
    unittest.main()
