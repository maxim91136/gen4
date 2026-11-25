"""Baut site/orte.json aus der GeoNames-Datei cities15000.txt. A Lauf 7.

Auswahl nach REGELN.md Abschnitt 5, nicht von Hand:
  Tueren: je Laendercode jede Hauptstadt (Merkmalscode PPLC) und die Stadt mit den meisten
          Einwohnern, dazu alle Staedte ab 5 Millionen Einwohnern.
  Orte:   alle Staedte ab 100 000 Einwohnern (Suchliste fuer den eigenen Ort).

Die Datei hat laut GeoNames-Beschreibung 19 Spalten, durch Tabulator getrennt. Keiner von uns
hat sie bisher gesehen (download.geonames.org ist aus der Arbeitsumgebung nicht erreichbar).
Darum bricht das Skript ab, sobald eine Zeile nicht passt, statt zu raten.

Aufruf: python3 werkzeug/orte_bauen.py cities15000.txt site/orte.json JJJJ-MM-TT [namen.json]

Mit namen.json (geschrieben von werkzeug/namen_holen.py, Quelle Wikidata, CC0) bekommt jede
Zeile eine weitere Spalte name_de: den deutschen Namen, wenn es einen gibt und er anders lautet
als der Name von GeoNames, sonst eine leere Zeichenkette. A Lauf 12, REGELN.md Abschnitt 5.
"""
import json, sys

SPALTEN = 19
ID, NAME, BREITE, LAENGE, KLASSE, CODE, LAND, EINWOHNER = 0, 1, 4, 5, 6, 7, 8, 14
AB_TUER = 5_000_000
AB_ORT = 100_000
STELLEN = 2            # Nachkommastellen der Koordinaten, 0,01 Grad sind etwa ein Kilometer
ERWARTET = (150, 350)  # Zahl der Tueren, REGELN.md Abschnitt 5

def lesen(zeilen):
    orte = []
    for nr, zeile in enumerate(zeilen, 1):
        zeile = zeile.rstrip("\n").rstrip("\r")
        if not zeile:
            continue
        f = zeile.split("\t")
        if len(f) != SPALTEN:
            raise ValueError(f"Zeile {nr}: {len(f)} Spalten statt {SPALTEN}. Die Datei sieht anders aus als angenommen.")
        b, l = float(f[BREITE]), float(f[LAENGE])
        if not (-90 <= b <= 90 and -180 <= l <= 180):
            raise ValueError(f"Zeile {nr}: Koordinaten ausserhalb der Erde ({b}, {l}).")
        orte.append({"id": int(f[ID]), "name": f[NAME], "b": round(b, STELLEN), "l": round(l, STELLEN),
                     "code": f[CODE], "land": f[LAND], "ew": int(f[EINWOHNER] or 0)})
    return orte

def auswahl(orte):
    """Gibt (tueren, suchliste, zahlen) zurueck."""
    gewaehlt = {}
    laender = {}
    for o in orte:
        if o["land"]:
            laender.setdefault(o["land"], []).append(o)
    ohne_hauptstadt = []
    for land, liste in sorted(laender.items()):
        haupt = [o for o in liste if o["code"] == "PPLC"]
        if not haupt:
            ohne_hauptstadt.append(land)
        for o in haupt:
            gewaehlt[o["id"]] = o
        groesste = min(liste, key=lambda o: (-o["ew"], o["id"]))
        gewaehlt[groesste["id"]] = groesste
    for o in orte:
        if o["ew"] >= AB_TUER:
            gewaehlt[o["id"]] = o
    tueren = sorted(gewaehlt.values(), key=lambda o: (o["land"], -o["ew"], o["id"]))
    suchliste = sorted((o for o in orte if o["ew"] >= AB_ORT), key=lambda o: (-o["ew"], o["id"]))
    zahlen = {"zeilen": len(orte), "laendercodes": len(laender), "ohne_laendercode": sum(1 for o in orte if not o["land"]),
              "laender_ohne_hauptstadt_in_der_datei": ohne_hauptstadt, "tueren": len(tueren), "suchliste": len(suchliste),
              "tueren_im_erwarteten_bereich": ERWARTET[0] <= len(tueren) <= ERWARTET[1]}
    return tueren, suchliste, zahlen

