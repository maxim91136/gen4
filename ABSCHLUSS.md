# Abschluss

Stand: 2026-11-26 00:40 UTC. A (Lauf 16) und B (Lauf 16) haben in aufeinanderfolgenden Läufen „fertig“ gesagt.

## Was gebaut wurde

**Sonnentür** (`site/`), deutsch und englisch. Du gibst einen Ort an. Die Seite rechnet im Browser, mit welchen von 326 Städten ab 100 000 Einwohnern du heute einen Augenblick teilst, in dem die Sonne für beide gleich hoch und mindestens 5° über dem Horizont steht (Tür offen), und mit welchen nicht (Tür zu). Sie zeigt das nächste Treffen, die Türen mit Spalt und Schließ- oder Öffnungstag, Bündel gleicher Türen und den Fahrplan von heute. Keine Anfrage nach dem Laden, kein Tracking, Ort und Sprache nur im Browser. Was gilt, steht in `REGELN.md`. Die Rechnung zum Nachprüfen liegt in `werkzeug/`, die Orts- und Namensdaten kommen aus GeoNames und Wikidata (Stand auf der Seite).

Tests: 45 in Python (`python -m unittest discover -s tests`), 45 in Node (`node --test tests/*.test.mjs`), alle grün.

## Was geprüft wurde

- Rechnung gegen zwei fremde Rechnungen (PyEphem 4.2.1, Astral 3.2): Höhe überall unter 0,2° Abstand. Uhrzeit meist auf Sekunden, in flachen Fällen aber nur auf Minuten (48 von 16 647 Treffen über drei Minuten daneben, bei 7 kein Gleichstand der fremden Rechnung). Die Seite sagt das.
- Fehlerfälle im Browser (Chrome ohne Fenster): kein JavaScript, kein `localStorage`, Unsinn im Speicher und in den Feldern, kaputte Ortsliste. Tastatur, 390 und 1200 px, Deutsch und Englisch, hell und dunkel.

## Was ungeprüft blieb

- Die ausgelieferte Seite bei Cloudflare (aus der Arbeitsumgebung nicht erreichbar, nur lokaler Server).
- Ein echtes Handy, Safari, Firefox, ein Bildschirmleser.
- Verhalten über Mitternacht und Jahreswechsel, außer in den Tests.
- Der NOAA-Solar-Calculator selbst (Astral rechnet nach seinen Formeln, ist aber nicht er).
- Markenregister für „Sonnentür“ (Abschnitt 1 der `REGELN.md`; SONNENTOR ist eine andere Marke in einem anderen Feld).
- Die Lizenzlage der Datenquellen ist über die Suche geklärt, nicht in den Volltexten gelesen.

## Was Dreier Labs noch tun müsste

1. **Entscheiden, ob Suchmaschinen die Seite finden sollen.** `site/index.html` Zeile 6 hat `<meta name="robots" content="noindex">`, aus dem Platzhalter. Solange es da steht, wird die Seite nicht gefunden. Zum Freigeben die Zeile entfernen.
2. Die Seite auf der Cloudflare-Adresse einmal auf einem Handy öffnen und die Ungeprüft-Liste oben abgleichen.
3. Die Orts- und Namensdaten (`site/orte.json`) wachsen nicht von selbst. Wer sie auffrischen will, startet den Datenlauf (Workflows im Repo).
