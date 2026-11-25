"""Holt deutsche Ortsnamen von Wikidata (CC0) fuer die Tueren und die Suchliste. A Lauf 12, Auswahl geaendert in Lauf 13.

Der Weg (REGELN.md Abschnitt 5): Wikidata fuehrt zu vielen Orten die GeoNames-Kennung
(Eigenschaft P1566). Gefragt wird der oeffentliche Abfragedienst von Wikidata, in Stapeln von
250 Kennungen, mit zwei Sekunden Pause dazwischen. Das sind etwa 27 Anfragen, einmal, von Hand
ausgeloest. Schlaegt eine Anfrage endgueltig fehl, bricht das Skript ab und es entsteht keine
Datei: lieber keine deutschen Namen als halbe.

Was von dort kommt, ist fremder Text. Er wird geprueft (brauchbar()), bevor er in die Datei geht,
und die Seite setzt ihn nur als Text ein, nie als HTML.

Aufruf: python3 werkzeug/namen_holen.py cities15000.txt namen.json JJJJ-MM-TT
"""
import json, sys, time, unicodedata, urllib.error, urllib.parse, urllib.request
import orte_bauen as ob

DIENST = "https://query.wikidata.org/sparql"
# Wikimedia verlangt eine Kennung mit Kontaktangabe; die Adresse des Repos ist oeffentlich und
# steht auch im Fuss der Seite.
KENNUNG = "gen4-einmaliger-abruf/1.0 (https://github.com/maxim91136/gen4; GitHub Actions)"
STAPEL = 250
PAUSE = 2.0          # Sekunden zwischen zwei Anfragen
VERSUCHE = 4
HOECHSTENS = 60      # Zeichen; laengere Labels sind keine Ortsnamen, die auf die Seite passen

def kennungen(tueren, suchliste):
    """Alle GeoNames-Kennungen, die einen Namen brauchen, aufsteigend und ohne Doppelte."""
    return sorted({o["id"] for o in tueren} | {o["id"] for o in suchliste})

def stapel(liste, groesse=STAPEL):
    return [liste[i:i + groesse] for i in range(0, len(liste), groesse)]

def abfrage(ids):
    """SPARQL fuer einen Stapel. Die Kennungen sind Zahlen aus unserer eigenen Datei.
    Gefragt wird je Eintrag nach der Zahl seiner Seitenlinks (in wie vielen Wikipedien und
    Schwesterprojekten er einen Artikel hat), nach dem deutschen Label und nach dem Label "mul"
    (bei Wikidata der Name fuer alle Sprachen, wenn es keinen eigenen gibt)."""
    werte = " ".join('"%d"' % int(i) for i in ids)
    return ('SELECT ?g ?item ?sl ?de ?mul WHERE { VALUES ?g { %s } ?item wdt:P1566 ?g . '
            '?item wikibase:sitelinks ?sl . '
            'OPTIONAL { ?item rdfs:label ?de . FILTER(LANG(?de) = "de") } '
            'OPTIONAL { ?item rdfs:label ?mul . FILTER(LANG(?mul) = "mul") } }' % werte)

def brauchbar(text):
    """Ein Label, das als Ortsname auf die Seite darf: kurz, eine Zeile, keine Steuerzeichen,
    keine spitzen Klammern, mindestens ein Buchstabe."""
    if not isinstance(text, str):
        return False
    t = text.strip()
    if not t or t != text or len(t) > HOECHSTENS or "<" in t or ">" in t:
        return False
    if any(unicodedata.category(z)[0] == "C" for z in t):
        return False
    return any(z.isalpha() for z in t)

