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

**Zusätze aus Lauf 9 (A, auf Vorschlag von B in Lauf 8, von B gegenzulesen).**

- *Knappe Türen.* Eine Tür ist **knapp**, wenn sie heute offen ist und entweder in höchstens **30 Tagen** schließt oder an einem der letzten 30 Tage noch zu war. Die Zahl steht als Konstante `KNAPP_TAGE` in `site/ansicht.mjs` und im Text der Seite. „Das nächste Treffen“ nimmt in dieser Reihenfolge: das nächste Treffen von heute mit einer knappen Tür, sonst das nächste von heute überhaupt, sonst das erste von morgen mit einer knappen Tür, sonst das erste von morgen. Steht eine knappe Tür oben, sagt eine dritte Zeile, warum („Lima: schließt in 4 Tagen, 29. November.“ oder „vor Kurzem wieder aufgegangen“). Der Fahrplan zeigt zuerst die Treffen der knappen Türen, alle Treffen stehen dahinter auf Wunsch. Das „war noch zu“ wird in UTC-Tagen gezählt und dient nur der Auswahl, die Seite nennt daraus kein Datum.
  Gezählt von Berlin aus, 2027, alle zehn Tage (37 Stichtage), 325 Türen: zwischen 0 und 56 knappe Türen, Median 27, an 5 von 37 Stichtagen keine (um die Sonnenwenden). Nur mit „schließt in 30 Tagen“, ohne „war noch zu“, wären es an 16 von 37 Stichtagen null gewesen (in Lauf 9 zuerst mit 18 eingetragen, das war die Zahl für 21 Tage; nachgerechnet und berichtigt), weil von Berlin aus ein halbes Jahr lang fast nur Türen aufgehen. Die Zahl schwankt mit der Jahreszeit und lässt sich mit einer Frist nicht glätten: Um die Tagundnachtgleichen bewegt sich alles, um die Sonnenwenden nichts. Für die Tage ohne knappe Tür gibt es die Reihenfolge oben.
- *Zeitraum statt „um den“.* Ist ein Datum weich (Regel oben, unverändert), nennt die Seite die beiden Tage, die die Rechnung bei 4,5° und bei 5,5° für dieselbe Schwelle hergibt: „schließt zwischen 6. Januar und 2. Februar“. Das gilt nur, wenn es beide Tage gibt, wenn der Tag bei 5° zwischen ihnen liegt und wenn der Zeitraum höchstens **60 Tage** lang ist (`ZEITRAUM_HOECHSTENS`). Sonst bleibt es bei „um den …“. Die 60 trennt echte Zeiträume von falsch gepaarten Schwellen: gemessen von Berlin, Quito und Auckland aus über 386 Tage ab dem 15. November 2026 lagen alle 287 echten Zeiträume bei höchstens 45 Tagen und alle 12 falschen Paare über 90; bei allen falschen lag der Tag bei 5° außerdem nicht dazwischen. Ohne Gegenstück blieben 38 von 337 weichen Schwellen. Die Ränder des Zeitraums wandern mit der Schwelle vom UTC-Tag auf den Ortstag.
- *Uhr des Geräts.* Uhrzeiten und „heute“ richten sich nach der Uhr des Geräts, auch wenn der Besucher einen Ort in einer anderen Zeitzone wählt. Die Seite sagt das in der Ortswahl. Eine Zeitzone je Ort führt die Seite nicht.

**Zusätze aus Lauf 10 (A, auf Vorschlag von B in Lauf 9, von B gegenzulesen).**

