"""Keep shortcut tables concise without the removed usage-notes block."""
import unittest

from test_mouse_gesture_help import Document, LOCALES, ROOT


class ShortcutNotesTest(unittest.TestCase):
    def test_usage_notes_are_absent_from_all_localized_guides(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                guide = Document(ROOT / locale / "guide.html")
                for node in guide.root.walk():
                    self.assertFalse(any(name.startswith("shortcut-note")
                                         for name in node.attrs.get("class", "").split()))
                    self.assertNotIn(node.attrs.get("id"),
                                     ("shortcut-notes-title", "screenshot-result"))

    def test_windows_table_leads_directly_to_android_shortcuts(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                guide = Document(ROOT / locale / "guide.html")
                heading = guide.by_id("android-shortcuts-title")
                siblings = heading.parent.children
                preceding = siblings[siblings.index(heading) - 1]
                self.assertIn("table-wrap", preceding.attrs.get("class", "").split())
                table, = [node for node in preceding.walk() if node.tag == "table"]
                self.assertEqual("pc-shortcuts-title", table.attrs.get("aria-labelledby"))
                body, = [node for node in table.children if node.tag == "tbody"]
                self.assertEqual(7, len(body.children))

    def test_capture_help_remains_without_a_link_to_the_removed_block(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                help_page = Document(ROOT / locale / "help.html")
                capture = help_page.by_id("screenshot-preview-faq")
                self.assertEqual("details", capture.tag)
                self.assertGreater(len(capture.text()), 50)
                self.assertFalse(any("screenshot-result" in node.attrs.get("href", "")
                                     for node in help_page.root.walk()))

    def test_unused_notes_styles_are_removed(self):
        css = (ROOT / "css" / "onemouse.css").read_text(encoding="utf-8")
        self.assertNotIn("shortcut-note", css)
        self.assertIn(".table-wrap {", css)


if __name__ == "__main__":
    unittest.main()