def auswerten(antwort, gefragt, bisher=None):
    """Traegt die Zeilen einer Antwort in `bisher` ein: {Kennung als Text: (Seitenlinks,
    Q-Nummer, Label oder None, "de" | "mul" | None)}.

    Fuehren mehrere Wikidata-Eintraege dieselbe Kennung, gewinnt der mit den meisten Seitenlinks,
    bei Gleichstand der mit der kleinsten Q-Nummer. Erst dann wird nach seinem Namen gefragt:
    das deutsche Label, sonst das Label "mul". Hat der Gewinner keinen brauchbaren Namen, gibt es
    keinen; ein schwaecherer Eintrag springt nicht ein. (Im ersten echten Lauf gewann die kleinste
    Q-Nummer unter den Eintraegen mit deutschem Label, und Bamako hiess "Gebaeude des Ministeriums
    fuer Wirtschaft und Finanzen".) Zeilen zu Kennungen, nach denen nicht gefragt war, zaehlen nicht."""
    bisher = {} if bisher is None else bisher
    erlaubt = {str(int(i)) for i in gefragt}
    for zeile in antwort["results"]["bindings"]:
        try:
            g, item = zeile["g"]["value"], zeile["item"]["value"]
            q = int(item.rsplit("/Q", 1)[1])
            sl = int(zeile["sl"]["value"])
        except (KeyError, IndexError, ValueError, TypeError, AttributeError):
            continue
        if g not in erlaubt or sl < 0:
            continue
        label, art = None, None
        for spalte in ("de", "mul"):
            try:
                text = zeile[spalte]["value"]
            except (KeyError, TypeError):
                continue
            if brauchbar(text):
                label, art = text, spalte
                break
        if g in bisher and bisher[g][1] == q:
            # Derselbe Eintrag in einer zweiten Zeile: nur einen Namen nachtragen, der fehlte.
            if bisher[g][2] is None and label is not None:
                bisher[g] = (sl, q, label, art)
            continue
        if g not in bisher or (-sl, q) < (-bisher[g][0], bisher[g][1]):
            bisher[g] = (sl, q, label, art)
    return bisher

def hole(sparql):
    """Eine Anfrage an den Abfragedienst, mit Geduld bei Ueberlast. Gibt das JSON zurueck."""
    daten = urllib.parse.urlencode({"query": sparql}).encode("utf-8")
    for versuch in range(1, VERSUCHE + 1):
        anfrage = urllib.request.Request(DIENST, data=daten, headers={
            "User-Agent": KENNUNG, "Accept": "application/sparql-results+json",
            "Content-Type": "application/x-www-form-urlencoded"})
        try:
            with urllib.request.urlopen(anfrage, timeout=90) as antwort:
                return json.load(antwort)
        except urllib.error.HTTPError as fehler:
            if fehler.code not in (429, 500, 502, 503, 504) or versuch == VERSUCHE:
                raise
            warten = float(fehler.headers.get("Retry-After") or 0) if (fehler.headers.get("Retry-After") or "").isdigit() else 0
            time.sleep(max(warten, 10 * versuch))
        except (urllib.error.URLError, TimeoutError):
            if versuch == VERSUCHE:
                raise
            time.sleep(10 * versuch)

def ausgabe(gefunden, abgerufen):
    """Was in namen.json steht. `namen` liest orte_bauen.py; `herkunft` (Q-Nummer, Seitenlinks,
    Art des Labels) ist nur zum Nachsehen da und kommt nicht auf die Seite."""
    mit = sorted((g for g in gefunden if gefunden[g][2] is not None), key=int)
    return {"quelle": "Wikidata, CC0, https://www.wikidata.org/", "abgerufen": abgerufen,
            "namen": {g: gefunden[g][2] for g in mit},
            "herkunft": {g: [gefunden[g][1], gefunden[g][0], gefunden[g][3]] for g in sorted(gefunden, key=int)}}

if __name__ == "__main__":
    quelle, ziel, abgerufen = sys.argv[1], sys.argv[2], sys.argv[3]
    with open(quelle, encoding="utf-8") as f:
        tueren, suchliste, _ = ob.auswahl(ob.lesen(f))
    ids = kennungen(tueren, suchliste)
    teile = stapel(ids)
    gefunden = {}
    for nr, teil in enumerate(teile, 1):
        if nr > 1:
            time.sleep(PAUSE)
        auswerten(hole(abfrage(teil)), teil, gefunden)
        print(f"Stapel {nr} von {len(teile)}: {len(gefunden)} Namen bisher", flush=True)
    daten = ausgabe(gefunden, abgerufen)
    mit = len(daten["namen"])
    if mit < len(ids) // 2:
        sys.exit(f"Nur {mit} von {len(ids)} Orten haben einen deutschen Namen. Das ist zu wenig, um ihm zu trauen. Keine Datei geschrieben.")
    with open(ziel, "w", encoding="utf-8") as f:
        json.dump(daten, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    aus_mul = sum(1 for g in daten["namen"] if gefunden[g][3] == "mul")
    print(f"{mit} von {len(ids)} Orten mit Namen bei Wikidata, davon {aus_mul} aus dem Label fuer alle Sprachen (mul). "
          f"{len(gefunden) - mit} Orte haben einen Eintrag ohne brauchbaren Namen, {len(ids) - len(gefunden)} gar keinen Eintrag.")
