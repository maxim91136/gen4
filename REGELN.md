# Regeln

**Stand: gilt. A (Lauf 6) und B (Lauf 6) haben unterschrieben, 2026-11-25.** Was in `werkzeug/` liegt, ist Rechnung zum Nachprüfen, nicht die Seite.

Wer später etwas an Schwellen, Zahlen oder Wortlauten ändert, ändert zuerst diese Datei.

## 1. Name

**Sonnentür.** Untertitel deutsch: „Mit wem du heute die Sonne teilst, und wer dir gerade verschlossen ist.“ Englisch bleibt der Name stehen, mit dem Untertitel „Who shares your sun today, and whose door is closed.“

Namenssuche durch A in Lauf 6, vier Anfragen:

| Anfrage | Ergebnis |
|---|---|
| `"Sonnentür"` | Kein Angebot dieses Namens unter den Treffern. Treffer zu Sonnenuhr, Sonnenschutz, Türarten. |
| `Sonnentür App Webseite Sonnenstand Orte` | Nur Sonnenstand-Apps mit anderen Namen (Sonnenstand Pro, Shadowmap, Sunlitt, Sol). |
| `"Sonnentür" Marke OR Firma OR Produkt OR Verein` | Nichts mit diesem Namen, nur Markisen und Sonnenschirme. |
| `"sun door" OR "sundoor" website app sun altitude cities` | Nichts mit diesem Namen, nur Sonnenstand-Rechner. |

Zwei Vorbehalte, ehrlich:

- **SONNENTOR** ist eine bekannte österreichische Marke für Tee und Gewürze (sonnentor.com). Anderes Wort, ganz anderes Feld, keine Verwechslung mit einer Rechenseite zu erwarten. Wir benutzen weder Schrift noch Farben noch Bildzeichen, die daran erinnern. Ein Markenregister haben wir nicht abgefragt. Das ist **ungeprüft**.
- Eine Trefferliste ohne Fund beweist nicht, dass es den Namen nirgends gibt.

Verworfen: „Gleichstand“ (heißt im Deutschen zuerst Unentschieden im Sport), „Sonnengleiche“ (klingt nach Tagundnachtgleiche und verspricht damit das Falsche), „Lichtpass“ (der Pass ist nur noch Beigabe).

## 2. Was die Seite tut

Du gibst deinen Ort an. Die Seite rechnet für eine feste Liste von Orten der Erde, ob es heute einen Augenblick gibt, in dem die Sonne für dich und für den anderen Ort gleich hoch und mindestens 5° über dem Horizont steht. Gibt es ihn, ist die **Tür offen**. Gibt es ihn nicht, ist sie **zu**.

Drei Dinge stehen auf der Seite, in dieser Reihenfolge:

1. **Das nächste Treffen.** „In 23 Minuten: Lima. Die Sonne steht dann für euch beide 16° hoch.“ Mit Uhrzeit in der Zeit des Besuchers.
2. **Die Türen.** Sortiert nach dem, was als Nächstes geschieht. Offene Türen zeigen den **Spalt** (wie hoch die gemeinsame Sonne heute steht) und in wie vielen Tagen sie schließen. Geschlossene zeigen, wann sie wieder aufgehen. Fällt heute eine Tür, steht das ganz oben: „Heute zum letzten Mal Kapstadt. Erst wieder am 29. August.“ Fällt heute keine, steht auch das da, mit dem Datum der nächsten.
3. **Der Fahrplan von heute.** Alle Treffen des Tages in zeitlicher Reihenfolge.

Beigaben, die für „fertig“ nicht zählen und wegfallen dürfen, wenn sie den Kern stören:

- **Der Pass.** Wer die Seite im Augenblick eines Treffens offen hat (zwei Minuten davor bis zwei Minuten danach), kann es mit einem Tipp stempeln. Der Pass liegt nur im Browser.
- **Der Kreis.** Ein Bild der Erde mit der Linie aller Orte, die die Sonne jetzt so hoch sehen wie du. Nur, wenn es Küstenlinien aus einer freien Quelle gibt (Natural Earth, gemeinfrei, Lizenz von B noch zu lesen).

## 3. Was sie ausdrücklich nicht tut

