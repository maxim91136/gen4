// Sonnentür: die Rechnung. Reines Modul, kennt weder Seite noch Browser, damit Node es testen kann.
//
// Gleiche Rechnung wie werkzeug/tueren.py (Python), Zeile für Zeile übertragen. Die Tests in
// tests/rechnung.test.mjs vergleichen beide über tests/vergleichswerte.json.
//
// Modell (REGELN.md Abschnitt 4): Erde als Kugel, Sonne als Punkt, keine Lichtbrechung,
// Deklination und Zeitgleichung je Kalendertag fest (12 Uhr UTC), Näherung geringer
// Genauigkeit des Astronomical Almanac.
//
// Ein Tag ist hier eine ganze Zahl: Tage seit dem 1. Januar 2000 (UTC). Ein Ort ist [Breite, Länge] in Grad.

export const MINDESTHOEHE = 5.0; // Grad, REGELN.md Abschnitt 4
export const BAND = 0.5;         // Grad, Unsicherheit des Modells an der Schwelle, REGELN.md Abschnitt 4
export const VORAUSSCHAU = 366;  // Tage, REGELN.md Abschnitt 4

const RAD = Math.PI / 180;
const TAG_MS = 86400000;
const EPOCHE = 10957; // Tage vom 1.1.1970 bis zum 1.1.2000

const mod = (a, b) => ((a % b) + b) % b;

export function tagnummer(jahr, monat, tag) {
  return Math.round(Date.UTC(jahr, monat - 1, tag) / TAG_MS) - EPOCHE;
}

export function datum(n) {
  const d = new Date((n + EPOCHE) * TAG_MS);
  return { jahr: d.getUTCFullYear(), monat: d.getUTCMonth() + 1, tag: d.getUTCDate() };
}

// Mittlere Anomalie, mittlere Länge, ekliptikale Länge, Schiefe für Tag n, 12 Uhr UTC.
function sonne(n) {
  const g = mod(357.528 + 0.9856003 * n, 360) * RAD;
  const q = mod(280.460 + 0.9856474 * n, 360);
  const lam = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * RAD;
  const eps = (23.439 - 0.0000004 * n) * RAD;
  return { q, lam, eps };
}

/** Deklination der Sonne in Grad für Tag n, 12 Uhr UTC. */
export function deklination(n) {
  const { lam, eps } = sonne(n);
  return Math.asin(Math.sin(eps) * Math.sin(lam)) / RAD;
}

/** Wahre minus mittlere Sonnenzeit in Minuten für Tag n. */
export function zeitgleichungMinuten(n) {
  const { q, lam, eps } = sonne(n);
  const ra = mod(Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)) / RAD, 360);
  return (mod(q - ra + 180, 360) - 180) * 4;
}

function vektor(ort) {
  const b = ort[0] * RAD, l = ort[1] * RAD;
  return [Math.cos(b) * Math.cos(l), Math.cos(b) * Math.sin(l), Math.sin(b)];
}

/** Sonnenhöhe in Grad an einem Ort, wenn der Sonnenpunkt auf (dek, sonnenlaenge) steht. */
export function hoehe(ort, dek, sonnenlaenge) {
  const a = ort[0] * RAD, d = dek * RAD, h = (ort[1] - sonnenlaenge) * RAD;
  return Math.asin(Math.sin(a) * Math.sin(d) + Math.cos(a) * Math.cos(d) * Math.cos(h)) / RAD;
}

/**
 * Augenblicke gleicher Sonnenhöhe zweier Orte bei Deklination dek.
 * Liste von { laenge, hoehe } (Länge des Sonnenpunkts und gemeinsame Höhe, Grad), höchstes zuerst.
 * Null, ein oder zwei Einträge. Auch Treffen unter dem Horizont (Höhe negativ).
 */
export function treffen(ich, ort, dek) {
  const p1 = vektor(ich), p2 = vektor(ort);
  const nx = p1[0] - p2[0], ny = p1[1] - p2[1], nz = p1[2] - p2[2];
  const r = Math.hypot(nx, ny), d = dek * RAD;
  if (r < 1e-12) return [];           // derselbe Ort oder genau gegenüber auf derselben Achse
  const c = -nz * Math.tan(d) / r;
  if (Math.abs(c) > 1) return [];     // der Deklinationskreis erreicht die Mittelebene nicht
  const phi = Math.atan2(ny, nx), w = Math.acos(c);
  const aus = [];
  for (const L of (w > 1e-12 ? [phi + w, phi - w] : [phi])) {
    const s = [Math.cos(d) * Math.cos(L), Math.cos(d) * Math.sin(L), Math.sin(d)];
    const sk = Math.max(-1, Math.min(1, s[0] * p1[0] + s[1] * p1[1] + s[2] * p1[2]));
    aus.push({ laenge: mod(L / RAD + 180, 360) - 180, hoehe: Math.asin(sk) / RAD });
  }
  aus.sort((a, b) => b.hoehe - a.hoehe);
  return aus;
}

