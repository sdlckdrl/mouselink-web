"""Regression checks for current, localized help and feature instructions."""
import unittest
from xml.etree import ElementTree

from test_mouse_gesture_help import Document, LOCALES, ROOT


FAQ_LINKS = {
    "notification-reply-faq": "notifications",
    "device-order-faq": "device-order",
    "windows-remote-gestures-faq": "remote",
    "default-pc-faq": "text-to-pc",
    "file-receive-folder-faq": "file-receive-folder",
}
GUIDE_ANCHORS = ("notifications", "device-order", "file-receive-folder")
GUIDE_DETAIL_LINKS = {
    "windows-remote": "windows-remote-gestures-faq",
    "device-order": "device-order-faq",
    "file-receive-folder": "file-receive-folder-faq",
}
REPLY_TERMS = {
    "": ("PC", "Android", "원본", "답장", "지난", "수신"),
    "en": ("PC", "Android", "original", "reply", "history", "delivery"),
    "es": ("PC", "Android", "original", "responder", "historial", "destinatario"),
    "ja": ("PC", "Android", "元", "返信", "履歴", "受信"),
    "zh": ("电脑", "Android", "原始", "回复", "历史", "接收"),
}
ACCEPTED_LABELS = {
    "": "폰 앱으로 전달됨",
    "en": "Passed to phone app",
    "es": "Pasado a la aplicación del teléfono",
    "ja": "スマホのアプリに渡しました",
    "zh": "已传给手机应用",
}
HISTORY_TERMS = {
    "": ("켠 뒤", "인증번호", "민감", "암호화"),
    "en": ("after enabling", "verification codes", "sensitive", "encrypted"),
    "es": ("tras activarlo", "códigos", "sensible", "cifra"),
    "ja": ("有効にした後", "認証コード", "機密", "暗号化"),
    "zh": ("启用后", "验证码", "敏感", "加密"),
}
GAUGE_TERMS = {
    "": ("화살표", "세로 게이지", "강도", "위치"),
    "en": ("arrow", "vertical gauge", "stroke", "position"),
    "es": ("flecha", "indicador vertical", "intensidad", "posición"),
    "ja": ("矢印", "縦ゲージ", "強さ", "位置"),
    "zh": ("箭头", "竖", "强度", "位置"),
}


