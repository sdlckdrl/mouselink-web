"""The handoff is progressive enhancement of each existing localized guide step."""
import unittest
from urllib.parse import urlsplit
from xml.etree import ElementTree

from test_mouse_gesture_help import Document, LOCALES, ROOT


class GuideHandoffTest(unittest.TestCase):
    def test_three_local_steps_preserve_their_setup_text_and_linked_images(self):
        for locale in LOCALES:
            guide = Document(ROOT / locale / 'guide.html')
            steps = [node for node in guide.root.walk() if 'data-handoff' in node.attrs]
            self.assertEqual(['android', 'mac', 'windows'], [s.attrs['data-handoff'] for s in steps])
            for step in steps:
                device = step.attrs['data-handoff']
                with self.subTest(locale=locale or 'ko', device=device):
                    self.assertIs(guide.by_id(device + '-handoff'), step)
                    self.assertIn(step, list(guide.by_id(device).walk()))
                    self.assertTrue(any(n.tag == 'p' and n.text() for n in step.walk()))
                    self.assertFalse(any('hidden' in n.attrs for n in step.walk()))
                    detail, = [n for n in step.children if n.tag == 'details']
                    self.assertEqual('handoff-original', detail.attrs.get('class'))
                    self.assertNotIn('open', detail.attrs)
                    summary, figure = detail.children
                    self.assertEqual('summary', summary.tag)
                    self.assertTrue(summary.text().strip())
                    self.assertEqual('figure', figure.tag)
                    image, = [n for n in figure.walk() if n.tag == 'img']
                    self.assertTrue(image.attrs['alt'])
                    self.assertEqual(image.attrs['src'], image.parent.attrs['href'])
                    self.assertTrue((ROOT / image.attrs['src'].lstrip('/')).is_file())
                    for option in (n for n in guide.root.walk() if 'data-fragments' in n.attrs):
                        self.assertIn(step.attrs['id'], option.attrs['data-fragments'].split())

    def test_all_guides_load_the_same_deferred_enhancement(self):
        for locale in LOCALES:
            guide = Document(ROOT / locale / 'guide.html')
            scripts = [n for n in guide.root.walk()
                       if n.attrs.get('src', '').startswith('/js/guide-handoff')]
            self.assertEqual([urlsplit(n.attrs['src']).path for n in scripts], [
                '/js/guide-handoff-capture.js', '/js/guide-handoff-workspace.js', '/js/guide-handoff.js',
            ])
            self.assertTrue(all('defer' in s.attrs for s in scripts))
            self.assertTrue(any(urlsplit(n.attrs.get('href', '')).path == '/css/guide-handoff.css' for n in guide.root.walk()))
        for name in ('file-transfer-desk', 'windows-handoff-desk', 'android-notification-desk',
                     'android-tablet-gesture-desk'):
            self.assertTrue((ROOT / 'assets' / 'preview' / (name + '.webp')).is_file())


    def test_five_locales_share_final_heading_and_keep_targeted_setup_examples(self):
        for locale in LOCALES:
            guide = Document(ROOT / locale / 'guide.html')
            labels, titles = set(), set()
            for device in ('android', 'mac', 'windows'):
                panel = guide.by_id(device)
                steps, = [n for n in panel.children if n.tag == 'ol' and n.attrs.get('class') == 'steps']
                self.assertEqual(4,len(steps.children))
                step = guide.by_id(device + '-handoff')
                self.assertIs(step, steps.children[-1])
                titles.add(next(n.text() for n in step.children if n.tag == 'h3'))
                labels.add(next(n.text() for n in step.walk() if n.tag == 'summary'))
            self.assertEqual(1,len(titles))
            self.assertEqual(1,len(labels))
            for section, prefix in [('mac-handoff','windows-mac-layout'),
                                     ('windows-bluetooth','windows-bluetooth-setup')]:
                image, = [n for n in guide.by_id(section).walk() if n.tag == 'img']
                name = f'{prefix}-{locale or "ko"}.svg'
                self.assertTrue(image.attrs['src'].endswith('/'+name))
                asset = ROOT / image.attrs['src'].lstrip('/')
                svg = ElementTree.parse(asset).getroot()
                self.assertEqual('800',svg.attrib['width'])
                self.assertEqual('460',svg.attrib['height'])
