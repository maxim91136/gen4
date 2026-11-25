"""Geschlossene Rechnung der Treffen, A Lauf 6. Vorlage fuer das, was spaeter der Browser rechnet.

Zwei Orte sehen die Sonne gleich hoch, wenn der Sonnenpunkt von beiden gleich weit
entfernt ist, also auf dem Grosskreis liegt, der genau zwischen ihnen verlaeuft (Bs
"Mittelebene", Lauf 4). Mit den Einheitsvektoren p1, p2 der Orte und s der Sonne:

    s . (p1 - p2) = 0

Fuer eine feste Deklination d ist s = (cos d cos L, cos d sin L, sin d), L die Laenge
des Sonnenpunkts. Mit n = p1 - p2, R = hypot(nx, ny), phi = atan2(ny, nx):

    cos(L - phi) = -nz tan(d) / R

Das hat zwei Loesungen, eine (Beruehrung) oder keine. Kein Abtasten, pro Ort und Tag
eine Handvoll Winkelfunktionen.

Modell wie in ortsschwellen.py: Kugel, keine Refraktion, Sonnenmitte, Deklination je
Tag fest (12 Uhr UTC). Die Mindesthoehe steht in REGELN.md.
"""
import math, datetime
from ortsschwellen import deklination

MINDESTHOEHE = 5.0   # Grad, REGELN.md Abschnitt 4
BAND = 0.5           # Grad, Unsicherheit des Modells an der Schwelle, REGELN.md Abschnitt 4

def _vektor(breite, laenge):
    b = math.radians(breite); l = math.radians(laenge)
    return (math.cos(b) * math.cos(l), math.cos(b) * math.sin(l), math.sin(b))

def treffen(ich, ort, dek):
    """Liste (Sonnenlaenge in Grad, gemeinsame Hoehe in Grad), hoechstes Treffen zuerst."""
    p1 = _vektor(*ich); p2 = _vektor(*ort)
    nx, ny, nz = (p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2])
    r = math.hypot(nx, ny); d = math.radians(dek)
    if r < 1e-12:
        return []            # derselbe Ort oder dieselbe Laenge und Breite: kein Treffen im Sinn der Seite
    c = -nz * math.tan(d) / r
    if abs(c) > 1:
        return []            # der Deklinationskreis erreicht die Mittelebene nicht
    phi = math.atan2(ny, nx); w = math.acos(c)
    aus = []
    for L in ({phi + w, phi - w} if w > 1e-12 else {phi}):
        s = (math.cos(d) * math.cos(L), math.cos(d) * math.sin(L), math.sin(d))
        h = math.degrees(math.asin(max(-1.0, min(1.0, s[0] * p1[0] + s[1] * p1[1] + s[2] * p1[2]))))
        aus.append(((math.degrees(L) + 180) % 360 - 180, h))
    aus.sort(key=lambda x: -x[1])
    return aus

def spalt(ich, ort, dek):
    """Hoehe des hoeheren Treffens des Tages oder None, wenn es keines gibt."""
    t = treffen(ich, ort, dek)
    return t[0][1] if t else None

def zeitgleichung_minuten(tag):
    """Wahre minus mittlere Sonnenzeit in Minuten (Naeherung des Astronomical Almanac, etwa eine halbe Minute genau)."""
    n = (datetime.datetime(tag.year, tag.month, tag.day, 12) - datetime.datetime(2000, 1, 1, 12)).days
    g = math.radians((357.528 + 0.9856003 * n) % 360)
    q = (280.460 + 0.9856474 * n) % 360
    lam = math.radians(q + 1.915 * math.sin(g) + 0.020 * math.sin(2 * g))
    eps = math.radians(23.439 - 0.0000004 * n)
    ra = math.degrees(math.atan2(math.cos(eps) * math.sin(lam), math.cos(lam))) % 360
    return ((q - ra + 180) % 360 - 180) * 4

def utc_stunden(sonnenlaenge, tag):
    """Uhrzeit UTC (Stunden), zu der der Sonnenpunkt auf dieser Laenge steht, mit Zeitgleichung."""
    return (12 - sonnenlaenge / 15 - zeitgleichung_minuten(tag) / 60) % 24

def jahr(ich, ort, j):
    """Fuer jeden Tag des Jahres der Spalt (None = kein Treffen)."""
    t0 = datetime.date(j, 1, 1)
    return [(t0 + datetime.timedelta(i), spalt(ich, ort, deklination(t0 + datetime.timedelta(i))))
            for i in range((datetime.date(j + 1, 1, 1) - t0).days)]

def _offen(sp, grenze):
    return sp is not None and sp >= grenze

def tuer(ich, ort, j, mindest=MINDESTHOEHE, band=BAND):
    """Zustand einer Tuer ueber ein Jahr nach REGELN.md Abschnitt 4.

    Rueckgabe: dict mit
      art:       'immer' | 'nie' | 'wechselt'
      streift:   True, wenn die Tuer bei mindest-band und mindest+band nicht dieselbe Art hat
      schwellen: Liste (Datum, 'auf'|'zu', ungefaehr), ungefaehr = True heisst "um den ..."
    """
    reihe = jahr(ich, ort, j)
    def art(grenze):
        e = [_offen(sp, grenze) for _, sp in reihe]
        return "immer" if all(e) else "nie" if not any(e) else "wechselt"
    def wechsel(grenze):
        e = [_offen(sp, grenze) for _, sp in reihe]
        aus = []
        for i in range(1, len(e)):
            if e[i] and not e[i - 1]: aus.append((reihe[i][0], "auf"))
            if e[i - 1] and not e[i]: aus.append((reihe[i - 1][0], "zu"))
        return aus
    a = art(mindest)
    streift = not (art(mindest - band) == a == art(mindest + band))
    schwellen = []
    if a == "wechselt":
        tief = wechsel(mindest - band); hoch = wechsel(mindest + band)
        for tag, was in wechsel(mindest):
            # Derselbe Wechsel bei verschobener Grenze, naechstgelegen. Fehlt er oder liegt er
            # mehr als drei Tage weg, ist das Datum ungefaehr ("um den ...").
            pro = [min([abs((t - tag).days) for t, w in liste if w == was], default=None) for liste in (tief, hoch)]
            ungefaehr = any(p is None or p > 3 for p in pro)
            schwellen.append((tag, was, ungefaehr))
    return {"art": a, "streift": streift, "schwellen": schwellen}