/** Höhe des höheren Treffens bei Deklination dek, oder null, wenn es keines gibt. */
export function spalt(ich, ort, dek) {
  const t = treffen(ich, ort, dek);
  return t.length ? t[0].hoehe : null;
}

/** Uhrzeit UTC in Stunden, zu der der Sonnenpunkt am Tag n auf dieser Länge steht. */
export function utcStunden(sonnenlaenge, n) {
  return mod(12 - sonnenlaenge / 15 - zeitgleichungMinuten(n) / 60, 24);
}

/**
 * Treffen eines UTC-Tages mit Uhrzeit: Liste von { ms, hoehe }, zeitlich geordnet.
 * ms sind Millisekunden seit 1970 (für new Date(ms)). Nur Treffen ab der Mindesthöhe.
 */
export function treffenAmTag(ich, ort, n, mindest = MINDESTHOEHE) {
  const aus = [];
  for (const t of treffen(ich, ort, deklination(n))) {
    if (t.hoehe >= mindest) {
      aus.push({ ms: (n + EPOCHE) * TAG_MS + utcStunden(t.laenge, n) * 3600000, hoehe: t.hoehe });
    }
  }
  aus.sort((a, b) => a.ms - b.ms);
  return aus;
}

/** Höchste Sonnenhöhe des Tages an einem Ort (für den Satz zur Polarnacht). */
export function mittagshoehe(ort, n) {
  return 90 - Math.abs(ort[0] - deklination(n));
}

/** Spalt für jeden der `tage` Tage ab `start`: Array von Zahlen oder null. */
export function reihe(ich, ort, start, tage = VORAUSSCHAU) {
  const aus = new Array(tage);
  for (let i = 0; i < tage; i++) aus[i] = spalt(ich, ort, deklination(start + i));
  return aus;
}

const offen = (sp, grenze) => sp !== null && sp >= grenze;

/**
 * Zustand einer Tür über `tage` Tage ab `start` nach REGELN.md Abschnitt 4.
 *   art:       'immer' | 'nie' | 'wechselt'
 *   streift:   true, wenn die Tür bei mindest-band und mindest+band nicht dieselbe Art hat
 *   schwellen: Liste { tag, was: 'auf'|'zu', ungefaehr }. 'zu' ist der letzte offene Tag,
 *              'auf' der erste. ungefaehr = true heißt "um den ..."
 *   spalt:     die Reihe selbst (Spalt je Tag), damit die Seite sie nicht zweimal rechnet
 */
export function tuer(ich, ort, start, tage = VORAUSSCHAU, mindest = MINDESTHOEHE, band = BAND) {
  const r = reihe(ich, ort, start, tage);
  const art = (grenze) => {
    let alle = true, eine = false;
    for (const sp of r) { if (offen(sp, grenze)) eine = true; else alle = false; }
    return alle ? 'immer' : !eine ? 'nie' : 'wechselt';
  };
  const wechsel = (grenze) => {
    const aus = [];
    for (let i = 1; i < r.length; i++) {
      const jetzt = offen(r[i], grenze), vorher = offen(r[i - 1], grenze);
      if (jetzt && !vorher) aus.push({ tag: start + i, was: 'auf' });
      if (vorher && !jetzt) aus.push({ tag: start + i - 1, was: 'zu' });
    }
    return aus;
  };
  const a = art(mindest);
  const streift = !(art(mindest - band) === a && a === art(mindest + band));
  const schwellen = [];
  if (a === 'wechselt') {
    const raender = [wechsel(mindest - band), wechsel(mindest + band)];
    for (const s of wechsel(mindest)) {
      // Derselbe Wechsel bei verschobener Grenze, nächstgelegen. Fehlt er oder liegt er mehr
      // als drei Tage weg, ist das Datum ungefähr.
      let ungefaehr = false;
      for (const liste of raender) {
        let nah = null;
        for (const x of liste) {
          if (x.was === s.was) { const ab = Math.abs(x.tag - s.tag); if (nah === null || ab < nah) nah = ab; }
        }
        if (nah === null || nah > 3) ungefaehr = true;
      }
      schwellen.push({ tag: s.tag, was: s.was, ungefaehr });
    }
  }
  return { art: a, streift, schwellen, spalt: r };
}
