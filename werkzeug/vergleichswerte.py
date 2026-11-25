"""Schreibt tests/vergleichswerte.json: Zahlen aus der Python-Rechnung, gegen die das
JavaScript-Modul der Seite (site/rechnung.mjs) getestet wird. A Lauf 7.

Aufruf: python3 werkzeug/vergleichswerte.py   (schreibt die Datei neu)

Ein Python-Test prueft, dass die Datei zum Code passt. Wer tueren.py aendert, muss sie
neu schreiben, sonst schlaegt der Test fehl.
"""
import datetime, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import ortsschwellen as o
import tueren as t

JAHR = 2027
# Standorte fuer den Vergleich. Koordinaten wie in ortsschwellen.py aus dem Gedaechtnis,
# gerundet, KEINE Daten fuer die Seite. Sie decken die Faelle aus REGELN.md Abschnitt 9
# Punkt 3 ab: jenseits des Polarkreises, am Aequator, an der Datumsgrenze.
STANDORTE = [("Berlin", 52.5, 13.4), ("Quito", -0.2, -78.5), ("Longyearbyen", 78.2, 15.6),
             ("Datumsgrenze", -18.1, 179.9), ("Sydney", -33.9, 151.2)]
TAGE = [datetime.date(JAHR, m, d) for m, d in ((1, 1), (2, 11), (3, 20), (5, 14), (6, 21), (7, 26), (9, 18), (11, 3), (12, 21), (12, 31))]

def bauen():
    aus = {"jahr": JAHR, "hinweis": "Erzeugt von werkzeug/vergleichswerte.py. Nicht von Hand aendern.",
           "sonne": [], "treffen": [], "tueren": []}
    for tag in TAGE:
        aus["sonne"].append({"tag": tag.isoformat(), "deklination": o.deklination(tag),
                             "zeitgleichung": t.zeitgleichung_minuten(tag)})
    for sname, sb, sl in STANDORTE:
        for name, b, l in o.ORTE:
            for tag in TAGE[::3]:
                dek = o.deklination(tag)
                aus["treffen"].append({"ich": [sb, sl], "ort": [b, l], "tag": tag.isoformat(),
                    "treffen": [{"hoehe": h, "utc": t.utc_stunden(s, tag)} for s, h in t.treffen((sb, sl), (b, l), dek)]})
            r = t.tuer((sb, sl), (b, l), JAHR)
            aus["tueren"].append({"standort": sname, "ich": [sb, sl], "name": name, "ort": [b, l],
                "art": r["art"], "streift": r["streift"],
                "schwellen": [{"tag": d.isoformat(), "was": w, "ungefaehr": u} for d, w, u in r["schwellen"]]})
    return aus

PFAD = os.path.join(os.path.dirname(__file__), "..", "tests", "vergleichswerte.json")

if __name__ == "__main__":
    with open(PFAD, "w", encoding="utf-8") as f:
        json.dump(bauen(), f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    print("geschrieben:", os.path.normpath(PFAD))