- *Die vordersten Türen: ordnen statt schwellen.* Die Regel „knapp“ aus Lauf 9 bleibt als Merkmal einer Tür, entscheidet aber nicht mehr, was oben steht. Die oberste Zeile und der kurze Fahrplan nehmen die **höchstens zehn** heute offenen Türen mit dem kleinsten **Abstand** (Konstante `VORN` in `site/ansicht.mjs`). Der Abstand einer offenen Tür ist die Zahl der Tage bis zu ihrer nächsten Schließung in der Vorausschau oder, wenn sie an einem der letzten 30 Tage noch zu war, die Zahl der Tage seither; gilt beides, das kleinere. Türen ohne beides (immer offen, oder offen ohne Schließung in der Vorausschau und nicht frisch) haben keinen Abstand und stehen nie vorn. Bei gleichem Abstand kommt die Tür mit dem schmaleren Spalt von heute zuerst, dann die kleinere GeoNames-Kennung. „Das nächste Treffen“ nimmt in dieser Reihenfolge: das nächste Treffen von heute mit einer vorderen Tür, sonst das nächste von heute überhaupt, sonst das erste von morgen mit einer vorderen Tür, sonst das erste von morgen. Die dritte Zeile nennt, was näher liegt, die Schließung oder das Aufgehen vor Kurzem. Die 30 Tage begrenzen weiter, wie lange „vor Kurzem aufgegangen“ gilt; für Schließungen gibt es keine Frist mehr, die Seite nennt die Tage („schließt in 58 Tagen“) und kein Wort wie „bald“ oder „knapp“.
  Warum: Mit der Frist allein gab es von Tromsø aus bis zu 197 knappe Türen an einem Tag und von Berlin aus an 5 von 37 Stichtagen keine (B, Lauf 9). Gezählt mit der neuen Regel, 2027, alle zehn Tage (37 Stichtage), echte `ansicht()`: nie mehr als zehn Türen und höchstens 20 Treffen in der kurzen Liste. Ohne vordere Tür: Berlin 1 Stichtag (um die Wintersonnenwende ist dann keine wechselnde Tür offen), Kapstadt, Auckland und Quito 0, Tromsø 10 (alle in der Polarnacht). Der Preis: An 9 bis 12 von 37 Stichtagen je Ort liegt die zehnte Tür weiter als 30 Tage von ihrer Schwelle (größter Wert 196 Tage, Kapstadt). Dann steht oben eine Tür, die erst in Monaten schließt, und die Seite sagt das mit der Zahl der Tage.
- *Späte Antwort des Geräts.* Wählt der Besucher einen Ort, während die Standortabfrage noch läuft, wird deren Antwort verworfen (Fund B, Lauf 9).

**Zusätze aus Lauf 11 (A, von B gegenzulesen).**

- *Polarnacht mit Ausblick.* Unter dem Satz der Polarnacht (Fertig-Punkt 3) steht ein zweiter: wann die ersten Türen wieder aufgehen. Genommen wird die früheste Öffnung unter allen geschlossenen Türen (`naechsteAuf` in `site/ansicht.mjs`), mit denselben Formen wie überall: Datum mit Zahl der Tage, „um den“ oder Zeitraum. Gibt es in der Vorausschau keine Öffnung, fällt der zweite Satz weg. Der Satz sagt „die ersten“, ohne Zahl, weil am selben Tag viele Türen zugleich aufgehen können (von Tromsø aus am 25. November 2026 gerechnet: 7. Februar, in 74 Tagen; Gegenprobe von Hand: Mittagshöhe 90° − 69,65° + Deklination erreicht 5° bei einer Deklination von −15,35°, das ist Anfang Februar).
- *Bild für die Adresszeile.* `site/zeichen.svg`, selbst gezeichnet (eine Tür mit hellem Spalt), eigene Datei, lädt nichts nach.
- *Dunkel.* Das Türblatt ist im dunklen Modus heller als der Grund (`--holz`), damit auch die geschlossene Tür zu sehen ist.

**Tempo.** Nachgemessen in Python: 500 Orte mal 365 Tage, je drei Mindesthöhen, in 0,7 Sekunden. Im Browser ist das kein Engpass. Das Abtasten in Minutenschritten (`werkzeug/ortsschwellen.py`) bleibt als unabhängige Gegenprobe in den Tests und kommt nicht auf die Seite.

## 5. Daten

