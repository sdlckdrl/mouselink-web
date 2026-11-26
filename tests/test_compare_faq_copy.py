"""Test FAQ topic and markup parity across compare locales."""
import json
import re
import unittest

from test_mouse_gesture_help import LOCALES, ROOT


TOPICS = {
    "": (("기기", "창"), "베타"),
    "en": (("own screen", "in a window"), "beta"),
    "es": (("pantalla", "ventana"), "beta"),
    "ja": (("画面", "ウィンドウ"), "ベータ"),
    "zh": (("屏幕", "窗口"), "测试版"),
}


class CompareFaqCopyTest(unittest.TestCase):
    def test_topics_match_questions_and_structured_data(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                source = (ROOT / locale / "compare.html").read_text(encoding="utf8")
                visible = re.findall(
                    r'<details><summary>([^<]+)</summary><p class="a">([^<]+)</p></details>',
                    source,
                )
                schema = json.loads(re.search(
                    r'<script type="application/ld[+]json">(.*?)</script>', source, re.S,
                )[1])
                structured = next(item["mainEntity"] for item in schema["@graph"]
                                  if item["@type"] == "FAQPage")
                self.assertEqual(visible, [
                    (item["name"], item["acceptedAnswer"]["text"])
                    for item in structured
                ])
                screen_terms, beta = TOPICS[locale]
                direct, signin = [answer for _, answer in visible]
                for term in screen_terms:
                    self.assertIn(term, direct)
                self.assertNotIn("Google", direct)
                self.assertIn("Google", signin)
                self.assertIn(beta, signin)
