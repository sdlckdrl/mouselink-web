import re
import unittest
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
ROUTES = ("", "features", "guide", "help", "download", "compatibility")
LANGS = dict(zip(("ko","en","ja","zh","es","pt-BR","de","zh-TW","fr","id"),
                 ("","en/","ja/","zh/","es/","pt-br/","de/","zh-tw/","fr/","id/")))
HOST = "https://onemouse.pages.dev"

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.tags = {}
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        self.tags.setdefault(tag, []).append(dict(attrs))

def resolve(route):
    p = ROOT / urlsplit(route).path.lstrip("/")
    return p / "index.html" if route.endswith("/") else p.with_suffix(".html") if not p.suffix else p

class LocaleTests(unittest.TestCase):
    def test_routes_reciprocal_and_indexed(self):
        sitemap = [e.text for e in ET.parse(ROOT/"sitemap.xml").iter() if e.tag.endswith("}loc")]
        self.assertEqual(len(sitemap),len(set(sitemap)))
        for page in ROUTES:
            expected = {l:HOST+"/"+prefix+page for l,prefix in LANGS.items()}
            expected["x-default"] = HOST+"/"+page
            for lang,prefix in LANGS.items():
                with self.subTest(page=page,lang=lang):
                    route = "/"+prefix+page
                    s = resolve(route).read_text(encoding="utf-8")
                    self.assertNotIn("\ufffd",s)
                    p = Page(s)
                    alts = {a["hreflang"]:a["href"] for a in p.tags["link"] if a["rel"]=="alternate" and "hreflang" in a}
                    self.assertEqual(expected,alts)
                    self.assertIn(HOST+route,sitemap)
                    pickers = [a for a in p.tags["select"] if "data-language-picker" in a]
                    self.assertEqual(len(pickers),1)
                    self.assertEqual(lang,pickers[0]["data-current-language"])
                    opts = [a for a in p.tags["option"] if "data-language-route" in a]
                    self.assertEqual(len(opts),10)
                    self.assertEqual({l:"/"+d+page for l,d in LANGS.items()},
                                     {o["value"]:o["data-language-route"] for o in opts})
                    self.assertEqual([lang],[o["value"] for o in opts if "selected" in o])
                    self.assertIn(HOST+route,[a["href"] for a in p.tags["link"] if a["rel"]=="canonical"])
                    if lang in ("ko","en","ja","zh","es"):
                        continue
                    self.assertEqual(lang,p.tags["html"][0]["lang"])
                    ids = set(re.findall(r'\bid="([^"]+)"',s))
                    for entry in p.tags["a"]:
                        href = entry["href"]
                        if href.startswith("/"):
                            self.assertTrue(resolve(href).is_file(),href)
                        if href.startswith("#"):
                            self.assertIn(href[1:],ids)
                    if page == "download":
                        fallback = Page(resolve("/en/download").read_text(encoding="utf-8"))
                        for attribute in ("data-latest-windows-download","data-latest-macos-download"):
                            ours = [a["href"] for a in p.tags["a"] if attribute in a]
                            expected_asset = [a["href"] for a in fallback.tags["a"] if attribute in a]
                            self.assertEqual(expected_asset,ours)