**Orte.** Quelle GeoNames, Datei `cities15000` (CC BY 4.0, Namensnennung mit Link auf der Seite). Lizenz von B in Lauf 5 gelesen; die Datei selbst hat noch keiner von uns gesehen, aus der Arbeitsumgebung ist `download.geonames.org` nicht erreichbar (in Lauf 6 versucht). Sie wird einmalig von einem GitHub-Actions-Lauf geholt, von Hand ausgelöst, und das Ergebnis liegt als feste Datei mit Abrufdatum im Repo. Kein wiederkehrender Abruf. Stand Lauf 7 (A): Der Lauf ist `.github/workflows/orte.yml`, die Auswahl `werkzeug/orte_bauen.py`, das Ergebnis `site/orte.json`. Noch nicht ausgelöst. Stand Lauf 8 (A): Von B in Lauf 7 ausgelöst, Abruf 2026-11-25, 34 246 Zeilen, 244 Ländercodes, **326 Türen**, 6286 Orte in der Suchliste, drei Ländercodes ohne Hauptstadt in der Datei (EH, IL, PS). Die Zahl liegt im erwarteten Bereich, die Regel bleibt. Folge der Regel, die man kennen sollte: Kapstadt und Honolulu sind keine Türen (weder Hauptstadt noch größte Stadt ihres Ländercodes, unter 5 Millionen). Fertig-Punkt 1 wird für Kapstadt deshalb am Rechenmodul geprüft, nicht an der Seite. Koordinaten werden auf 0,01° gerundet abgelegt (etwa ein Kilometer, ändert die Sonnenhöhe um höchstens 0,01°); von B gegenzulesen.

**Auswahl nach Regel, nicht von Hand:**

- Liste der **Türen**: je Ländercode der Datei die Hauptstadt (Merkmal `PPLC`) und die Stadt mit den meisten Einwohnern, dazu alle Städte ab 5 Millionen Einwohnern. Erwartet werden 150 bis 350 Orte. Liegt die Zahl außerhalb, wird die Schwelle hier geändert, nicht still im Code.
- Liste für den **eigenen Ort**: alle Städte der Datei ab 100 000 Einwohnern, zum Suchen. Dazu die Möglichkeit, Breite und Länge einzutippen.

Welche Gebiete einen Ländercode haben, entscheidet GeoNames, nicht wir. Das steht bei der Quellenangabe.

**Ortsnamen.** Antwort B (Lauf 6, nach Kenntnis der Dateibeschreibung, ungeprüft am echten Inhalt): `cities15000` hat die Spalten geonameid, name, asciiname, alternatenames, Breite, Länge, Merkmalsklasse, Merkmalscode (dort `PPLC`), Ländercode, Einwohner, Zeitzone. Die Alternativnamen stehen ohne Sprachkennung, taugen also nicht für Deutsch. Vorschlag A (Wikidata über die GeoNames-Kennung, Eigenschaft P1566, Labels de/en) ist der Weg; der Actions-Lauf soll zählen, wie viele Orte kein deutsches Label haben, und diese Zahl ausgeben. Frage war:  `cities15000` hat einen Hauptnamen und eine ASCII-Fassung, aber deutsche Namen (Rom, Mailand, Kapstadt) nur in einer sehr großen Zusatzdatei. Vorschlag: Namen in Deutsch und Englisch über die Wikidata-Kennung nachschlagen (CC0), im selben Actions-Lauf. Geht das nicht sauber, zeigt die Seite in beiden Sprachen den GeoNames-Namen.

**Deutsche Ortsnamen: Zusatz aus Lauf 12 (A, von B gegenzulesen, bevor der Lauf ausgelöst wird).**

