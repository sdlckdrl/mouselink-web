"""Regression checks for the five localized, static gesture guides (stdlib only)."""
from html.parser import HTMLParser
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
LOCALES = ("", "en", "es", "ja", "zh")
PATTERNS = {
    "back": "←",
    "forward": "→",
    "scroll_up": "↑",
    "scroll_down": "↓",
    "minimize": "↓ →",
    "reload": "↑ ↓",
    "recents": "↑ →",
}
VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}


class Node:
    def __init__(self, tag, attrs=(), parent=None):
        self.tag = tag
        self.attrs = dict(attrs)
        self.parent = parent
        self.children = []
        self.parts = []

    def walk(self):
        yield self
        for child in self.children:
            yield from child.walk()

    def text(self):
        return " ".join("".join(self.parts).split())


class Document(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.root = Node("document")
        self.stack = [self.root]
        self.feed(path.read_text(encoding="utf-8"))
        self.close()

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs, self.stack[-1])
        self.stack[-1].children.append(node)
        if tag not in VOID_TAGS:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID_TAGS:
            self.stack.pop()

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                break

    def handle_data(self, data):
        for node in self.stack:
            node.parts.append(data)

    def by_id(self, value):
        nodes = [node for node in self.root.walk() if node.attrs.get("id") == value]
        if len(nodes) != 1:
            raise AssertionError(f"Expected one #{value}, found {len(nodes)}")
        return nodes[0]


