"""Check navigation to a real page, file, or fragment in the public site."""
import posixpath
import unittest
from pathlib import Path
from urllib.parse import unquote, urlsplit

from test_mouse_gesture_help import Document, LOCALES, ROOT


PAGES = ("index", "guide", "guide-reference", "help", "help-reference",
         "compatibility", "features", "technical", "remote", "download", "compare")


class PublicGuideLinksTest(unittest.TestCase):
    def test_internal_links_resolve(self):
        documents = {}
        for locale in LOCALES:
            for path in (ROOT / locale).glob("*.html"):
                documents[path.relative_to(ROOT).as_posix()] = Document(path)
        for src, doc in documents.items():
            if Path(src).stem not in PAGES:
                continue
            for node in doc.root.walk():
                if node.tag != "a":
                    continue
                href = node.attrs.get("href", "")
                link = urlsplit(href)
                if link.scheme not in ("", "https", "http") or link.netloc not in (
                    "", "onemouse.pages.dev"
                ):
                    continue
                path = unquote(link.path)
                if not path:
                    target = src
                else:
                    target = posixpath.normpath(
                        path.lstrip("/") if path.startswith("/")
                        else posixpath.join(posixpath.dirname(src), path)
                    )
                    if path.endswith("/"):
                        target = posixpath.join(target, "index.html")
                        if target == "./index.html":
                            target = "index.html"
                    elif not Path(target).suffix:
                        target += ".html"
                with self.subTest(page=src, href=href):
                    self.assertTrue((ROOT / target).is_file())
                    if link.fragment and target in documents:
                        documents[target].by_id(unquote(link.fragment))

    def test_download_costs_send_readers_directly_to_stores(self):
        for locale in LOCALES:
            with self.subTest(locale=locale or "ko"):
                page = Document(ROOT / locale / "download.html")
                links = [node.attrs.get("href", "") for node in page.root.walk()
                         if node.tag == "a"]
                self.assertFalse(any(urlsplit(link).path.endswith("/pricing")
                                     for link in links))
                self.assertTrue(any("play.google.com" in link for link in links))
                self.assertTrue(any("apps.samsung.com" in link for link in links))