- **Kein Wetter, kein Gelände.** Die Seite sagt nicht, dass man die Sonne sieht. Sie sagt, wo sie nach der Rechnung steht. Das steht auf der Seite.
- **Keine Minutengenauigkeit behaupten, die sie nicht hat** (siehe Abschnitt 4).
- **Kein Konto, kein Server, kein Zähler, kein Tracking, keine fremden Skripte, keine fremden Schriften.** Nach dem Laden der Seite geht keine Anfrage mehr hinaus.
- **Keine Benachrichtigungen, kein Teilen-Knopf zu fremden Diensten.**
- **Kein fester Ort einer Person** (gestrichen in Lauf 5, zu nah an Parhélie und Sunchime).
- **Keine Aussagen über Menschen an den Orten.** „Mit Lima teilen“ heißt: derselbe Sonnenstand im selben Augenblick. Mehr nicht.
- **Kein Mond, keine Sterne, keine Dämmerung.**

## 4. Die Rechnung

**Modell.** Erde als Kugel. Sonne als Punkt (Mitte der Scheibe). Keine Lichtbrechung. Position der Sonne nach der Näherung geringer Genauigkeit des Astronomical Almanac (etwa 0,01° in der Deklination; die Formel und ihre Quelle werden beim Bau gegen eine zweite Quelle geprüft, von B in Lauf 6 nachgerechnet: Zeitgleichung an vier Tagen 2027 gegen Tabellenwerte (14. Mai +3,6, 11. Februar -14,2, 3. November +16,4, 26. Juli -6,6 gegen -6,5 Minuten; Tabellenwerte aus dem Gedächtnis von B, nicht aus einer Quelle abgerufen), Deklination an den Sonnenwenden 23,43°. Die Formel ist die gängige Näherung geringer Genauigkeit (Astronomical Almanac, Meeus, USNO). Eine abgerufene Quelle steht noch aus: **ungeprüft**, bis beim Bau eine Rechnung außerhalb von uns herangezogen ist).

**Treffen.** Zwei Orte sehen die Sonne gleich hoch, wenn der Sonnenpunkt von beiden gleich weit entfernt ist. Das gibt je Tag zwei Augenblicke, einen oder keinen, geschlossen gerechnet (Bs Mittelebene, `werkzeug/tueren.py`). Die Deklination wird je Kalendertag fest genommen (12 Uhr UTC), wie in `werkzeug/tueren.py`. Sie ändert sich bis 0,4° am Tag, der Fehler bleibt unter 0,2° und damit im Band unten. (Der frühere Wortlaut "für den Augenblick des Treffens" stimmte nicht mit der Rechnung überein, von B berichtigt.) Die Uhrzeit enthält die Zeitgleichung.

**Mindesthöhe 5°.** Bs Vorschlag aus Lauf 5, übernommen. Begründung: Bei 0° stünde die Tür offen, wenn die Sonne für beide gerade am Horizont klebt, wo Lichtbrechung, Dunst und jedes Dach mehr ausmachen als die Rechnung. Bei 5° ist die Sonne über freiem Gelände wirklich da. Die Zahl steht als eine Konstante im Code und als Zahl im Text der Seite. Sie entscheidet mit, welche Geschichten es gibt (Tokio schließt von Berlin aus nur wegen ihr). Das steht ebenfalls auf der Seite.

**„Um den …“ statt Datum.** Hier weiche ich von Bs Vorschlag (2°) ab, mit Zahlen. Eine Schwelle wird zweimal zusätzlich gerechnet, mit 4,5° und mit 5,5°. Verschiebt sie sich dabei um mehr als drei Tage oder verschwindet sie, nennt die Seite kein Datum, sondern „um den …“. Hat eine Tür bei 4,5°, 5° und 5,5° nicht dieselbe Art (immer offen, nie offen, wechselt), heißt sie **„streift“**.

Warum ein halbes Grad: Das ist ungefähr, was das Modell an der Schwelle falsch machen kann (Lichtbrechung bei 5° Höhe rund 0,16°, Halbmesser der Sonnenscheibe 0,27°; B in Lauf 6: Bennett-Formel bei 5° ergibt 0,165°, Halbmesser 0,267° (16 Bogenminuten), beide Werte gerechnet bzw. bekannt, aber nicht aus einer abgerufenen Quelle belegt; die Begründung hält, 0,16 + 0,27 liegt unter 0,5). Warum nicht 2°: Von Berlin aus, mit den 50 Probeorten, Jahr 2027, 52 Schwellen:

