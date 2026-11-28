import re
import unittest
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree
from collections import Counter
from html.parser import HTMLParser

from test_web_locales import Page, resolve
from scripts.generate_full_web_locales import HOST, LANGS, NEW, PUBLIC, REFERENCE, ROUTES, ROOT, PICK, addr, ids

class Neat(HTMLParser):
    def __init__(self,text):
        super().__init__()
        self.sig=[]
        self.feed(PICK.sub("",text))
    def handle_starttag(self,tag,attrs):
        if tag not in ('link','meta'):
            self.sig.append((tag,dict(attrs).get('id'),dict(attrs).get('class')))
    def handle_startendtag(self,tag,attrs): self.handle_starttag(tag,attrs)

class FullLocaleTests(unittest.TestCase):
    def test_all_pages_keep_english_structure_and_local_links(self):
        for page in ROUTES:
            english=resolve(addr('en',page)).read_text(encoding='utf8')
            structure=Neat(english).sig
            for lang in NEW:
                with self.subTest(page=page,lang=lang):
                    route=addr(lang,page)
                    html=resolve(route).read_text(encoding='utf8')
                    self.assertEqual(structure,Neat(html).sig)
                    self.assertEqual(ids(english),ids(html))
                    self.assertNotIn('\u2581',html)
                    self.assertNotIn('\ufffd',html)
                    p=Page(html)
                    self.assertEqual(p.tags['html'][0]['lang'],lang)
                    self.assertNotEqual(re.search(r'<title>(.*?)</title>',html)[1],
                                        re.search(r'<title>(.*?)</title>',english)[1])
                    for a in Page(PICK.sub('',html)).tags.get('a',[]):
                        h=a.get('href','')
                        if not h.startswith('/') or h.startswith('//'): continue
                        path=urlparse(h).path or "/"
                        if path.startswith('/en/') and (resolve(path).exists()):
                            self.fail(f'English navigation fallback: {h}')
                        if path.startswith('/'+NEW[lang][0]+'/'):
                            self.assertTrue(resolve(path).exists(),h)
                    for a in p.tags.get('script',[]):
                        asset=urlparse(a.get('src','')).path
                        if asset.startswith('/js/'):
                            self.assertTrue((ROOT/asset[1:]).is_file(),asset)

    def test_ten_reciprocal_languages_and_indexability(self):
        loc=[e.text for e in ElementTree.parse(ROOT/'sitemap.xml').iter() if e.tag.endswith('}loc')]
        self.assertEqual(len(loc),len(set(loc)))
        headers=(ROOT/'_headers').read_text(encoding='utf8')
        for page in ROUTES:
            expected={l:HOST+addr(l,page) for l in LANGS}|{'x-default':HOST+addr('ko',page)}
            for lang in LANGS:
                with self.subTest(page=page,lang=lang):
                    p=Page(resolve(addr(lang,page)).read_text(encoding='utf8'))
                    links={a["hreflang"]:a["href"] for a in p.tags["link"] if a.get("rel")=="alternate" and "hreflang" in a}
                    self.assertEqual(links,expected)
                    opts=[x for x in p.tags['option'] if 'data-language-route' in x]
                    self.assertEqual({a['value']:a['data-language-route'] for a in opts},
                                     {l:addr(l,page) for l in LANGS})
                    self.assertEqual([lang],[o['value'] for o in opts if 'selected' in o])
                    if lang in NEW and page in REFERENCE:
                        self.assertNotIn(HOST+addr(lang,page),loc)
                        self.assertIn(addr(lang,page)+'\n  X-Robots-Tag: noindex, follow',headers)
                    if lang in NEW and page in PUBLIC:
                        self.assertIn(HOST+addr(lang,page),loc)
