"""Tests zur Rechnung werkzeug/ortsschwellen.py. Aufruf: python3 -m unittest discover -s tests"""
import datetime, os, sys, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "werkzeug"))
import ortsschwellen as o

BERLIN = (52.5, 13.4)

class Deklination(unittest.TestCase):
    def test_sonnenwenden_und_gleiche(self):
        self.assertAlmostEqual(o.deklination(datetime.date(2027, 6, 21)), 23.44, delta=0.05)
        self.assertAlmostEqual(o.deklination(datetime.date(2027, 12, 22)), -23.44, delta=0.05)
        self.assertLess(abs(o.deklination(datetime.date(2027, 3, 20))), 0.5)

class Erreichbar(unittest.TestCase):
    def test_symmetrisch(self):
        for name, b, l in o.ORTE[:12]:
            for dek in (-23.44, -5.0, 0.0, 12.0, 23.44):
                self.assertEqual(o.erreichbar(BERLIN, (b, l), dek), o.erreichbar((b, l), BERLIN, dek), name)

    def test_gleiche_breite_immer(self):
        # Orte auf demselben Breitenkreis teilen die Sonne, wenn sie genau zwischen ihnen steht.
        for dek in (-23.44, 0.0, 23.44):
            self.assertTrue(o.erreichbar(BERLIN, (52.5, 60.0), dek))

    def test_spiegelort_nur_um_die_gleiche(self):
        spiegel = (-52.5, 13.4)
        self.assertTrue(o.erreichbar(BERLIN, spiegel, 0.0))
        self.assertFalse(o.erreichbar(BERLIN, spiegel, 23.44))
        self.assertFalse(o.erreichbar(BERLIN, spiegel, -23.44))

    def test_mindesthoehe_macht_strenger(self):
        for name, b, l in o.ORTE:
            for dek in (-23.44, 0.0, 23.44):
                if o.erreichbar(BERLIN, (b, l), dek, 5.0):
                    self.assertTrue(o.erreichbar(BERLIN, (b, l), dek, 0.0), name)

class Treffen(unittest.TestCase):
    """A Lauf 5: der Augenblick des Treffens und seine Hoehe (der 'Spalt')."""
    def test_hoehe_ist_fuer_beide_gleich(self):
        for name, b, l in o.ORTE[:20]:
            for dek in (-23.44, 0.0, 15.0):
                for s, h in o.treffen(BERLIN, (b, l), dek):
                    self.assertAlmostEqual(o.hoehe(BERLIN[0], BERLIN[1], dek, s), h, delta=0.05, msg=name)
                    self.assertAlmostEqual(o.hoehe(b, l, dek, s), h, delta=0.05, msg=name)

    def test_spalt_passt_zu_erreichbar(self):
        for name, b, l in o.ORTE:
            for dek in (-23.44, -8.0, 0.0, 8.0, 23.44):
                sp = o.spalt(BERLIN, (b, l), dek)
                self.assertEqual(o.erreichbar(BERLIN, (b, l), dek), sp is not None and sp > 0, name)

    def test_rom_spalt_schrumpft_zum_herbst(self):
        rom = (41.9, 12.5)
        juni = o.spalt(BERLIN, rom, o.deklination(datetime.date(2027, 6, 21)))
        sept = o.spalt(BERLIN, rom, o.deklination(datetime.date(2027, 9, 20)))
        dez = o.spalt(BERLIN, rom, o.deklination(datetime.date(2027, 12, 21)))
        self.assertGreater(juni, 30); self.assertTrue(0 < sept < 10); self.assertLess(dez, -20)

    def test_uhrzeit(self):
        self.assertAlmostEqual(o.utc_aus_sonnenlaenge(0), 12.0)
        self.assertAlmostEqual(o.utc_aus_sonnenlaenge(-15), 13.0)
        self.assertAlmostEqual(o.utc_aus_sonnenlaenge(180), 0.0)

class Schwellen(unittest.TestCase):
    def test_auf_und_zu_halten_sich_die_waage(self):
        aus, immer, nie = o.schwellen(BERLIN, 2027, orte=o.ORTE[:15])
        auf = sum(1 for a in aus if a[2] == "auf"); zu = sum(1 for a in aus if a[2] == "zu")
        self.assertLessEqual(abs(auf - zu), len(o.ORTE[:15]))
        self.assertEqual(aus, sorted(aus))

if __name__ == "__main__":
    unittest.main()
