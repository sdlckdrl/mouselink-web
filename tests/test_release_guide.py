"""Keep the current remote-window shortcut guide aligned with the PC release."""
import json
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
    def test_remote_window_heading_and_body_use_the_current_pc_release(self):
        version = json.loads((ROOT / "latest.json").read_text(encoding="utf-8"))["pc"]["version"]
        self.assertRegex(version, r"^\d+\.\d+\.\d+$")
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                section = Document(ROOT / locale / "guide.html").by_id("shortcuts-next-release")
                heading, = [node for node in section.children if node.tag == "h3"]
                paragraphs = [node for node in section.children if node.tag == "p"]
                self.assertTrue(paragraphs)
                self.assertEqual([version], VERSION_PATTERN.findall(heading.text()))
                body_versions = VERSION_PATTERN.findall(" ".join(node.text() for node in paragraphs))
                self.assertTrue(body_versions, "The current release must also be stated in the body")
                self.assertEqual({version}, set(body_versions))
                self.assertEqual({version}, set(VERSION_PATTERN.findall(section.text())))
                self.assertIn("Windows", section.text())

    def test_current_shortcut_block_does_not_describe_a_pending_release(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                content = Document(ROOT / locale / "guide.html").by_id("shortcuts-next-release").text()
                self.assertNotIn("1.4.9", content)
                for term in PENDING_TERMS[locale]:
                    self.assertNotIn(term.casefold(), content.casefold())

    def test_current_shortcut_block_retains_role_and_numbering_conditions(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                content = Document(ROOT / locale / "guide.html").by_id("shortcuts-next-release").text()
                self.assertIn("Ctrl+Alt+Shift+1~9", content)
                for term in NUMBERING_TERMS[locale]:
                    self.assertIn(term.casefold(), content.casefold())


if __name__ == "__main__":
    unittest.main()