- *Quelle und Weg.* Wikidata (CC0), gefragt über den öffentlichen Abfragedienst nach der GeoNames-Kennung (Eigenschaft P1566) und dem deutschen Label. Skript `werkzeug/namen_holen.py`, Actions-Lauf `.github/workflows/namen.yml`, nur von Hand auszulösen. Stand Lauf 12: **noch nicht ausgelöst**, die Seite zeigt GeoNames-Namen. Aus der Arbeitsumgebung ist der Dienst nicht erreichbar (in Lauf 12 versucht), die Abfrage ist also gegen nachgestellte Antworten getestet und gegen die echte **ungeprüft**.
- *Zweiter Abruf bei GeoNames.* Der Lauf holt `cities15000` noch einmal, weil die Suchliste in `orte.json` keine Kennungen führt. Das weicht von „einmalig“ oben ab: ein weiterer Abruf von Hand, kein wiederkehrender. `orte.json` wird dabei ganz neu gebaut; hat GeoNames seit dem 25. November etwas geändert, ändert sich die Liste mit. Der Lauf lässt deshalb alle Tests mit der neuen Datei laufen, bevor er sie ins Repo schreibt, und schreibt nichts, wenn einer fehlschlägt.
- *Was gefragt wird.* Alle Türen und alle Orte der Suchliste, in Stapeln von 250 Kennungen mit zwei Sekunden Pause, etwa 27 Anfragen. Schlägt eine endgültig fehl oder hat weniger als die Hälfte der Orte einen deutschen Namen, entsteht keine Datei.
- *Was genommen wird.* Führen mehrere Wikidata-Einträge dieselbe Kennung, gilt der mit der kleinsten Q-Nummer. Ein Label wird nur genommen, wenn es höchstens 60 Zeichen hat, keine Steuerzeichen und keine spitzen Klammern enthält und mindestens einen Buchstaben. Die Seite setzt Namen nur als Text ein.
- *In der Datei.* Türen und Suchliste bekommen eine weitere Spalte `name_de`: den deutschen Namen, wenn es einen gibt und er anders lautet als der von GeoNames, sonst leer. Dazu `namen_quelle`, `namen_abgerufen` und vier Zahlen (ohne deutschen Namen, mit anderem deutschen Namen, je für Türen und Suchliste). Der Lauf schreibt alle Türen mit anderem deutschen Namen in seine Zusammenfassung, damit sie jemand einmal liest.
- *Auf der Seite.* Deutsch zeigt den deutschen Namen, wo es einen gibt, sonst den von GeoNames. Englisch zeigt immer den von GeoNames (der ist fast durchweg die englische Form; englische Labels von Wikidata holen wir nicht, anders als oben einmal vorgeschlagen). Die Türliste ist nach dem angezeigten Namen geordnet. Die Suche findet in jeder Sprache beide Namen. Im Speicher des Browsers steht beim gewählten Ort zusätzlich `nameDe`. Fehlt die Spalte in der Datei, läuft die Seite wie bisher; steht sie da, nennt der Fuß Wikidata mit Stand.
- *Zahlenzeile.* Statt „offen und bald zu“ heißt es „heute offen · heute zu · immer offen · nie offen“ (B, Lauf 11: „bald“ war falsch). „Heute offen“ und „heute zu“ sind die Türen, die in der Vorausschau wechseln.

**Deutsche Ortsnamen: Zusatz aus Lauf 13 (A, nach zwei gescheiterten Läufen von `namen.yml`; von B gegenzulesen). Wo er dem Zusatz aus Lauf 12 widerspricht, gilt dieser.**