def name_de(o, namen):
    """Der deutsche Name, wenn er sich vom Namen bei GeoNames unterscheidet, sonst ''.
    Ein Label der Form "Stadt X", wo X der Name bei GeoNames ist, bezeichnet die Verwaltung und
    nicht den Ort (im ersten echten Lauf: "Stadt Madrid"); es zaehlt wie kein anderer Name."""
    n = namen.get(str(o["id"]), "")
    return n if n and n != o["name"] and n != "Stadt " + o["name"] else ""

def ausgabe(tueren, suchliste, zahlen, abgerufen, namen=None):
    if namen is not None:
        n = namen["namen"]
        zahlen = dict(zahlen,
                      tueren_ohne_deutschen_namen=sum(1 for o in tueren if str(o["id"]) not in n),
                      tueren_mit_anderem_deutschen_namen=sum(1 for o in tueren if name_de(o, n)),
                      suchliste_ohne_deutschen_namen=sum(1 for o in suchliste if str(o["id"]) not in n),
                      suchliste_mit_anderem_deutschen_namen=sum(1 for o in suchliste if name_de(o, n)))
        return {
            "quelle": "GeoNames, cities15000, CC BY 4.0, https://www.geonames.org/",
            "abgerufen": abgerufen,
            "namen_quelle": namen["quelle"],
            "namen_abgerufen": namen["abgerufen"],
            "regel": "REGELN.md Abschnitt 5",
            "zahlen": zahlen,
            "tueren_spalten": ["geonameid", "name", "land", "breite", "laenge", "einwohner", "name_de"],
            "tueren": [[o["id"], o["name"], o["land"], o["b"], o["l"], o["ew"], name_de(o, n)] for o in tueren],
            "orte_spalten": ["name", "land", "breite", "laenge", "name_de"],
            "orte": [[o["name"], o["land"], o["b"], o["l"], name_de(o, n)] for o in suchliste],
        }
    return {
        "quelle": "GeoNames, cities15000, CC BY 4.0, https://www.geonames.org/",
        "abgerufen": abgerufen,
        "regel": "REGELN.md Abschnitt 5",
        "zahlen": zahlen,
        "tueren_spalten": ["geonameid", "name", "land", "breite", "laenge", "einwohner"],
        "tueren": [[o["id"], o["name"], o["land"], o["b"], o["l"], o["ew"]] for o in tueren],
        "orte_spalten": ["name", "land", "breite", "laenge"],
        "orte": [[o["name"], o["land"], o["b"], o["l"]] for o in suchliste],
    }

if __name__ == "__main__":
    quelle, ziel, abgerufen = sys.argv[1], sys.argv[2], sys.argv[3]
    with open(quelle, encoding="utf-8") as f:
        orte = lesen(f)
    tueren, suchliste, zahlen = auswahl(orte)
    namen = None
    if len(sys.argv) > 4:
        with open(sys.argv[4], encoding="utf-8") as f:
            namen = json.load(f)
    daten = ausgabe(tueren, suchliste, zahlen, abgerufen, namen)
    zahlen = daten["zahlen"]
    with open(ziel, "w", encoding="utf-8") as f:
        json.dump(daten, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    print(json.dumps(zahlen, ensure_ascii=False, indent=1))
    if not zahlen["tueren_im_erwarteten_bereich"]:
        print(f"ACHTUNG: {zahlen['tueren']} Tueren, erwartet {ERWARTET[0]} bis {ERWARTET[1]}. Schwelle in REGELN.md aendern, nicht still im Code.")
    if namen is not None:
        # Damit der Pruefer die Namen einmal lesen kann, bevor er ihnen traut: alle Tueren, deren
        # deutscher Name anders lautet, und alle Tueren ohne deutschen Namen.
        n = namen["namen"]
        print("\nTueren mit anderem deutschen Namen:")
        print(", ".join(f"{o['name']} -> {name_de(o, n)}" for o in tueren if name_de(o, n)))
        print("\nTueren ohne deutschen Namen bei Wikidata:")
        print(", ".join(o["name"] for o in tueren if str(o["id"]) not in n) or "keine")
