"""Keep the compact shortcut notes grouped, accessible, and fully visible."""
import unittest

from test_mouse_gesture_help import Document, LOCALES, ROOT


LABELS = {
    "": ("사용 시 참고", "캡처", "서브 PC", "단축키 끄기"),
    "en": ("Usage notes", "Capture", "Secondary PC", "Disabling shortcuts"),
    "es": ("Notas de uso", "Capturas", "PC secundario", "Desactivar atajos"),
    "ja": ("使用時の注意", "画面キャプチャ", "サブPC", "ショートカットをオフ"),
    "zh": ("使用提示", "截图", "副电脑", "关闭快捷键"),
}


def has_class(node, name):
    return name in node.attrs.get("class", "").split()


class ShortcutNotesTest(unittest.TestCase):
    def test_five_guides_have_one_labeled_group_after_the_windows_table(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                guide = Document(ROOT / locale / "guide.html")
                groups = [node for node in guide.by_id("shortcuts").walk()
                          if has_class(node, "shortcut-notes")]
                self.assertEqual(1, len(groups))
                group, = groups
                self.assertEqual("aside", group.tag)
                self.assertEqual("shortcut-notes-title", group.attrs.get("aria-labelledby"))
                title = guide.by_id("shortcut-notes-title")
                self.assertEqual("h4", title.tag)
                self.assertEqual(LABELS[locale][0], title.text())
                siblings = group.parent.children
                preceding = siblings[siblings.index(group) - 1]
                self.assertTrue(has_class(preceding, "table-wrap"))
                self.assertTrue(any(node.tag == "table" and
                                    node.attrs.get("aria-labelledby") == "pc-shortcuts-title"
                                    for node in preceding.walk()))

    def test_capture_anchor_and_three_visible_topics_stay_in_the_group(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                guide = Document(ROOT / locale / "guide.html")
                group = guide.by_id("shortcut-notes-title").parent
                notes = [node for node in group.children if has_class(node, "shortcut-note")]
                self.assertEqual(3, len(notes))
                self.assertEqual("screenshot-result", notes[0].attrs.get("id"))
                for note, label in zip(notes, LABELS[locale][1:]):
                    heading, = [node for node in note.children if node.tag == "h5"]
                    self.assertEqual(label, heading.text())
                    self.assertFalse(any(node.tag == "details" or "hidden" in node.attrs
                                         for node in note.walk()))
                self.assertTrue(has_class(notes[2], "shortcut-note-warning"))

    def test_capture_help_link_is_distinguishable_from_prose(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                capture = Document(ROOT / locale / "guide.html").by_id("screenshot-result")
                link, = [node for node in capture.walk()
                         if node.attrs.get("href") == "./help#screenshot-preview-faq"]
                self.assertTrue(has_class(link, "text-link"))
                self.assertTrue(has_class(link.parent, "shortcut-note-link"))

    def test_notes_have_scoped_spacing_typography_and_mobile_layout(self):
        css = (ROOT / "css" / "onemouse.css").read_text(encoding="utf-8")
        self.assertIn(".shortcut-notes {", css)
        self.assertIn("margin: 18px 0 28px;", css)
        self.assertIn(".shortcut-note p {\n  margin: 0;", css)
        self.assertIn(".shortcut-note + .shortcut-note {", css)
        self.assertIn("scroll-margin-top: 136px;", css)
        self.assertIn(".shortcut-note-warning h5 {", css)
        self.assertIn("@media (max-width: 600px) {\n  .shortcut-note {", css)


if __name__ == "__main__":
    unittest.main()
