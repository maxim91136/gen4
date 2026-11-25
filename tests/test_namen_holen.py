"""Tests zu werkzeug/namen_holen.py und zur Spalte name_de in werkzeug/orte_bauen.py.
Die Antworten von Wikidata sind hier nachgestellt, nicht abgerufen: Aus der Arbeitsumgebung ist
der Abfragedienst nicht erreichbar. Geprueft wird, was das Skript mit einer Antwort tut."""
import os, sys, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "werkzeug"))
# Der eigene Ordner muss im Suchpfad stehen: Der Actions-Lauf ruft die Tests als
# `tests.test_namen_holen` auf, nicht ueber `discover -s tests`. Ohne diese Zeile fand er
# test_orte_bauen nicht und brach ab (Lauf Nr. 1 von namen.yml, 2026-11-25).
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import orte_bauen as ob
import namen_holen as nh
from test_orte_bauen import PROBE

def zeile(g, q, de=None, sl=1, mul=None):
    z = {"g": {"type": "literal", "value": str(g)},
         "item": {"type": "uri", "value": f"http://www.wikidata.org/entity/Q{q}"},
         "sl": {"type": "literal", "value": str(sl)}}
    if de is not None:
        z["de"] = {"type": "literal", "xml:lang": "de", "value": de}
    if mul is not None:
        z["mul"] = {"type": "literal", "xml:lang": "mul", "value": mul}
    return z

def antwort(*zeilen):
    return {"head": {"vars": ["g", "item", "sl", "de", "mul"]}, "results": {"bindings": list(zeilen)}}

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
        self.assertIn('LANG(?mul) = "mul"', q)
        self.assertIn("wikibase:sitelinks", q)
        with self.assertRaises(ValueError):
            nh.abfrage(['1" } DROP'])

    def test_dienst_ist_wikidata_und_sonst_nichts(self):
        self.assertEqual(nh.DIENST, "https://query.wikidata.org/sparql")

