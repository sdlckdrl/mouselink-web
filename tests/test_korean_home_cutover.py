"""Retain app links, locale discovery and searchable metadata on the new home."""
import unittest

from test_mouse_gesture_help import Document, ROOT
from test_site_copy_cleanup import structured_data


class KoreanHomeCutoverTest(unittest.TestCase):
    def test_visible_paths_and_compact_feature_intro(self):
        home = Document(ROOT / "index.html")
        sections = {name: home.by_id(name) for name in (
            "get", "setup", "help", "use", "faq", "video", "trust", "mac",
            "screen-tools", "screen-tools-title", "screenshot-share-title",
            "mobile-pc-remote-title",
        )}
        sections["use"].text()
        benefits, = [node for node in sections["use"].walk()
                     if "benefits" in node.attrs.get("class", "").split()]
        self.assertEqual(3, sum(node.tag == "article" for node in benefits.walk()))
        links = {node.attrs.get("href"): node for node in home.root.walk() if node.tag == "a"}
        for path in (
            "#get", "/guide", "/guide#connect-account", "/help", "/help#faq",
            "/privacy", "/terms", "/licenses", "/en/", "/ja/", "/es/", "/zh/",
        ):
            self.assertIn(path, links)
        self.assertTrue(any("cid=onemouse_homepage" in str(link) for link in links))
        self.assertTrue(any("data-latest-windows-download" in n.attrs for n in links.values()))
        self.assertTrue(any("data-latest-macos-download" in n.attrs for n in links.values()))

    def test_search_settings_and_official_android_targets(self):
        home = Document(ROOT / "index.html")
        nodes = list(home.root.walk())
        robots = [n.attrs.get("content") for n in nodes if n.attrs.get("name") == "robots"]
        self.assertEqual(["index,follow,max-image-preview:large"], robots)
        alternate = {n.attrs.get("hreflang") for n in nodes if n.attrs.get("rel") == "alternate"}
        self.assertEqual({"ko", "en", "ja", "es", "zh", "pt-BR", "de", "zh-TW", "fr", "id", "x-default"}, alternate)
        self.assertTrue(any(n.attrs.get("name") == "naver-site-verification" for n in nodes))
        self.assertTrue(any(d.get("@type") == "SoftwareApplication" for d in structured_data(home)))
        for file in ("guide.html", "guide-demo.html"):
            guide = Document(ROOT / file)
            for fragment in ("text-to-pc", "shortcuts", "shortcuts-next-release"):
                self.assertIsNotNone(guide.by_id(fragment))
