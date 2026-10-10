"""Keep concise public copy discoverable and consistent across five locales."""
import json
import unittest
from urllib.parse import unquote, urljoin, urlsplit
from xml.etree import ElementTree

from test_mouse_gesture_help import Document, LOCALES, ROOT


PAGES = ("index", "guide", "help", "compare", "technical")


def has_class(node, name):
    return name in node.attrs.get("class", "").split()


def structured_data(page):
    for node in page.root.walk():
        if node.tag == "script" and node.attrs.get("type") == "application/ld+json":
            data = json.loads("".join(node.parts))
            yield from data.get("@graph", [data])


class SiteCopyCleanupTest(unittest.TestCase):
    def test_public_pages_have_valid_json_and_locale_metadata(self):
        for locale in LOCALES:
            for name in PAGES:
                with self.subTest(locale=locale or "ko", page=name):
                    page = Document(ROOT / locale / f"{name}.html")
                    html, = [node for node in page.root.walk() if node.tag == "html"]
                    self.assertEqual(locale or "ko", html.attrs.get("lang"))
                    route = f"/{locale}/" if locale else "/"
                    if name != "index":
                        route += name
                    canonical, = [node for node in page.root.walk()
                                  if node.tag == "link" and node.attrs.get("rel") == "canonical"]
                    self.assertEqual(f"https://onemouse.pages.dev{route}",
                                     canonical.attrs.get("href"))
                    list(structured_data(page))

    def test_public_page_local_links_and_fragments_resolve(self):
        cache = {}
        for locale in LOCALES:
            for name in PAGES:
                path = ROOT / locale / f"{name}.html"
                page = Document(path)
                base = "https://onemouse.pages.dev/" + path.relative_to(ROOT).as_posix()
                ids = [node.attrs["id"] for node in page.root.walk() if "id" in node.attrs]
                self.assertEqual(len(ids), len(set(ids)), path)
                for node in page.root.walk():
                    if node.tag != "a" or not node.attrs.get("href"):
                        continue
                    href = node.attrs["href"]
                    url = urlsplit(urljoin(base, href))
                    if url.scheme not in ("http", "https") or url.hostname != "onemouse.pages.dev":
                        continue
                    target = ROOT / unquote(url.path).lstrip("/")
                    if not target.suffix:
                        target = target / "index.html" if target.is_dir() else target.with_suffix(".html")
                    if target.suffix != ".html":
                        continue
                    with self.subTest(source=str(path.relative_to(ROOT)), href=href):
                        self.assertTrue(target.is_file(), target)
                        if url.fragment:
                            if target not in cache:
                                cache[target] = Document(target)
                            cache[target].by_id(unquote(url.fragment))

    def test_home_features_and_android_setup_stay_concise(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                home = Document(ROOT / locale / "index.html")
                use = home.by_id("use")
                cards = [node for node in use.walk() if node.tag == "article" and has_class(node, "card")]
                self.assertEqual(7, len(cards))
                for card in cards:
                    for paragraph in card.walk():
                        if paragraph.tag == "p" and not has_class(paragraph, "card-lbl"):
                            self.assertLessEqual(len(paragraph.text()), 220)
                self.assertFalse(any(has_class(node, "sec-lead") for node in use.walk()))
                setup = home.by_id("setup")
                heading, = [node for node in setup.walk() if node.tag == "h2"]
                self.assertIn("Android", heading.text())
                self.assertEqual(4, sum(has_class(node, "step") for node in setup.walk()))
                self.assertTrue(any(node.attrs.get("href") == "./guide#mac" for node in setup.walk()))
                self.assertTrue(any(node.attrs.get("href") == "./guide#notifications" for node in use.walk()))

    def test_guide_permissions_link_to_dedicated_technical_detail(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                permissions = Document(ROOT / locale / "guide.html").by_id("permissions")
                self.assertLessEqual(len(permissions.text()), 650)
                self.assertTrue(any(node.attrs.get("href") == "./technical#permissions"
                                    for node in permissions.walk()))

    def test_shortened_home_references_have_visible_link_styling(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                home = Document(ROOT / locale / "index.html")
                for href in ("./guide#files", "./guide#notifications", "./guide#mac",
                             "./help#phone-notifications"):
                    links = [node for node in home.root.walk()
                             if node.tag == "a" and node.attrs.get("href") == href]
                    self.assertTrue(links, href)
                    self.assertTrue(any(has_class(node, "text-link") for node in links), href)
        css = (ROOT / "css" / "onemouse.css").read_text(encoding="utf-8")
        self.assertIn("a.text-link {", css)
        self.assertIn("text-decoration: underline;", css)

    def test_history_policy_is_collapsed_but_still_in_notification_help(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                help_page = Document(ROOT / locale / "help.html")
                history = help_page.by_id("notification-history")
                self.assertEqual("details", history.tag)
                self.assertNotIn("open", history.attrs)
                self.assertIn(history, list(help_page.by_id("phone-notifications").walk()))
                help_page.by_id("bluetooth-help")

    def test_comparison_faq_matches_structured_answers(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                page = Document(ROOT / locale / "compare.html")
                schema, = [data for data in structured_data(page) if data.get("@type") == "FAQPage"]
                answers = {}
                for item in page.by_id("faq").walk():
                    if item.tag != "details":
                        continue
                    summary, = [node for node in item.children if node.tag == "summary"]
                    body, = [node for node in item.children if has_class(node, "a")]
                    answers[summary.text()] = body.text()
                self.assertEqual(len(answers), len(schema["mainEntity"]))
                for item in schema["mainEntity"]:
                    self.assertEqual(" ".join(item["acceptedAnswer"]["text"].split()),
                                     answers[item["name"]])
                self.assertNotIn("SPAKE2", page.by_id("faq").text())

    def test_historical_status_notice_is_outside_release_entries(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                page = Document(ROOT / locale / "technical.html")
                note = page.by_id("updates-history-note")
                self.assertIn(note, list(page.by_id("updates").walk()))
                self.assertGreater(len(note.text()), 10)
                parent = note.parent
                while parent:
                    self.assertFalse(has_class(parent, "log-item"))
                    parent = parent.parent

    def test_sitemap_cleanup_dates_cover_changed_public_pages(self):
        namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        dates = {node.findtext("sm:loc", namespaces=namespace):
                 node.findtext("sm:lastmod", namespaces=namespace)
                 for node in ElementTree.parse(ROOT / "sitemap.xml").findall("sm:url", namespace)}
        for locale in LOCALES:
            for name in PAGES:
                route = f"/{locale}/" if locale else "/"
                if name != "index":
                    route += name
                with self.subTest(locale=locale or "ko", page=name):
                    self.assertEqual("2026-10-10", dates[f"https://onemouse.pages.dev{route}"])


if __name__ == "__main__":
    unittest.main()
