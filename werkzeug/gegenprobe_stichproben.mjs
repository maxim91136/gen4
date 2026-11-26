// Stichproben für die Gegenprobe gegen fremde Rechnungen (REGELN.md Abschnitt 9, Punkt 2).
// Schreibt, was site/rechnung.mjs für feste Paare und Tage rechnet, als JSON auf die Ausgabe.
// Aufruf:  node werkzeug/gegenprobe_stichproben.mjs          (18 feste Stichproben)
//          node werkzeug/gegenprobe_stichproben.mjs alle     (fünf Orte gegen alle Türen, zwölf Tage)
// Gelesen wird die Ausgabe von werkzeug/gegenprobe_fremd.py.
import { readFileSync } from 'node:fs';
import { treffenAmTag, tagnummer } from '../site/rechnung.mjs';

export const ORTE = {
  Berlin: [52.52, 13.405], Rom: [41.9, 12.5], Tokio: [35.68, 139.69], Kapstadt: [-33.93, 18.42],
  Quito: [-0.22, -78.51], Singapur: [1.29, 103.85], 'Tromsø': [69.65, 18.96], Auckland: [-36.85, 174.76],
  'New York': [40.71, -74.01], 'Reykjavík': [64.15, -21.94], Nairobi: [-1.29, 36.82], Sydney: [-33.87, 151.21],
  Suva: [-18.14, 178.44], Apia: [-13.83, -171.77],
};

// Vor der Rechnung festgelegt: Fertig-Punkt 1 (Rom, Tokio, Kapstadt von Berlin), Polarkreis,
// Äquator, Datumsgrenze (Suva und Apia), Südhalbkugel, Sonnenwenden und Tagundnachtgleiche.
export const FAELLE = [
  ['Berlin', 'Rom', 2027, 3, 25], ['Berlin', 'Rom', 2027, 6, 21], ['Berlin', 'Tokio', 2027, 5, 1],
  ['Berlin', 'Kapstadt', 2027, 4, 1], ['Berlin', 'Kapstadt', 2027, 9, 10], ['Berlin', 'New York', 2027, 7, 15],
  ['Quito', 'Singapur', 2026, 12, 21], ['Quito', 'Nairobi', 2027, 3, 20], ['Tromsø', 'Reykjavík', 2027, 6, 21],
  ['Tromsø', 'Berlin', 2027, 5, 10], ['Auckland', 'Sydney', 2027, 1, 10], ['Auckland', 'Tokio', 2027, 10, 5],
  ['Suva', 'Apia', 2027, 2, 14], ['New York', 'Quito', 2026, 11, 26], ['Sydney', 'Kapstadt', 2026, 12, 5],
  ['Berlin', 'Nairobi', 2027, 8, 2],
];

const iso = (j, m, t) => `${j}-${String(m).padStart(2, '0')}-${String(t).padStart(2, '0')}`;

export function stichproben() {
  const aus = [];
  for (const [a, b, j, m, t] of FAELLE) {
    for (const x of treffenAmTag(ORTE[a], ORTE[b], tagnummer(j, m, t))) {
      aus.push({ ich: a, ort: b, ich_koord: ORTE[a], ort_koord: ORTE[b], tag: iso(j, m, t), ms: Math.round(x.ms), hoehe: x.hoehe });
    }
  }
  return aus;
}

function alle() {
  const d = JSON.parse(readFileSync(new URL('../site/orte.json', import.meta.url), 'utf8'));
  const aus = [];
  for (const h of ['Berlin', 'Tromsø', 'Quito', 'Auckland', 'Kapstadt']) {
    for (const t of d.tueren) for (let m = 1; m <= 12; m++) {
      for (const x of treffenAmTag(ORTE[h], [t[3], t[4]], tagnummer(2027, m, 15))) {
        aus.push({ ich: h, ort: t[1], ich_koord: ORTE[h], ort_koord: [t[3], t[4]], tag: iso(2027, m, 15), ms: Math.round(x.ms), hoehe: x.hoehe });
      }
    }
  }
  return aus;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  console.log(JSON.stringify(process.argv[2] === 'alle' ? alle() : stichproben()));
}
