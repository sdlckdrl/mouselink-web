"""Check that each localized reset FAQ illustrates only that locale's steps."""
import unittest
from xml.etree import ElementTree as ET

from test_mouse_gesture_help import Document, LOCALES, ROOT


class ResetFaqImagesTest(unittest.TestCase):
    def test_gallery_is_localized_lazy_and_non_navigating(self):
        for locale in LOCALES:
            lang = locale or 'ko'
            with self.subTest(lang=lang):
                doc = Document(ROOT / locale / 'help.html')
                section = doc.by_id('faq-device-reset')
                shots = [node for node in section.walk() if node.tag == 'figure']
                expected = ['windows-device-management-entry-ko.webp', f'faq-windows-reset-{lang}.svg',
                            f'faq-android-storage-{lang}.svg']
                self.assertEqual(len(shots), len(expected))
                for shot, filename in zip(shots, expected):
                    button, caption = shot.children
                    self.assertEqual((button.tag, caption.tag), ('button', 'figcaption'))
                    self.assertEqual(button.attrs['aria-haspopup'], 'dialog')
                    self.assertTrue(button.attrs['aria-label'] and caption.text())
                    image, = button.children
                    self.assertEqual(image.attrs['loading'], 'lazy')
                    self.assertTrue(image.attrs['alt'])
                    path = ROOT / image.attrs['src'].lstrip('/')
                    self.assertTrue(path.is_file())
                    self.assertEqual(path.name, filename)
                    if path.suffix == '.svg':
                        svg = ET.parse(path).getroot()
                        self.assertEqual(svg.get('{http://www.w3.org/XML/1998/namespace}lang'), lang)
                self.assertEqual(doc.by_id('faq-image-viewer').tag, 'dialog')