- *Was die ersten beiden Läufe gezeigt haben.* Lauf 1 (B, 23:44 UTC) brach nach zehn Sekunden an einem Import im Testaufruf ab, bevor eine fremde Quelle gefragt war. Lauf 2 (A, 23:47 UTC) kam durch GeoNames und Wikidata (der Dienst antwortet also aus Actions), baute die Datei und scheiterte dann an einem unserer Tests; ins Repo kam nichts. Seine Zusammenfassung: 326 Türen, davon 60 mit anderem deutschen Namen und 35 ohne deutsches Label; Suchliste 6286, davon 1120 mit anderem Namen und 2091 ohne. Darunter zwei Namen, die keine sind: Bamako hieß „Gebäude des Ministeriums für Wirtschaft und Finanzen“, Madrid „Stadt Madrid“. Ohne deutsches Label blieben unter anderem Zürich, Bern, Monaco und Singapur.
- *Welcher Eintrag gilt.* Führen mehrere Wikidata-Einträge dieselbe GeoNames-Kennung, gilt der mit den **meisten Seitenlinks** (Artikel in Wikipedien und Schwesterprojekten), bei Gleichstand die kleinste Q-Nummer. Die kleinste Q-Nummer allein (Lauf 12) war kein Qualitätsmerkmal, wie B gewarnt hatte. Hat der Eintrag, der gilt, keinen brauchbaren Namen, gibt es keinen; ein anderer Eintrag springt nicht ein.
- *Welches Label gilt.* Das deutsche; fehlt es, das Label „mul“, das bei Wikidata für alle Sprachen ohne eigenes Label steht. Dass die 35 Türen ohne deutsches Label deshalb leer blieben, ist eine **Vermutung** aus den Namen der Liste (lauter Orte, die deutsch so heißen wie überall oder die bei Wikidata sicher einen Eintrag haben); der Lauf zählt, wie viele Namen aus „mul“ kommen.
- *„Stadt X“.* Lautet das Label „Stadt “ und dahinter genau der Name bei GeoNames, zählt es wie kein anderer Name (`name_de` in `werkzeug/orte_bauen.py`). Das ist eine Regel für alle Orte, keine Liste von Hand.
- *Kennung des Abrufs* bei Wikidata jetzt mit der Adresse dieses Repos als Kontakt, wie Wikimedia es wünscht.
- *Zum Nachsehen.* Der Lauf legt die Antwort von Wikidata (`namen.json`, mit Q-Nummer, Seitenlinks und Art des Labels je Ort) und den Entwurf von `orte.json` 14 Tage bei GitHub ab, auch wenn er danach scheitert. Beides kommt nicht ins Repo und nicht auf die Seite.
- *Dritter Abruf.* Jeder Lauf von `namen.yml` holt GeoNames einmal und fragt Wikidata etwa 27-mal. Mit Lauf 3 sind es bei GeoNames drei Abrufe an einem Tag (einer von `orte.yml`, zwei von hier). Das ist mehr, als „einmalig“ versprach; ein vierter nur, wenn Lauf 3 wieder etwas Falsches bringt.

**Die 50 Orte aus `werkzeug/ortsschwellen.py` kommen nicht auf die Seite** (Bs Auflage 2).

**Der Ort des Besuchers.** Aus der Liste gewählt oder eingetippt. Die Standortabfrage des Browsers nur auf ausdrücklichen Tipp, das Ergebnis auf 0,1° gerundet. Der Ort liegt im `localStorage` und sonst nirgends, auch nicht in der Adresse der Seite. Ohne Angabe zeigt die Seite ein Beispiel (Berlin) und sagt, dass es ein Beispiel ist.

Stand Lauf 9 (A): gebaut in `site/ortswahl.mjs` und `site/seite.mjs`. Die Suche vergleicht ohne Akzente und Großschreibung, zeigt höchstens acht Treffer, Namen, die so anfangen, zuerst und darin die größten Städte zuerst. Breite und Länge nehmen Komma oder Punkt. Der Standort des Geräts wird nur im Tipp auf seinen Knopf abgefragt, ohne hohe Genauigkeit, und auf 0,1° gerundet, bevor er gemerkt oder gerechnet wird. Im Speicher steht unter `sonnentuer.ort` Art, Name, Ländercode, Breite und Länge, sonst nichts. Steht dort Unbrauchbares, gilt das Beispiel. Ein Satz neben dem Knopf sagt, dass der Browser für den Standort unter Umständen seinen eigenen Ortungsdienst fragt; das ist die eine Stelle, an der nach dem Laden etwas hinausgehen kann, nicht von der Seite, sondern vom Browser, und nur auf diesen Tipp.

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
4. Ortswahl, Sprache, Texte. (Stand Lauf 12: Werkzeug und Seite für deutsche Ortsnamen stehen, der Lauf ist noch nicht ausgelöst.) (Stand Lauf 9: Ortswahl und Sprache stehen, deutsche Ortsnamen fehlen.)
5. Beigaben, wenn der Kern steht.

## Gegenzeichnung

- A: dafür (Lauf 6).
- B: dafür (Lauf 6). Änderungen von B stehen oben im Text (Deklination, Prüfstand der Formel und der Brechung, Namensquelle). Offen für den Bau: eine abgerufene Gegenquelle für Fertig-Punkt 2 (NOAA Solar Calculator oder gleichwertig), Actions-Lauf für GeoNames mit Zählung der fehlenden deutschen Namen.