class SupportRefreshTest(unittest.TestCase):
    def guide_topic(self, guide, anchor):
        node = guide.by_id(anchor)
        return node.parent if node.tag in ("h2", "h3") else node

    def test_guides_have_notifications_in_the_toc(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                guide = Document(ROOT / locale / "guide.html")
                toc, = [node for node in guide.root.walk()
                        if node.tag == "nav" and node.attrs.get("class") == "toc"]
                self.assertTrue(any(node.attrs.get("href") == "#notifications"
                                    for node in toc.walk()))
                for anchor in GUIDE_ANCHORS:
                    self.assertGreater(len(self.guide_topic(guide, anchor).text()), 35)

    def test_notification_guide_keeps_controls_and_links_to_detailed_conditions(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                section = Document(ROOT / locale / "guide.html").by_id("notifications")
                content = section.text().casefold()
                self.assertIn("ctrl", content)
                self.assertIn("enter", content)
                for term in REPLY_TERMS[locale][:4]:
                    self.assertIn(term.casefold(), content)
                self.assertTrue(any(node.attrs.get("href") == "./help#notification-reply-faq"
                                    for node in section.walk()))

    def test_notification_help_retains_delivery_and_history_safeguards(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                help_page = Document(ROOT / locale / "help.html")
                content = help_page.by_id("notification-reply-faq").text().casefold()
                for term in REPLY_TERMS[locale]:
                    self.assertIn(term.casefold(), content)
                history = help_page.by_id("phone-notifications").text().casefold()
                for term in HISTORY_TERMS[locale] + ("7", "30", "200"):
                    self.assertIn(term.casefold(), history)

    def test_reply_success_labels_are_available_in_collapsed_help(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                help_page = Document(ROOT / locale / "help.html").by_id("notification-reply-faq")
                self.assertIn(ACCEPTED_LABELS[locale], help_page.text())
                self.assertNotIn("open", help_page.attrs)

    def test_recent_guide_cards_stay_concise(self):
        limits = {"notifications": 900, "windows-remote": 600, "device-order": 600,
                  "file-receive-folder": 600}
        for locale in LOCALES:
            guide = Document(ROOT / locale / "guide.html")
            for anchor, limit in limits.items():
                with self.subTest(locale=locale or "ko", anchor=anchor):
                    self.assertLessEqual(len(self.guide_topic(guide, anchor).text()), limit)

    def test_condensed_guide_cards_link_to_their_detailed_faqs(self):
        for locale in LOCALES:
            guide = Document(ROOT / locale / "guide.html")
            for anchor, faq_id in GUIDE_DETAIL_LINKS.items():
                with self.subTest(locale=locale or "ko", anchor=anchor):
                    topic = self.guide_topic(guide, anchor)
                    self.assertTrue(any(node.attrs.get("href") == f"./help#{faq_id}"
                                        for node in topic.walk()))

    def test_gestures_explain_direction_strength_and_not_document_position(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                guide = Document(ROOT / locale / "guide.html").by_id("mouse-gestures")
                help_page = Document(ROOT / locale / "help.html").by_id("mouse-gestures-scroll")
                for term in GAUGE_TERMS[locale][:-1]:
                    self.assertIn(term.casefold(), guide.text().casefold())
                for term in GAUGE_TERMS[locale]:
                    self.assertIn(term.casefold(), help_page.text().casefold())

    def test_new_faqs_are_in_main_faq_and_link_to_localized_guide(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                help_page = Document(ROOT / locale / "help.html")
                faq = list(help_page.by_id("faq").walk())
                for item_id, guide_anchor in FAQ_LINKS.items():
                    item = help_page.by_id(item_id)
                    self.assertEqual("details", item.tag)
                    self.assertNotIn("open", item.attrs)
                    self.assertIn(item, faq)
                    self.assertTrue(any(node.tag == "summary" and node.text()
                                        for node in item.children))
                    self.assertTrue(any(node.attrs.get("href") == f"./guide#{guide_anchor}"
                                        for node in item.walk()))

    def test_order_instructions_keep_lan_and_bluetooth_scope(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                guide = self.guide_topic(Document(ROOT / locale / "guide.html"), "device-order")
                help_page = Document(ROOT / locale / "help.html").by_id("device-order-faq")
                for node in (guide, help_page):
                    self.assertIn("LAN", node.text())
                self.assertTrue(any(term in help_page.text() for term in ("Bluetooth", "蓝牙")))

    def test_ids_and_guide_help_anchor_links_are_valid(self):
        for locale in LOCALES:
            pages = {name: Document(ROOT / locale / f"{name}.html")
                     for name in ("guide", "help")}
            for name, page in pages.items():
                with self.subTest(locale=locale or "ko", page=name):
                    ids = [node.attrs["id"] for node in page.root.walk()
                           if "id" in node.attrs]
                    self.assertEqual(len(ids), len(set(ids)))
                    for node in page.root.walk():
                        href = node.attrs.get("href", "")
                        if href.startswith("#"):
                            page.by_id(href[1:])
                        for target_name, target in pages.items():
                            prefix = f"./{target_name}#"
                            if href.startswith(prefix):
                                target.by_id(href[len(prefix):])

    def test_support_page_sitemap_dates_match_refresh(self):
        namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        sitemap = ElementTree.parse(ROOT / "sitemap.xml")
        dates = {node.findtext("sm:loc", namespaces=namespace):
                 node.findtext("sm:lastmod", namespaces=namespace)
                 for node in sitemap.findall("sm:url", namespace)}
        for locale in LOCALES:
            for page in ("guide", "help"):
                with self.subTest(locale=locale or "ko", page=page):
                    prefix = f"/{locale}" if locale else ""
                    self.assertEqual("2026-10-10", dates[
                        f"https://onemouse.pages.dev{prefix}/{page}"])


if __name__ == "__main__":
    unittest.main()
