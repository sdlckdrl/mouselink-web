"""Keep Bluetooth setup separate from LAN in every localized guide."""
import unittest

from test_mouse_gesture_help import Document, LOCALES, ROOT


class BluetoothGuidanceTest(unittest.TestCase):
    def test_android_system_pairing_precedes_onemouse_connection(self):
        for locale in LOCALES:
            with self.subTest(locale=locale):
                folder = ROOT / locale
                guide = Document(folder / "guide.html")
                reference = Document(folder / "guide-reference.html")
                steps = [n.text() for n in guide.by_id("connect-bluetooth").walk() if n.tag == "li"]
                reference_steps = [
                    n.text() for n in reference.by_id("connect-bluetooth").walk() if n.tag == "li"
                ]
                self.assertEqual(len(steps), 3)
                self.assertEqual(steps, reference_steps)
                self.assertIn("Android 12", steps[0])
                self.assertIn("Windows", steps[1])
                self.assertNotIn("OneMouse", steps[1])
                self.assertIn("OneMouse", steps[2])
                self.assertRegex(guide.by_id("bluetooth").text(), r"Wi[-\u2011]Fi")
                self.assertIn("Google", guide.by_id("bluetooth").text())

    def test_reference_help_links_back_to_localized_mac_bluetooth_steps(self):
        for locale in LOCALES:
            with self.subTest(locale=locale):
                folder = ROOT / locale
                prefix = "/" + locale if locale else ""
                reference = Document(folder / "help-reference.html")
                hrefs = {n.attrs.get("href") for n in reference.root.walk() if n.tag == "a"}
                self.assertIn(prefix + "/guide#mac-bluetooth", hrefs)
                Document(folder / "guide.html").by_id("mac-bluetooth")