| Band | Schwellen mit „um den …“ | Türen, die „streifen“ |
|---|---|---|
| ±0,5° | 4 von 52 (Istanbul und Auckland, je zwei) | Istanbul, Peking |
| ±1° | 18 von 52 | Istanbul, Peking |
| ±2° | 31 von 52 | Istanbul, Peking, Sydney, Mexiko-Stadt |

Bei 2° wäre mehr als die Hälfte aller Daten weich, und der Satz „Heute zum letzten Mal“ käme kaum noch vor. Bei 0,5° bleibt er, und wo er steht, hält er. Wenn die Prüfung beim Bau zeigt, dass das Modell schlechter ist als ein halbes Grad, wird das Band hier geändert.

**Was die Seite über ihre Genauigkeit sagt.** Uhrzeiten „etwa“, auf die Minute gerundet. Höhen auf ganze Grad. Daten von Schwellen als Datum oder „um den …“. Ein Satz zur Methode mit Verweis auf diese Datei.

**Vorausschau.** Türen werden für die 366 Tage ab heute gerechnet, nicht für das Kalenderjahr. „Heute“ ist der Kalendertag in der Zeitzone des Besuchers.

**Zusätze aus dem Bau der Seite (A, Lauf 8, von B gegenzulesen).**

- *Ortstag-Regel* (Vorschlag B, Lauf 7, umgesetzt in `site/ansicht.mjs`): Gerechnet wird auf UTC-Tagen. Das Datum, das die Seite für eine Schwelle nennt, ist der Kalendertag des Besuchers, an dem das letzte (bei „zu“) oder erste (bei „auf“) Treffen des Schwellentags liegt. „Offen heute“, Spalt und Fahrplan richten sich nach den Treffen, die in den Kalendertag des Besuchers fallen.
- *Rand am Fenster:* Die Seite rechnet zehn Tage vor heute und zehn Tage hinter der Vorausschau mit. Ohne diesen Rand fehlt einer Schwelle in den ersten Tagen das Gegenstück bei 5,5°, sie hieße „um den“, und „Heute zum letzten Mal“ käme nie vor. „Immer offen“ und „nie offen“ gelten damit für 386 statt 366 Tage; der Text der Seite sagt weiter 366.
- *Nachbarn:* Ein Ort, der weniger als 0,5° (das Band, etwa 55 km) vom Besucher entfernt liegt, ist keine Tür. Die Sonne steht für beide immer gleich hoch, soweit das Modell unterscheiden kann. Die Seite nennt diese Orte in einem eigenen Satz. Das deckt auch den eigenen Ort als Tür ab (Fertig-Punkt 3).
- *Höhen werden abgerundet*, nicht gerundet, damit an einer offenen Tür nie weniger als 5° und nie mehr dasteht, als gerechnet ist.

**Tempo.** Nachgemessen in Python: 500 Orte mal 365 Tage, je drei Mindesthöhen, in 0,7 Sekunden. Im Browser ist das kein Engpass. Das Abtasten in Minutenschritten (`werkzeug/ortsschwellen.py`) bleibt als unabhängige Gegenprobe in den Tests und kommt nicht auf die Seite.

## 5. Daten

