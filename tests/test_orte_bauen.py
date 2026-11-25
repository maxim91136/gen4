"""Tests zu werkzeug/orte_bauen.py mit erfundenen Zeilen im Format von cities15000.
Die echten Daten hat noch keiner gesehen. Geprueft wird hier nur die Auswahlregel."""
import os, sys, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "werkzeug"))
import orte_bauen as ob

def zeile(i, name, b, l, code, land, ew):
    return "\t".join([str(i), name, name, "", str(b), str(l), "P", code, land, "", "", "", "", "", str(ew), "", "0", "Etc/UTC", "2026-01-01"])

# Erfundene Orte, keine Daten: Land AA mit Hauptstadt, die nicht die groesste Stadt ist,
# Land BB mit Hauptstadt gleich groesster Stadt, Land CC ohne Hauptstadt in der Datei.
PROBE = [zeile(1, "Hauptort", 10.123, 20.456, "PPLC", "AA", 300000),
         zeile(2, "Grossort", 11, 21, "PPLA", "AA", 6000000),
         zeile(3, "Riesenort", 12, 22, "PPL", "AA", 9000000),
         zeile(4, "Kleinort", 13, 23, "PPL", "AA", 20000),
         zeile(5, "Einzig", -5, 100, "PPLC", "BB", 150000),
         zeile(6, "Dorf", -6, 101, "PPL", "BB", 16000),
         zeile(7, "Insel", 0, -179.99, "PPLA", "CC", 50000),
         zeile(8, "Mittelort", 14, 24, "PPL", "AA", 100000)]

class Auswahl(unittest.TestCase):
    def setUp(self):
        self.tueren, self.suche, self.zahlen = ob.auswahl(ob.lesen(PROBE))

    def test_tueren_nach_regel(self):
        # Hauptstadt, groesste Stadt je Land, alles ab 5 Millionen, nichts doppelt.
        self.assertEqual(sorted(o["name"] for o in self.tueren), ["Einzig", "Grossort", "Hauptort", "Insel", "Riesenort"])

    def test_suchliste_ab_100000(self):
        self.assertEqual([o["name"] for o in self.suche], ["Riesenort", "Grossort", "Hauptort", "Einzig", "Mittelort"])

    def test_zahlen(self):
        self.assertEqual(self.zahlen["zeilen"], 8)
        self.assertEqual(self.zahlen["laendercodes"], 3)
        self.assertEqual(self.zahlen["laender_ohne_hauptstadt_in_der_datei"], ["CC"])
        self.assertFalse(self.zahlen["tueren_im_erwarteten_bereich"])

    def test_koordinaten_gerundet(self):
        o = next(o for o in self.tueren if o["name"] == "Hauptort")
        self.assertEqual((o["b"], o["l"]), (10.12, 20.46))

    def test_falsche_spaltenzahl_bricht_ab(self):
        with self.assertRaises(ValueError):
            ob.lesen(["1\tOrt\t10\t20"])

    def test_ausgabe_nennt_quelle_und_stand(self):
        a = ob.ausgabe(self.tueren, self.suche, self.zahlen, "2026-11-26")
        self.assertIn("GeoNames", a["quelle"]); self.assertIn("CC BY 4.0", a["quelle"])
        self.assertEqual(a["abgerufen"], "2026-11-26")
        self.assertEqual(len(a["tueren"][0]), len(a["tueren_spalten"]))
        self.assertEqual(len(a["orte"][0]), len(a["orte_spalten"]))