class Auswerten(unittest.TestCase):
    def test_bei_gleichen_seitenlinks_gewinnt_die_kleinste_q_nummer(self):
        a = antwort(zeile(1, 500, "Spaeter"), zeile(1, 64, "Frueher"), zeile(1, 900, "Noch spaeter"))
        self.assertEqual(nh.auswerten(a, [1]), {"1": (1, 64, "Frueher", "de")})
        # Auch ueber zwei Antworten hinweg.
        b = nh.auswerten(antwort(zeile(1, 7, "Erster")), [1], nh.auswerten(a, [1]))
        self.assertEqual(b["1"], (1, 7, "Erster", "de"))

    def test_die_meisten_seitenlinks_gewinnen(self):
        # Der Fall aus dem ersten echten Lauf: ein Gebaeude mit kleinerer Q-Nummer fuehrt
        # dieselbe Kennung wie die Stadt.
        a = antwort(zeile(1, 5, "Gebäude des Ministeriums", sl=1), zeile(1, 3703, "Bamako", sl=180))
        self.assertEqual(nh.auswerten(a, [1])["1"], (180, 3703, "Bamako", "de"))
        # Reihenfolge der Zeilen ist gleichgueltig.
        b = antwort(zeile(1, 3703, "Bamako", sl=180), zeile(1, 5, "Gebäude des Ministeriums", sl=1))
        self.assertEqual(nh.auswerten(b, [1])["1"], (180, 3703, "Bamako", "de"))

    def test_gewinner_ohne_namen_wird_nicht_ersetzt(self):
        a = antwort(zeile(1, 3703, sl=180), zeile(1, 5, "Gebäude", sl=1))
        g = nh.auswerten(a, [1])
        self.assertEqual(g["1"], (180, 3703, None, None))
        self.assertEqual(nh.ausgabe(g, "2026-11-26")["namen"], {})
        self.assertEqual(nh.ausgabe(g, "2026-11-26")["herkunft"], {"1": [3703, 180, None]})

    def test_mul_nur_ohne_deutsches_label(self):
        a = antwort(zeile(1, 10, "Zürich", sl=5, mul="Zurich"), zeile(2, 20, sl=5, mul="Bern"),
                    zeile(3, 30, "<kaputt>", sl=5, mul="Monaco"), zeile(5, 50, sl=5, mul="<auch kaputt>"))
        g = nh.auswerten(a, [1, 2, 3, 5])
        self.assertEqual(g["1"], (5, 10, "Zürich", "de"))
        self.assertEqual(g["2"], (5, 20, "Bern", "mul"))
        self.assertEqual(g["3"], (5, 30, "Monaco", "mul"))
        self.assertEqual(g["5"], (5, 50, None, None))

    def test_zeile_ohne_seitenlinks_zaehlt_nicht(self):
        z = zeile(1, 10, "Rom"); del z["sl"]
        y = zeile(1, 11, "Rom"); y["sl"]["value"] = "viele"
        self.assertEqual(nh.auswerten(antwort(z, y), [1]), {})

    def test_unbrauchbares_und_ungefragtes_faellt_weg(self):
        a = antwort(zeile(1, 1, "<b>Rom</b>"), zeile(2, 2, "x" * 61), zeile(3, 3, " Rand "),
                    zeile(5, 5, "Zeile\numbruch"), zeile(7, 7, "12345"), zeile(8, 8, ""),
                    zeile(99, 9, "Ungefragt"), {"g": {"value": "1"}}, zeile(1, "x", "Kaputt"))
        g = nh.auswerten(a, [1, 2, 3, 5, 7, 8])
        self.assertEqual(nh.ausgabe(g, "2026-11-26")["namen"], {})
        self.assertNotIn("99", g)

    def test_brauchbar(self):
        for gut in ["Rom", "Mexiko-Stadt", "São Paulo", "Frankfurt am Main", "N’Djamena", "Köln", "東京"]:
            self.assertTrue(nh.brauchbar(gut), gut)
        for schlecht in ["", " ", "a\tb", "a​b", "<i>", None, 5, "x" * 61]:
            self.assertFalse(nh.brauchbar(schlecht), repr(schlecht))

    def test_ausgabe_nennt_quelle_und_stand(self):
        a = nh.ausgabe({"10": (4, 1, "Zehn", "de"), "9": (3, 2, "Neun", "mul")}, "2026-11-26")
        self.assertIn("Wikidata", a["quelle"]); self.assertIn("CC0", a["quelle"])
        self.assertEqual(a["abgerufen"], "2026-11-26")
        self.assertEqual(list(a["namen"].items()), [("9", "Neun"), ("10", "Zehn")])
        self.assertEqual(a["herkunft"], {"9": [2, 3, "mul"], "10": [1, 4, "de"]})

class SpalteNameDe(unittest.TestCase):
    def setUp(self):
        self.tueren, self.suche, self.zahlen = ob.auswahl(ob.lesen(PROBE))
        # Hauptort heisst deutsch anders, Grossort gleich, die uebrigen fehlen bei Wikidata.
        self.namen = nh.ausgabe({"1": (9, 1, "Hauptstadt", "de"), "2": (9, 2, "Grossort", "de")}, "2026-11-26")

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

    def test_stadt_vor_dem_namen_ist_kein_anderer_name(self):
        o = {"id": 1, "name": "Madrid"}
        self.assertEqual(ob.name_de(o, {"1": "Stadt Madrid"}), "")
        self.assertEqual(ob.name_de(o, {"1": "Madrid"}), "")
        self.assertEqual(ob.name_de(o, {"1": "Madrid-Stadt"}), "Madrid-Stadt")
        self.assertEqual(ob.name_de({"id": 1, "name": "Mexico City"}, {"1": "Mexiko-Stadt"}), "Mexiko-Stadt")

if __name__ == "__main__":
    unittest.main()