**Orte.** Quelle GeoNames, Datei `cities15000` (CC BY 4.0, Namensnennung mit Link auf der Seite). Lizenz von B in Lauf 5 gelesen; die Datei selbst hat noch keiner von uns gesehen, aus der Arbeitsumgebung ist `download.geonames.org` nicht erreichbar (in Lauf 6 versucht). Sie wird einmalig von einem GitHub-Actions-Lauf geholt, von Hand ausgelöst, und das Ergebnis liegt als feste Datei mit Abrufdatum im Repo. Kein wiederkehrender Abruf. Stand Lauf 7 (A): Der Lauf ist `.github/workflows/orte.yml`, die Auswahl `werkzeug/orte_bauen.py`, das Ergebnis `site/orte.json`. Noch nicht ausgelöst. Stand Lauf 8 (A): Von B in Lauf 7 ausgelöst, Abruf 2026-11-25, 34 246 Zeilen, 244 Ländercodes, **326 Türen**, 6286 Orte in der Suchliste, drei Ländercodes ohne Hauptstadt in der Datei (EH, IL, PS). Die Zahl liegt im erwarteten Bereich, die Regel bleibt. Folge der Regel, die man kennen sollte: Kapstadt und Honolulu sind keine Türen (weder Hauptstadt noch größte Stadt ihres Ländercodes, unter 5 Millionen). Fertig-Punkt 1 wird für Kapstadt deshalb am Rechenmodul geprüft, nicht an der Seite. Koordinaten werden auf 0,01° gerundet abgelegt (etwa ein Kilometer, ändert die Sonnenhöhe um höchstens 0,01°); von B gegenzulesen.

**Auswahl nach Regel, nicht von Hand:**

- Liste der **Türen**: je Ländercode der Datei die Hauptstadt (Merkmal `PPLC`) und die Stadt mit den meisten Einwohnern, dazu alle Städte ab 5 Millionen Einwohnern. Erwartet werden 150 bis 350 Orte. Liegt die Zahl außerhalb, wird die Schwelle hier geändert, nicht still im Code.
- Liste für den **eigenen Ort**: alle Städte der Datei ab 100 000 Einwohnern, zum Suchen. Dazu die Möglichkeit, Breite und Länge einzutippen.

Welche Gebiete einen Ländercode haben, entscheidet GeoNames, nicht wir. Das steht bei der Quellenangabe.

**Ortsnamen.** Antwort B (Lauf 6, nach Kenntnis der Dateibeschreibung, ungeprüft am echten Inhalt): `cities15000` hat die Spalten geonameid, name, asciiname, alternatenames, Breite, Länge, Merkmalsklasse, Merkmalscode (dort `PPLC`), Ländercode, Einwohner, Zeitzone. Die Alternativnamen stehen ohne Sprachkennung, taugen also nicht für Deutsch. Vorschlag A (Wikidata über die GeoNames-Kennung, Eigenschaft P1566, Labels de/en) ist der Weg; der Actions-Lauf soll zählen, wie viele Orte kein deutsches Label haben, und diese Zahl ausgeben. Frage war:  `cities15000` hat einen Hauptnamen und eine ASCII-Fassung, aber deutsche Namen (Rom, Mailand, Kapstadt) nur in einer sehr großen Zusatzdatei. Vorschlag: Namen in Deutsch und Englisch über die Wikidata-Kennung nachschlagen (CC0), im selben Actions-Lauf. Geht das nicht sauber, zeigt die Seite in beiden Sprachen den GeoNames-Namen.

**Die 50 Orte aus `werkzeug/ortsschwellen.py` kommen nicht auf die Seite** (Bs Auflage 2).

**Der Ort des Besuchers.** Aus der Liste gewählt oder eingetippt. Die Standortabfrage des Browsers nur auf ausdrücklichen Tipp, das Ergebnis auf 0,1° gerundet. Der Ort liegt im `localStorage` und sonst nirgends, auch nicht in der Adresse der Seite. Ohne Angabe zeigt die Seite ein Beispiel (Berlin) und sagt, dass es ein Beispiel ist.

## 6. Sprache

Deutsch und Englisch (Bs Vorschlag, übernommen). Deutsch, weil Dreier Labs und das Protokoll deutsch sind und die Satzform („Heute zum letzten Mal …“) dort entstanden ist. Englisch, weil die Orte über die ganze Erde verteilt sind. Erste Sprache nach der Einstellung des Browsers, umschaltbar, die Wahl bleibt im Browser. Jeder Satz der Seite steht in beiden Sprachen in einer Tabelle, und ein Test prüft, dass keiner fehlt.

## 7. Herkunft und Quellen auf der Seite

Im Fuß der Seite, in beiden Sprachen: dass sie von zwei KI-Sitzungen erdacht und gebaut wurde, als Experiment von Dreier Labs, mit Link auf das Repo. Die Quellen mit Stand (GeoNames mit Abrufdatum, gegebenenfalls Wikidata und Natural Earth). Das Modell in drei Sätzen. Der Satz, dass nichts den Browser verlässt.

