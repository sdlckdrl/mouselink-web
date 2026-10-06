"""Keep the remote-window shortcut in all five localized PC shortcut tables."""
import re
import unittest

from test_mouse_gesture_help import Document, LOCALES, ROOT


VERSION_PATTERN = re.compile(r"(?<![\d.])\d+\.\d+\.\d+(?!\d|\.\d)")
PENDING_TERMS = {
    "": ("배포 예정", "아직 포함되지", "포함되지 않습니다"),
    "en": ("planned", "not included"),
    "es": ("previsto", "no está incluido"),
    "ja": ("提供予定", "含まれません"),
    "zh": ("计划", "尚未包含"),
}
NUMBERING_TERMS = {
    "": ("메인 PC", "같은", "LAN", "기기 번호", "Bluetooth", "제외"),
    "en": ("main PC", "same", "LAN", "device numbers", "Bluetooth", "excluded"),
    "es": ("PC principal", "comparten", "LAN", "números", "Bluetooth", "fuera"),
    "ja": ("メインPC", "同じ", "LAN", "番号", "Bluetooth", "除外"),
    "zh": ("主电脑", "相同", "LAN", "编号", "Bluetooth", "不参与"),
}


class ReleaseGuideTest(unittest.TestCase):
    def test_remote_window_shortcut_is_the_second_pc_table_row(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                guide = Document(ROOT / locale / "guide.html")
                row = guide.by_id("shortcuts-next-release")
                table, = [node for node in guide.root.walk()
                          if node.tag == "table" and node.attrs.get("aria-labelledby") == "pc-shortcuts-title"]
                body, = [node for node in table.children if node.tag == "tbody"]
                rows = [node for node in body.children if node.tag == "tr"]
                self.assertEqual("tr", row.tag)
                self.assertIs(body, row.parent)
                self.assertIs(row, rows[1])
                first_cell = next(node for node in rows[0].children if node.tag == "td")
                self.assertEqual(["Ctrl", "Alt", "1~9"],
                                 [node.text() for node in first_cell.walk() if node.tag == "kbd"])
                self.assertEqual("remote-window", row.attrs.get("data-shortcut-action"))
                self.assertEqual([row], [node for node in guide.root.walk()
                                        if node.attrs.get("data-shortcut-action") == "remote-window"])

    def test_remote_window_shortcut_uses_keyboard_markup_and_plus_separators(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                row = Document(ROOT / locale / "guide.html").by_id("shortcuts-next-release")
                cells = [node for node in row.children if node.tag == "td"]
                self.assertEqual(2, len(cells))
                self.assertEqual(["Ctrl", "Alt", "Shift", "1~9"],
                                 [node.text() for node in cells[0].walk() if node.tag == "kbd"])
                self.assertEqual("Ctrl+Alt+Shift+1~9", cells[0].text().replace(" ", ""))

    def test_remote_window_shortcut_has_no_release_heading_or_pending_wording(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                row = Document(ROOT / locale / "guide.html").by_id("shortcuts-next-release")
                content = row.text()
                self.assertFalse(any(node.tag == "h3" for node in row.walk()))
                self.assertNotRegex(content, VERSION_PATTERN)
                for term in PENDING_TERMS[locale]:
                    self.assertNotIn(term.casefold(), content.casefold())

    def test_remote_window_shortcut_retains_role_and_numbering_conditions(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                row = Document(ROOT / locale / "guide.html").by_id("shortcuts-next-release")
                cells = [node for node in row.children if node.tag == "td"]
                self.assertEqual(2, len(cells))
                content = cells[1].text()
                for term in NUMBERING_TERMS[locale]:
                    self.assertIn(term.casefold(), content.casefold())


if __name__ == "__main__":
    unittest.main()
