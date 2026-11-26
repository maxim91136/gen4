"""Gegenprobe der Seite gegen zwei Rechnungen, die nicht von uns sind (REGELN.md Abschnitt 9, Punkt 2).

Fremde Rechnungen:
  PyEphem (https://rhodesmill.org/pyephem/, MIT-Lizenz), rechnet den Sonnenort nach VSOP87.
  Astral  (https://github.com/sffjunkie/astral, Apache 2.0), rechnet nach den Formeln des
          NOAA Solar Calculator.
Beide ohne Lichtbrechung (PyEphem: Luftdruck 0, Astral: with_refraction=False), wie unser Modell.

Geprueft wird je Treffen aus site/rechnung.mjs:
  Hoehe:   Sonnenhoehe der fremden Rechnung an beiden Orten zu unserer Uhrzeit gegen unsere
           gemeinsame Hoehe (der groessere der beiden Abstaende zaehlt).
  Uhrzeit: der Augenblick nahe unserer Uhrzeit, in dem die fremde Rechnung fuer beide Orte dieselbe
           Hoehe gibt, gegen unsere Uhrzeit.

Die beiden Pakete gehoeren nicht zum Repo und nicht zu den Tests. Einmalig:
  python3 -m venv /tmp/gp && /tmp/gp/bin/pip install ephem==4.2.1 astral==3.2
Aufruf (vom Wurzelordner):
  /tmp/gp/bin/python werkzeug/gegenprobe_fremd.py tests/gegenprobe_fremd.json JJJJ-MM-TT
Das Datum ist der Tag der Pruefung und kommt aus `date -u +%F`.
"""
import datetime as dt
import json
import math
import os
import subprocess
import sys

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
HOEHE_GRENZE = 0.5   # Grad, REGELN.md Abschnitt 9 Punkt 2
ZEIT_GRENZE = 180    # Sekunden, ebenda


def unsere(modus=None):
    befehl = ["node", os.path.join(WURZEL, "werkzeug", "gegenprobe_stichproben.mjs")] + ([modus] if modus else [])
    return json.loads(subprocess.run(befehl, capture_output=True, text=True, check=True).stdout)


def hoehe_ephem(ort, t):
    import ephem
    o = ephem.Observer()
    o.lat, o.lon, o.pressure, o.elevation = str(ort[0]), str(ort[1]), 0, 0
    o.date = t.replace(tzinfo=None)
    return math.degrees(ephem.Sun(o).alt)


def hoehe_astral(ort, t):
    from astral import Observer
    from astral.sun import elevation
    return elevation(Observer(ort[0], ort[1], 0), t, with_refraction=False)


def gleichstand(f, a, b, t0, spanne=3600):
    """Sekunden von t0 bis zu dem Augenblick, in dem f fuer a und b dieselbe Hoehe gibt.
    None, wenn die Differenz in +-spanne das Vorzeichen nicht wechselt."""
    d = lambda s: f(a, t0 + dt.timedelta(seconds=s)) - f(b, t0 + dt.timedelta(seconds=s))
    lo, hi = -spanne, spanne
    if d(lo) * d(hi) > 0:
        return None
    for _ in range(30):
        mi = (lo + hi) / 2
        if d(lo) * d(mi) <= 0:
            hi = mi
        else:
            lo = mi
    return (lo + hi) / 2


def pruefe(p, f):
    t = dt.datetime.fromtimestamp(p["ms"] / 1000, dt.timezone.utc)
    ha, hb = f(p["ich_koord"], t), f(p["ort_koord"], t)
    s = gleichstand(f, p["ich_koord"], p["ort_koord"], t)
    return {"hoehe_ich": round(ha, 3), "hoehe_ort": round(hb, 3),
            "hoehe_abstand": round(max(abs(ha - p["hoehe"]), abs(hb - p["hoehe"])), 3),
            "zeit_abstand_s": None if s is None else round(s)}


def quantil(liste, anteil):
    return liste[int(anteil * (len(liste) - 1))]


def main(ziel, stand):
    import ephem, astral
    proben = []
    for p in unsere():
        t = dt.datetime.fromtimestamp(p["ms"] / 1000, dt.timezone.utc)
        proben.append({**p, "hoehe": round(p["hoehe"], 6), "utc": t.strftime("%Y-%m-%d %H:%M:%S"),
                       "pyephem": pruefe(p, hoehe_ephem), "astral": pruefe(p, hoehe_astral)})
    # Breite Zaehlung, nur gegen PyEphem: fuenf Orte gegen alle Tueren, der 15. jedes Monats 2027.
    dh, ds, ohne, lang = [], [], 0, []
    for p in unsere("alle"):
        e = pruefe(p, hoehe_ephem)
        dh.append(e["hoehe_abstand"])
        if e["zeit_abstand_s"] is None:
            ohne += 1
            lang.append(e["hoehe_abstand"])
        else:
            ds.append(abs(e["zeit_abstand_s"]))
            if abs(e["zeit_abstand_s"]) > ZEIT_GRENZE:
                lang.append(e["hoehe_abstand"])
    dh.sort(); ds.sort()
    aus = {
        "stand": stand,
        "fremd": {"pyephem": ephem.__version__, "astral": astral.__version__},
        "grenzen": {"hoehe_grad": HOEHE_GRENZE, "zeit_s": ZEIT_GRENZE},
        "stichproben": proben,
        "zaehlung": {
            "beschreibung": "Berlin, Tromsø, Quito, Auckland, Kapstadt gegen alle Türen aus site/orte.json, 15. jedes Monats 2027, nur PyEphem",
            "treffen": len(dh),
            "hoehe_abstand": {"median": quantil(dh, .5), "p99": quantil(dh, .99), "groesster": dh[-1],
                              "ueber_grenze": sum(x > HOEHE_GRENZE for x in dh)},
            "zeit_abstand_s": {"median": quantil(ds, .5), "p99": quantil(ds, .99), "groesster": ds[-1],
                               "ueber_grenze": sum(x > ZEIT_GRENZE for x in ds), "ohne_gleichstand_in_einer_stunde": ohne},
            "hoehe_abstand_wo_zeit_ueber_grenze": max(lang) if lang else None,
        },
    }
    with open(ziel, "w", encoding="utf-8") as f:
        json.dump(aus, f, ensure_ascii=False, indent=1)
        f.write("\n")
    z = aus["zaehlung"]
    print(len(proben), "Stichproben; groesster Abstand Hoehe",
          max(max(p["pyephem"]["hoehe_abstand"], p["astral"]["hoehe_abstand"]) for p in proben),
          "Grad, Uhrzeit", max(max(abs(p["pyephem"]["zeit_abstand_s"]), abs(p["astral"]["zeit_abstand_s"])) for p in proben), "s")
    print(json.dumps(z, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
