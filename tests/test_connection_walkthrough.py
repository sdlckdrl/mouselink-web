"""Keep connection guidance usable across locales, including without JavaScript."""
import unittest
from urllib.parse import unquote, urljoin, urlsplit

from test_mouse_gesture_help import Document, LOCALES, ROOT


CONNECTIONS = {"account", "wifi", "bluetooth"}
GESTURES = {"move", "click", "drag", "scroll"}
HELP_TOPICS = ("cursor-not-crossing", "account-connect-help", "remote-control-help")


def hidden_in_html(node):
    while node:
        if "hidden" in node.attrs or node.attrs.get("aria-hidden") == "true":
            return True
        node = node.parent
    return False


def accessible_name(node):
    return node.attrs.get("aria-label", "").strip() or node.text()


class ConnectionWalkthroughTest(unittest.TestCase):
    def test_connection_choices_target_three_named_local_panels(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                guide = Document(ROOT / locale / "guide.html")
                picker, = [node for node in guide.by_id("start").walk()
                           if "data-connection-picker" in node.attrs]
                choices = [node for node in picker.walk() if "data-connection-choice" in node.attrs]
                self.assertEqual(CONNECTIONS, {node.attrs["data-connection-choice"] for node in choices})
                self.assertEqual(len(CONNECTIONS), len(choices))
                panels = [node for node in picker.walk() if "data-connection-panel" in node.attrs]
                self.assertEqual(CONNECTIONS, {node.attrs["data-connection-panel"] for node in panels})
                self.assertEqual(len(CONNECTIONS), len(panels))
                for choice in choices:
                    self.assertEqual("button", choice.tag)
                    self.assertEqual("button", choice.attrs.get("type"))
                    self.assertTrue(accessible_name(choice))
                    key = choice.attrs["data-connection-choice"]
                    panel = guide.by_id(f"connect-{key}")
                    self.assertIn(panel, panels)
                    self.assertEqual(key, panel.attrs["data-connection-panel"])
                    self.assertEqual(panel.attrs["id"], choice.attrs.get("aria-controls"))

    def test_without_javascript_all_connection_instructions_remain_readable(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                guide = Document(ROOT / locale / "guide.html")
                for node in guide.by_id("start").walk():
                    if "data-connection-choice" in node.attrs:
                        self.assertTrue(hidden_in_html(node), "Inactive controls should wait for JavaScript.")
                for key in CONNECTIONS:
                    panel = guide.by_id(f"connect-{key}")
                    self.assertIn(panel.tag, ("article", "section"))
                    self.assertFalse(hidden_in_html(panel), key)
                    self.assertTrue(any(node.tag in ("h2", "h3", "h4") and node.text()
                                        for node in panel.walk()))
                    self.assertTrue(any(node.tag in ("p", "li") and node.text()
                                        for node in panel.walk()))

    def test_symptom_help_links_back_to_existing_same_language_guidance(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                help_page = Document(ROOT / locale / "help.html")
                guide = Document(ROOT / locale / "guide.html")
                prefix = f"/{locale}" if locale else ""
                base = f"https://onemouse.pages.dev{prefix}/help"
                for topic in HELP_TOPICS:
                    detail = help_page.by_id(topic)
                    self.assertEqual("details", detail.tag)
                    summary, = [node for node in detail.children if node.tag == "summary"]
                    self.assertTrue(summary.text())
                    links = [urlsplit(urljoin(base, node.attrs["href"]))
                             for node in detail.walk() if node.tag == "a" and node.attrs.get("href")]
                    guidance = [link for link in links
                                if link.hostname == "onemouse.pages.dev"
                                and link.path in (f"{prefix}/guide", f"{prefix}/guide.html")
                                and link.fragment]
                    self.assertTrue(guidance, topic)
                    for link in guidance:
                        guide.by_id(unquote(link.fragment))

    def test_four_gesture_examples_share_a_named_pause_and_play_control(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                section = Document(ROOT / locale / "guide.html").by_id("remote-gesture-examples")
                demos = [node for node in section.walk() if "data-gesture-demo" in node.attrs]
                self.assertEqual(GESTURES, {node.attrs["data-gesture-demo"] for node in demos})
                self.assertEqual(len(GESTURES), len(demos))
                self.assertTrue(all(node.tag == "article" and node.text() for node in demos))
                toggle, = [node for node in section.walk() if "data-demo-toggle" in node.attrs]
                self.assertEqual("button", toggle.tag)
                self.assertEqual("button", toggle.attrs.get("type"))
                self.assertTrue(hidden_in_html(toggle))
                self.assertTrue(accessible_name(toggle))
                play = toggle.attrs.get("data-play-label", "").strip()
                pause = toggle.attrs.get("data-pause-label", "").strip()
                self.assertTrue(play)
                self.assertTrue(pause)
                self.assertNotEqual(play, pause)

    def test_guides_and_help_load_existing_shared_walkthrough_assets(self):
        expected_script = (ROOT / "js" / "guide-help.js").resolve()
        expected_style = (ROOT / "css" / "guide-help.css").resolve()
        for asset in (expected_script, expected_style):
            self.assertTrue(asset.is_file(), asset)
            self.assertTrue(asset.read_text(encoding="utf-8").strip(), asset)
        for locale in LOCALES:
            for name in ("guide", "help"):
                with self.subTest(locale=locale or "ko", page=name):
                    path = ROOT / locale / f"{name}.html"
                    page = Document(path)
                    scripts = []
                    styles = []
                    for node in page.root.walk():
                        if node.tag == "script" and node.attrs.get("src"):
                            target = urlsplit(node.attrs["src"])
                            if not target.scheme and not target.netloc:
                                scripts.append((path.parent / unquote(target.path)).resolve())
                        if node.tag == "link" and "stylesheet" in node.attrs.get("rel", "").split():
                            target = urlsplit(node.attrs.get("href", ""))
                            if not target.scheme and not target.netloc:
                                styles.append((path.parent / unquote(target.path)).resolve())
                    self.assertEqual(1, scripts.count(expected_script))
                    self.assertEqual(1, styles.count(expected_style))


if __name__ == "__main__":
    unittest.main()