class MouseGestureHelpTest(unittest.TestCase):
    def test_all_locales_document_exactly_the_seven_real_patterns(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                guide = Document(ROOT / locale / "guide.html")
                section = guide.by_id("mouse-gestures")
                rows = [node for node in section.walk() if "data-gesture-action" in node.attrs]
                self.assertEqual(list(PATTERNS), [row.attrs["data-gesture-action"] for row in rows])
                for row in rows:
                    cells = [node for node in row.children if node.tag == "td"]
                    self.assertEqual(2, len(cells))
                    self.assertEqual(PATTERNS[row.attrs["data-gesture-action"]], cells[0].text())
                    self.assertTrue(any(node.tag == "b" and node.text() for node in cells[1].walk()))
                    minimum_description_length = 5 if locale in ("", "ja", "zh") else 15
                    self.assertTrue(any(node.tag == "small" and len(node.text()) > minimum_description_length
                                        for node in cells[1].walk()))
                self.assertNotIn("↙", section.text())
                self.assertNotIn("↑ ←", section.text())
                self.assertNotIn("↓ ←", section.text())

    def test_table_has_accessible_headers_and_spoken_direction_labels(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                guide = Document(ROOT / locale / "guide.html")
                section = guide.by_id("mouse-gestures")
                table, = [node for node in section.walk() if node.tag == "table"]
                self.assertEqual("mouse-gestures-title", table.attrs.get("aria-labelledby"))
                self.assertEqual("h2", guide.by_id("mouse-gestures-title").tag)
                headers = [node for node in table.walk() if node.tag == "th"]
                self.assertEqual(2, len(headers))
                self.assertTrue(all(node.attrs.get("scope") == "col" and node.text() for node in headers))
                directions = [node for node in table.walk() if node.attrs.get("role") == "img"]
                self.assertEqual(7, len(directions))
                self.assertTrue(all(node.attrs.get("aria-label") for node in directions))

    def test_each_locale_has_a_toc_entry_and_local_guide_faq_links(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                guide = Document(ROOT / locale / "guide.html")
                help_page = Document(ROOT / locale / "help.html")
                toc, = [node for node in guide.root.walk() if node.tag == "nav" and node.attrs.get("class") == "toc"]
                self.assertTrue(any(node.attrs.get("href") == "#mouse-gestures" for node in toc.walk()))
                self.assertTrue(any(node.attrs.get("href") == "./help#mouse-gestures-faq" for node in guide.by_id("mouse-gestures").walk()))
                self.assertTrue(any(node.attrs.get("href") == "./guide#mouse-gestures" for node in help_page.by_id("mouse-gestures-faq").walk()))

    def test_troubleshooting_is_in_the_main_faq_in_every_language(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                page = Document(ROOT / locale / "help.html")
                main_faq = list(page.by_id("faq").walk())
                for name in ("mouse-gestures-faq", "mouse-gestures-history", "mouse-gestures-minimize", "mouse-gestures-scroll"):
                    item = page.by_id(name)
                    self.assertIn(item, main_faq)
                    self.assertEqual("details", item.tag)
                    self.assertTrue(any(node.tag == "summary" and node.text() for node in item.children))
                    self.assertGreater(len(item.text()), 50)
                start = page.by_id("mouse-gestures-faq").text()
                for platform in ("PC", "Android", "Windows", "Mac"):
                    self.assertIn(platform, start)

    def test_guides_include_three_draw_steps_and_four_support_notes(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                section = Document(ROOT / locale / "guide.html").by_id("mouse-gestures")
                steps, = [node for node in section.walk() if node.attrs.get("class") == "gesture-steps"]
                self.assertEqual(3, len([node for node in steps.children if node.tag == "li"]))
                notes, = [node for node in section.walk() if node.attrs.get("class") == "panel gesture-notes"]
                self.assertEqual(4, len([node for node in notes.walk() if node.tag == "li"]))

    def test_all_locales_explain_adaptive_scroll_amount_and_safety_limits(self):
        amount_terms = {
            "": ("길게", "짧게", "앱마다"),
            "en": ("longer", "shorter", "varies by app"),
            "es": ("largo", "corto", ("según la app", "varía por app")),
            "ja": ("長く", "短く", ("アプリによって", "アプリ次第")),
            "zh": ("越长", "越短", "因应用"),
        }
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                guide = Document(ROOT / locale / "guide.html").by_id("mouse-gestures")
                help_page = Document(ROOT / locale / "help.html").by_id("mouse-gestures-scroll")
                self.assertIn("8", help_page.text())
                self.assertIn("10", help_page.text())
                self.assertTrue(any(node.attrs.get("href") == "./help#mouse-gestures-scroll"
                                    for node in guide.walk()))
                for content in (guide.text(), help_page.text()):
                    self.assertNotIn("32", content)
                    self.assertNotRegex(content, r"1[.,]5")
                    for term in amount_terms[locale]:
                        alternatives = term if isinstance(term, tuple) else (term,)
                        self.assertTrue(any(value.casefold() in content.casefold()
                                            for value in alternatives), alternatives)

    def test_all_locales_explain_release_and_pending_scroll_cancellation(self):
        policy_terms = {
            "": ("놓", "그리는 중", "클릭", "새 제스처", "앱 전환", "제어 종료", "커서 이동만으로는 멈추지 않습니다"),
            "en": ("release", "while drawing", "Clicking", "new gesture", "switching apps", "ending control", "Pointer movement alone does not stop it"),
            "es": ("botón", "mientras dibujas", "Clic", "otro gesto", "cambio de app", "fin del control", "Mover solo el cursor no lo detiene"),
            "ja": ("離", "描いている間", "クリック", "新しいジェスチャー", "アプリ切り替え", "操作終了", "カーソル移動だけでは止まりません"),
            "zh": ("松开", "绘制时", "点击", "新手势", "切换应用", "结束控制", "仅移动光标不会停止"),
        }
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                guide = Document(ROOT / locale / "guide.html").by_id("mouse-gestures")
                help_page = Document(ROOT / locale / "help.html").by_id("mouse-gestures-scroll")
                self.assertIn(policy_terms[locale][0].lower(), guide.text().lower())
                for term in policy_terms[locale]:
                    self.assertIn(term.lower(), help_page.text().lower())
                if locale == "es":
                    self.assertIn("suelta el botón derecho", help_page.text().lower())

    def test_gesture_table_does_not_inherit_keyboard_table_mobile_minimum(self):
        css = (ROOT / "css/onemouse.css").read_text(encoding="utf-8")
        self.assertRegex(css, r"table\.kt\.gesture-table\s*\{\s*min-width:\s*0;")
        self.assertRegex(css, r"table\.kt\s*\{[^}]*min-width:\s*440px;")
        self.assertRegex(css, r"\.gesture-table td:first-child\s*\{[^}]*white-space:\s*nowrap;")


if __name__ == "__main__":
    unittest.main()
