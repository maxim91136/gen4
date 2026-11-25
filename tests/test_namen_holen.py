"""Tests zu werkzeug/namen_holen.py und zur Spalte name_de in werkzeug/orte_bauen.py.
Die Antworten von Wikidata sind hier nachgestellt, nicht abgerufen: Aus der Arbeitsumgebung ist
der Abfragedienst nicht erreichbar. Geprueft wird, was das Skript mit einer Antwort tut."""
import os, sys, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "werkzeug"))
import orte_bauen as ob
import namen_holen as nh
from test_orte_bauen import PROBE

def zeile(g, q, de):
    return {"g": {"type": "literal", "value": str(g)},
            "item": {"type": "uri", "value": f"http://www.wikidata.org/entity/Q{q}"},
            "de": {"type": "literal", "xml:lang": "de", "value": de}}

def antwort(*zeilen):
    return {"head": {"vars": ["g", "item", "de"]}, "results": {"bindings": list(zeilen)}}

class Abfrage(unittest.TestCase):
    def test_stapel_und_kennungen(self):
        tueren, suche, _ = ob.auswahl(ob.lesen(PROBE))
        ids = nh.kennungen(tueren, suche)
        self.assertEqual(ids, [1, 2, 3, 5, 7, 8])          # Tueren und Suchliste, nichts doppelt
        self.assertEqual(nh.stapel(list(range(7)), 3), [[0, 1, 2], [3, 4, 5], [6]])
        self.assertEqual(nh.stapel([]), [])

    def test_abfrage_enthaelt_nur_zahlen(self):
        q = nh.abfrage([2950159, 3169070])
        self.assertIn('VALUES ?g { "2950159" "3169070" }', q)
        self.assertIn("wdt:P1566", q)
        self.assertIn('LANG(?de) = "de"', q)
        with self.assertRaises(ValueError):
            nh.abfrage(['1" } DROP'])

    def test_dienst_ist_wikidata_und_sonst_nichts(self):
        self.assertEqual(nh.DIENST, "https://query.wikidata.org/sparql")

class Auswerten(unittest.TestCase):
    def test_kleinste_q_nummer_gewinnt(self):
        a = antwort(zeile(1, 500, "Spaeter"), zeile(1, 64, "Frueher"), zeile(1, 900, "Noch spaeter"))
        self.assertEqual(nh.auswerten(a, [1]), {"1": (64, "Frueher")})
        # Auch ueber zwei Antworten hinweg.
        b = nh.auswerten(antwort(zeile(1, 7, "Erster")), [1], nh.auswerten(a, [1]))
        self.assertEqual(b["1"], (7, "Erster"))

    def test_unbrauchbares_und_ungefragtes_faellt_weg(self):
        a = antwort(zeile(1, 1, "<b>Rom</b>"), zeile(2, 2, "x" * 61), zeile(3, 3, " Rand "),
                    zeile(5, 5, "Zeile\numbruch"), zeile(7, 7, "12345"), zeile(8, 8, ""),
                    zeile(99, 9, "Ungefragt"), {"g": {"value": "1"}}, zeile(1, "x", "Kaputt"))
        self.assertEqual(nh.auswerten(a, [1, 2, 3, 5, 7, 8]), {})

    def test_brauchbar(self):
        for gut in ["Rom", "Mexiko-Stadt", "São Paulo", "Frankfurt am Main", "N’Djamena", "Köln", "東京"]:
            self.assertTrue(nh.brauchbar(gut), gut)
        for schlecht in ["", " ", "a\tb", "a​b", "<i>", None, 5, "x" * 61]:
            self.assertFalse(nh.brauchbar(schlecht), repr(schlecht))

    def test_ausgabe_nennt_quelle_und_stand(self):
        a = nh.ausgabe({"10": (1, "Zehn"), "9": (2, "Neun")}, "2026-11-26")
        self.assertIn("Wikidata", a["quelle"]); self.assertIn("CC0", a["quelle"])
        self.assertEqual(a["abgerufen"], "2026-11-26")
        self.assertEqual(list(a["namen"].items()), [("9", "Neun"), ("10", "Zehn")])

class SpalteNameDe(unittest.TestCase):
    def setUp(self):
        self.tueren, self.suche, self.zahlen = ob.auswahl(ob.lesen(PROBE))
        # Hauptort heisst deutsch anders, Grossort gleich, die uebrigen fehlen bei Wikidata.
        self.namen = nh.ausgabe({"1": (1, "Hauptstadt"), "2": (2, "Grossort")}, "2026-11-26")

    def test_ohne_namen_bleibt_die_alte_form(self):
        a = ob.ausgabe(self.tueren, self.suche, self.zahlen, "2026-11-25")
        self.assertEqual(a["tueren_spalten"][-1], "einwohner")
        self.assertNotIn("namen_quelle", a)

    def test_mit_namen(self):
        a = ob.ausgabe(self.tueren, self.suche, self.zahlen, "2026-11-25", self.namen)
        self.assertEqual(a["tueren_spalten"][-1], "name_de")
        self.assertEqual(a["orte_spalten"], ["name", "land", "breite", "laenge", "name_de"])
        self.assertEqual({z[1]: z[6] for z in a["tueren"]},
                         {"Hauptort": "Hauptstadt", "Grossort": "", "Riesenort": "", "Einzig": "", "Insel": ""})
        self.assertEqual({z[0]: z[4] for z in a["orte"]}["Hauptort"], "Hauptstadt")
        self.assertEqual(a["namen_abgerufen"], "2026-11-26")
        self.assertIn("CC0", a["namen_quelle"])
        z = a["zahlen"]
        self.assertEqual((z["tueren_ohne_deutschen_namen"], z["tueren_mit_anderem_deutschen_namen"]), (3, 1))
        self.assertEqual((z["suchliste_ohne_deutschen_namen"], z["suchliste_mit_anderem_deutschen_namen"]), (3, 1))
        # Die Zahlen der Auswahl selbst aendern sich nicht.
        self.assertEqual(z["tueren"], self.zahlen["tueren"])
        self.assertNotIn("tueren_ohne_deutschen_namen", self.zahlen)

if __name__ == "__main__":
    unittest.main()
