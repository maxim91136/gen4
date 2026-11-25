"""Tests zu werkzeug/tueren.py (geschlossene Rechnung). Aufruf: python3 -m unittest discover -s tests"""
import datetime, os, sys, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "werkzeug"))
import ortsschwellen as o
import tueren as t

BERLIN = (52.5, 13.4); ROM = (41.9, 12.5); TOKIO = (35.7, 139.7)

class Geschlossen(unittest.TestCase):
    def test_stimmt_mit_dem_abtasten_ueberein(self):
        # Zwei unabhaengige Wege zum selben Spalt: Abtasten in Minutenschritten und die Formel.
        for name, b, l in o.ORTE:
            for dek in (-23.44, -8.0, 0.0, 8.0, 23.44):
                alt = o.spalt(BERLIN, (b, l), dek); neu = t.spalt(BERLIN, (b, l), dek)
                if alt is None or neu is None:
                    # Am Rand (Beruehrung) darf das Abtasten ein Treffen verpassen, aber nicht weit weg davon.
                    self.assertTrue(alt is None and neu is None or abs((neu or alt)) < 90, name)
                    self.assertEqual(alt is None, neu is None, name)
                else:
                    self.assertAlmostEqual(alt, neu, delta=0.05, msg=name)

    def test_hoehe_gilt_fuer_beide(self):
        for name, b, l in o.ORTE:
            for dek in (-20.0, 3.0, 23.44):
                for s, h in t.treffen(BERLIN, (b, l), dek):
                    self.assertAlmostEqual(o.hoehe(BERLIN[0], BERLIN[1], dek, s), h, delta=1e-6, msg=name)
                    self.assertAlmostEqual(o.hoehe(b, l, dek, s), h, delta=1e-6, msg=name)

    def test_symmetrisch(self):
        for name, b, l in o.ORTE:
            self.assertAlmostEqual(t.spalt(BERLIN, (b, l), 10.0) or 0, t.spalt((b, l), BERLIN, 10.0) or 0, delta=1e-9, msg=name)

    def test_derselbe_ort_hat_kein_treffen(self):
        self.assertEqual(t.treffen(BERLIN, BERLIN, 5.0), [])

    def test_hoechstens_zwei(self):
        for name, b, l in o.ORTE:
            self.assertLessEqual(len(t.treffen(BERLIN, (b, l), -12.0)), 2, name)

class Uhrzeit(unittest.TestCase):
    def test_zeitgleichung_bekannte_werte(self):
        # Um den 3. November etwa +16,4 min, um den 11. Februar etwa -14,2 min (Astronomical Almanac, gerundet).
        self.assertAlmostEqual(t.zeitgleichung_minuten(datetime.date(2027, 11, 3)), 16.4, delta=0.5)
        self.assertAlmostEqual(t.zeitgleichung_minuten(datetime.date(2027, 2, 11)), -14.2, delta=0.5)

    def test_mittag_in_greenwich(self):
        self.assertAlmostEqual(t.utc_stunden(0, datetime.date(2027, 11, 3)), 12 - 16.4 / 60, delta=0.02)

class Tuer(unittest.TestCase):
    def test_rom_schliesst_im_winter(self):
        r = t.tuer(BERLIN, ROM, 2027)
        self.assertEqual(r["art"], "wechselt")
        zu = [d for d, w, _ in r["schwellen"] if w == "zu"]; auf = [d for d, w, _ in r["schwellen"] if w == "auf"]
        self.assertEqual(len(zu), 1); self.assertEqual(len(auf), 1)
        self.assertEqual(zu[0].month, 9); self.assertEqual(auf[0].month, 3)

    def test_tokio_haengt_an_der_mindesthoehe(self):
        # Bs Befund aus Lauf 5: bei 0 Grad schliesst Tokio nie, bei 5 Grad im Winter.
        self.assertEqual(t.tuer(BERLIN, TOKIO, 2027, mindest=0.0, band=0.0)["art"], "immer")
        self.assertEqual(t.tuer(BERLIN, TOKIO, 2027, mindest=5.0)["art"], "wechselt")

    def test_mindesthoehe_macht_strenger(self):
        for name, b, l in o.ORTE:
            for tag, sp in t.jahr(BERLIN, (b, l), 2027)[::30]:
                if t._offen(sp, 5.0): self.assertTrue(t._offen(sp, 0.0), name)

class Vergleichswerte(unittest.TestCase):
    def test_datei_passt_zum_code(self):
        # tests/vergleichswerte.json ist die Bruecke zum JavaScript-Modul (tests/rechnung.test.mjs).
        # Sie muss zu tueren.py passen. Neu schreiben: python3 werkzeug/vergleichswerte.py
        import json
        import vergleichswerte as v
        with open(v.PFAD, encoding="utf-8") as f:
            self.assertEqual(json.load(f), json.loads(json.dumps(v.bauen())))

    def test_fertig_punkt_1(self):
        # REGELN.md Abschnitt 9 Punkt 1, die Daten auf den Tag. Kapstadt hat vier Schwellen:
        # offen nur vom 17. Maerz bis 14. April und vom 29. August bis 26. September.
        soll = {"Rom": [("2027-03-25", "auf"), ("2027-09-18", "zu")],
                "Kapstadt": [("2027-03-17", "auf"), ("2027-04-14", "zu"), ("2027-08-29", "auf"), ("2027-09-26", "zu")],
                "Tokio": [("2027-01-31", "auf"), ("2027-11-10", "zu")]}
        for name, b, l in o.ORTE:
            if name in soll:
                r = t.tuer(BERLIN, (b, l), 2027)
                self.assertEqual([(d.isoformat(), w) for d, w, _ in r["schwellen"]], soll[name], name)
