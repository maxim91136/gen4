"""Rechnung zu A1 (Lichtpass) mit Schwellen, A Lauf 4.

Frage: Wenn man die Satzform der "Schwellen" (heute zum ersten / letzten Mal,
erst wieder am ...) auf Orte anwendet: Wie viele solche Tage gibt es im Jahr,
und wie verteilen sie sich? Ein Ort gilt an einem Tag als erreichbar, wenn es
einen Augenblick gibt, in dem die Sonne fuer beide gleich hoch und hoeher als
die Mindesthoehe steht.

Modell: Kugel, keine Refraktion, Deklination je Tag fest (Mittag UTC),
Naeherungsformel fuer die Sonne aus dem Astronomical Almanac (geringe
Genauigkeit, etwa 0,01 Grad). Der Sonnenpunkt laeuft in Schritten von
0,25 Grad Laenge (eine Minute) einmal um die Erde.

Die Ortsliste ist KEINE Datenquelle fuer die Seite: Koordinaten aus dem
Gedaechtnis, auf 0,1 Grad gerundet, ungeprueft. Sie dient nur dazu, die
Groessenordnung zu sehen. Daten an den Raendern koennen um Tage falsch sein.

Aufruf: python3 werkzeug/ortsschwellen.py [Breite Laenge [Mindesthoehe]]
"""
import math, sys, datetime

ORTE = [("Reykjavik",64.1,-21.9),("Tromsoe",69.6,19.0),("Moskau",55.8,37.6),("London",51.5,-0.1),
("Lissabon",38.7,-9.1),("Rom",41.9,12.5),("Istanbul",41.0,29.0),("Kairo",30.0,31.2),("Dakar",14.7,-17.4),
("Lagos",6.5,3.4),("Nairobi",-1.3,36.8),("Kinshasa",-4.3,15.3),("Luanda",-8.8,13.2),("Windhuk",-22.6,17.1),
("Kapstadt",-33.9,18.4),("Johannesburg",-26.2,28.0),("Antananarivo",-18.9,47.5),("Dubai",25.2,55.3),
("Teheran",35.7,51.4),("Mumbai",19.1,72.9),("Delhi",28.6,77.2),("Colombo",6.9,79.9),("Kathmandu",27.7,85.3),
("Bangkok",13.8,100.5),("Singapur",1.3,103.8),("Jakarta",-6.2,106.8),("Peking",39.9,116.4),("Tokio",35.7,139.7),
("Manila",14.6,121.0),("Perth",-32.0,115.9),("Sydney",-33.9,151.2),("Auckland",-36.8,174.8),("Honolulu",21.3,-157.9),
("Anchorage",61.2,-149.9),("Vancouver",49.3,-123.1),("Los Angeles",34.1,-118.2),("Mexiko-Stadt",19.4,-99.1),
("New York",40.7,-74.0),("Havanna",23.1,-82.4),("Bogota",4.7,-74.1),("Quito",-0.2,-78.5),("Lima",-12.0,-77.0),
("La Paz",-16.5,-68.1),("Sao Paulo",-23.6,-46.6),("Buenos Aires",-34.6,-58.4),("Santiago",-33.4,-70.7),
("Ushuaia",-54.8,-68.3),("Nuuk",64.2,-51.7),("Longyearbyen",78.2,15.6),("Hobart",-42.9,147.3)]

def deklination(tag):
    """Deklination der Sonne in Grad fuer ein Datum, 12 Uhr UTC."""
    n = (datetime.datetime(tag.year, tag.month, tag.day, 12) - datetime.datetime(2000, 1, 1, 12)).days
    g = math.radians((357.528 + 0.9856003 * n) % 360)
    lam = math.radians((280.460 + 0.9856474 * n) % 360 + 1.915 * math.sin(g) + 0.020 * math.sin(2 * g))
    eps = math.radians(23.439 - 0.0000004 * n)
    return math.degrees(math.asin(math.sin(eps) * math.sin(lam)))

def hoehe(breite, laenge, dek, sonnenlaenge):
    a = math.radians(breite); d = math.radians(dek); h = math.radians(laenge - sonnenlaenge)
    return math.degrees(math.asin(math.sin(a) * math.sin(d) + math.cos(a) * math.cos(d) * math.cos(h)))

def erreichbar(ich, ort, dek, mindest=0.0, schritt=0.25):
    """True, wenn es an dem Tag einen Augenblick gleicher Sonnenhoehe ueber der Mindesthoehe gibt."""
    vorher = None
    for i in range(int(360 / schritt) + 1):
        s = 180 - i * schritt
        a1 = hoehe(ich[0], ich[1], dek, s); a2 = hoehe(ort[0], ort[1], dek, s)
        df = a1 - a2
        if vorher is not None and vorher[0] * df <= 0:
            # Hoehe am Schnittpunkt linear zwischen den beiden Schritten
            t = vorher[0] / (vorher[0] - df) if vorher[0] != df else 0.0
            if vorher[1] + t * (a1 - vorher[1]) > mindest:
                return True
        vorher = (df, a1)
    return False

def schwellen(ich, jahr, mindest=0.0, orte=ORTE):
    """Liste (Datum, Ortsname, 'auf'/'zu'): 'auf' = erster Tag wieder erreichbar, 'zu' = letzter Tag."""
    tage = [datetime.date(jahr, 1, 1) + datetime.timedelta(d) for d in range((datetime.date(jahr + 1, 1, 1) - datetime.date(jahr, 1, 1)).days)]
    dek = [deklination(t) for t in tage]
    aus = []; nie = []; immer = []
    for name, b, l in orte:
        e = [erreichbar(ich, (b, l), d, mindest) for d in dek]
        if all(e): immer.append(name); continue
        if not any(e): nie.append(name); continue
        for i in range(1, len(tage)):
            if e[i] and not e[i - 1]: aus.append((tage[i], name, "auf"))
            if e[i - 1] and not e[i]: aus.append((tage[i - 1], name, "zu"))
    aus.sort()
    return aus, immer, nie

if __name__ == "__main__":
    ich = (float(sys.argv[1]), float(sys.argv[2])) if len(sys.argv) > 2 else (52.5, 13.4)
    mindest = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0
    aus, immer, nie = schwellen(ich, 2027, mindest)
    print("Standort", ich, "Mindesthoehe", mindest, "Jahr 2027,", len(ORTE), "Orte")
    print("ganzjaehrig erreichbar:", len(immer), "| nie:", len(nie), nie)
    print("Schwellentage:", len(aus), "an", len({a[0] for a in aus}), "verschiedenen Tagen")
    for t, n, art in aus:
        print(t.isoformat(), "letzter Tag mit" if art == "zu" else "wieder erreichbar:", n)