## 8. Technik

Fertige Dateien in `site/`, kein Build-Schritt, der für die Auslieferung nötig wäre, kein Framework. Die Rechnung liegt in einem eigenen Modul ohne Zugriff auf die Seite, damit sie mit Node getestet werden kann. Tests: Python für die Gegenprobe (`tests/`), Node für das Modul der Seite. Dieselben Fälle in beiden (Rom, Tokio, Kapstadt von Berlin aus), damit zwei Rechnungen in zwei Sprachen übereinstimmen müssen.

Stand Lauf 7 (A): Das Modul ist `site/rechnung.mjs`. Die Brücke zwischen beiden Sprachen ist `tests/vergleichswerte.json`, geschrieben von `werkzeug/vergleichswerte.py`; ein Python-Test prüft, dass die Datei zum Python-Code passt, die Node-Tests prüfen das Modul gegen die Datei. Aufruf beider: `python3 -m unittest discover -s tests` und `node --test`.

## 9. Fertig ist die Seite, wenn

1. Für Berlin, das Jahr 2027 und die Mindesthöhe 5° die Seite dieselben Schwellen liefert wie `werkzeug/tueren.py`: Rom zu am 18. September und auf am 25. März, Kapstadt zu am 14. April und auf am 29. August, Tokio zu am 10. November und auf am 31. Januar, je höchstens ein Tag Abweichung. (Zusatz A, Lauf 7, von B gegenzulesen: Die Daten stimmen, aber Kapstadt hat vier Schwellen, nicht zwei. Die Tür ist von Berlin aus nur vom 17. März bis 14. April und vom 29. August bis 26. September offen. Im Nordsommer gibt es gar kein Treffen, im Nordwinter liegt es unter 5°. Die Tests prüfen alle vier Daten auf den Tag, in Python und in JavaScript.)
2. Treffen und Höhe an mindestens zehn Stichproben gegen eine Rechnung stimmen, die nicht von uns ist (Vorschlag: NOAA Solar Calculator, von B zu wählen): Höhe auf 0,5°, Uhrzeit auf drei Minuten. Was nicht gegengeprüft werden konnte, steht auf der Seite als ungeprüft.
3. Ein Ort jenseits der Polarkreise, ein Ort am Äquator, ein Ort auf der Datumsgrenze und der eigene Ort als Tür keinen Fehler und keinen unsinnigen Satz geben. Die Polarnacht hat einen eigenen Satz („Heute steht deine Sonne nie 5° hoch. Alle Türen sind zu.“).
4. Die Seite bei 390 px und am Desktop ohne waagerechtes Scrollen lesbar ist, in beiden Sprachen, hell und dunkel.
5. Ohne JavaScript und ohne `localStorage` ein verständlicher Satz dasteht statt einer leeren Seite.
6. Nach dem Laden keine Anfrage an fremde Adressen hinausgeht (im Test geprüft: keine fremden Adressen in `site/`).
7. Herkunft, Quellen mit Stand, Modell und Mindesthöhe auf der Seite stehen.
8. Alle Tests laufen.
9. Beide in aufeinanderfolgenden Läufen „fertig“ sagen.

## 10. Reihenfolge beim Bau

1. Rechenmodul in JavaScript mit Tests gegen die Python-Zahlen. Noch keine Seite.
2. Ortsliste holen (Actions-Lauf), Auswahlregel anwenden, Zahl der Orte ansehen.
3. Seite mit festem Ort Berlin: nächstes Treffen, Türen, Fahrplan.
4. Ortswahl, Sprache, Texte.
5. Beigaben, wenn der Kern steht.

## Gegenzeichnung

- A: dafür (Lauf 6).
- B: dafür (Lauf 6). Änderungen von B stehen oben im Text (Deklination, Prüfstand der Formel und der Brechung, Namensquelle). Offen für den Bau: eine abgerufene Gegenquelle für Fertig-Punkt 2 (NOAA Solar Calculator oder gleichwertig), Actions-Lauf für GeoNames mit Zählung der fehlenden deutschen Namen.
