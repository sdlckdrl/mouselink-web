"""The handoff is progressive enhancement of each existing localized guide step."""
import unittest

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
                    figure, = [n for n in step.children if n.tag == 'figure']
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
            self.assertEqual([n.attrs['src'] for n in scripts], [
                '/js/guide-handoff-capture.js', '/js/guide-handoff-workspace.js', '/js/guide-handoff.js',
            ])
            self.assertTrue(all('defer' in s.attrs for s in scripts))
            self.assertTrue(any(n.attrs.get('href') == '/css/guide-handoff.css' for n in guide.root.walk()))
        for name in ('file-transfer-desk', 'windows-handoff-desk', 'android-notification-desk',
                     'android-tablet-gesture-desk'):
            self.assertTrue((ROOT / 'assets' / 'preview' / (name + '.webp')).is_file())
