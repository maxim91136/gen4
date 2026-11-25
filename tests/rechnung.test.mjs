// Tests zum Rechenmodul der Seite. Aufruf: node --test tests/
// Vergleicht site/rechnung.mjs mit den Zahlen aus der Python-Rechnung (tests/vergleichswerte.json).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as r from '../site/rechnung.mjs';

const V = JSON.parse(readFileSync(new URL('./vergleichswerte.json', import.meta.url), 'utf8'));
const BERLIN = [52.5, 13.4], ROM = [41.9, 12.5], TOKIO = [35.7, 139.7], KAPSTADT = [-33.9, 18.4];
const nr = (iso) => { const [j, m, t] = iso.split('-').map(Number); return r.tagnummer(j, m, t); };
const iso = (n) => { const d = r.datum(n); return `${d.jahr}-${String(d.monat).padStart(2, '0')}-${String(d.tag).padStart(2, '0')}`; };
const nah = (a, b, delta, msg) => assert.ok(Math.abs(a - b) <= delta, `${msg}: ${a} gegen ${b}`);
const START = r.tagnummer(V.jahr, 1, 1), TAGE = r.tagnummer(V.jahr + 1, 1, 1) - START;

test('Tagnummer und Datum', () => {
  assert.equal(r.tagnummer(2000, 1, 1), 0);
  assert.equal(r.tagnummer(2027, 1, 1), 9862);
  assert.equal(iso(r.tagnummer(2028, 2, 29)), '2028-02-29');
  for (let n = 9800; n < 10600; n++) assert.equal(nr(iso(n)), n);
});

test('Deklination und Zeitgleichung wie in Python', () => {
  assert.ok(V.sonne.length >= 10);
  for (const s of V.sonne) {
    nah(r.deklination(nr(s.tag)), s.deklination, 1e-9, 'Deklination ' + s.tag);
    nah(r.zeitgleichungMinuten(nr(s.tag)), s.zeitgleichung, 1e-9, 'Zeitgleichung ' + s.tag);
  }
});

test('Treffen: Höhe und Uhrzeit wie in Python', () => {
  assert.ok(V.treffen.length >= 500);
  const ordnung = (a, b) => a.utc - b.utc; // nach Uhrzeit, weil zwei Treffen gleich hoch sein können
  for (const f of V.treffen) {
    const n = nr(f.tag);
    const js = r.treffen(f.ich, f.ort, r.deklination(n)).map((t) => ({ hoehe: t.hoehe, utc: r.utcStunden(t.laenge, n) })).sort(ordnung);
    const py = [...f.treffen].sort(ordnung);
    const wo = `${f.ich} / ${f.ort} / ${f.tag}`;
    assert.equal(js.length, py.length, wo);
    for (let i = 0; i < js.length; i++) {
      nah(js[i].hoehe, py[i].hoehe, 1e-7, 'Höhe ' + wo);
      const dt = Math.abs(js[i].utc - py[i].utc);
      nah(Math.min(dt, 24 - dt), 0, 1e-7, 'Uhrzeit ' + wo);
    }
  }
});

test('Türen: Art, Streifen und jede Schwelle wie in Python', () => {
  assert.ok(V.tueren.length >= 250);
  let schwellen = 0;
  for (const f of V.tueren) {
    const t = r.tuer(f.ich, f.ort, START, TAGE);
    const wo = `${f.standort} / ${f.name}`;
    assert.equal(t.art, f.art, wo);
    assert.equal(t.streift, f.streift, wo);
    assert.deepEqual(t.schwellen.map((s) => ({ tag: iso(s.tag), was: s.was, ungefaehr: s.ungefaehr })), f.schwellen, wo);
    schwellen += f.schwellen.length;
  }
  assert.ok(schwellen > 100, 'der Vergleich soll nicht leer laufen');
});

test('REGELN Abschnitt 9 Punkt 1: Rom, Kapstadt, Tokio von Berlin aus, 2027', () => {
  // Alle Schwellen des Jahres, nicht nur die aus den Regeln. Kapstadt hat vier: Die Tür ist
  // nur zweimal im Jahr je vier Wochen offen (gefunden in Lauf 7 von A).
  const soll = [
    [ROM, [['2027-03-25', 'auf'], ['2027-09-18', 'zu']]],
    [KAPSTADT, [['2027-03-17', 'auf'], ['2027-04-14', 'zu'], ['2027-08-29', 'auf'], ['2027-09-26', 'zu']]],
    [TOKIO, [['2027-01-31', 'auf'], ['2027-11-10', 'zu']]],
  ];
  for (const [ort, schwellen] of soll) {
    const t = r.tuer(BERLIN, ort, START, TAGE);
    assert.equal(t.art, 'wechselt');
    assert.deepEqual(t.schwellen.map((s) => [iso(s.tag), s.was]), schwellen);
    assert.ok(t.schwellen.every((s) => !s.ungefaehr));
  }
});

test('Die Höhe am Treffen gilt für beide Orte', () => {
  for (const f of V.tueren) {
    for (const dek of [-23.44, -7, 0, 11, 23.44]) {
      for (const t of r.treffen(f.ich, f.ort, dek)) {
        nah(r.hoehe(f.ich, dek, t.laenge), t.hoehe, 1e-6, f.name);
        nah(r.hoehe(f.ort, dek, t.laenge), t.hoehe, 1e-6, f.name);
      }
    }
  }
});

test('Derselbe Ort hat kein Treffen, und nichts wirft einen Fehler', () => {
  assert.deepEqual(r.treffen(BERLIN, BERLIN, 5), []);
  const t = r.tuer(BERLIN, BERLIN, START);
  assert.equal(t.art, 'nie');
  assert.deepEqual(t.schwellen, []);
  // Pole, Datumsgrenze, Gegenpunkt: Zahlen oder leere Listen, nie NaN.
  const rand = [[90, 0], [-90, 0], [0, 180], [0, -180], [-52.5, -166.6], [52.5, -166.6], [89.99, 13.4]];
  for (const a of rand) for (const b of rand) {
    const x = r.tuer(a, b, START);
    assert.ok(['immer', 'nie', 'wechselt'].includes(x.art));
    for (const sp of x.spalt) assert.ok(sp === null || Number.isFinite(sp), `${a} / ${b}`);
  }
});

test('Treffen am Tag: zeitlich geordnet, im Tag, über der Mindesthöhe', () => {
  const n = r.tagnummer(2027, 6, 21);
  const anfang = Date.UTC(2027, 5, 21);
  let zahl = 0;
  for (const f of V.tueren.filter((x) => x.standort === 'Berlin')) {
    const liste = r.treffenAmTag(BERLIN, f.ort, n);
    assert.ok(liste.length <= 2);
    for (let i = 0; i < liste.length; i++) {
      assert.ok(liste[i].ms >= anfang && liste[i].ms < anfang + 86400000, f.name);
      assert.ok(liste[i].hoehe >= r.MINDESTHOEHE, f.name);
      if (i) assert.ok(liste[i].ms >= liste[i - 1].ms);
      zahl++;
    }
  }
  assert.ok(zahl > 20, 'am 21. Juni gibt es von Berlin aus viele Treffen, gezählt: ' + zahl);
});

test('Polarnacht: Longyearbyen sieht am 21. Dezember keine 5 Grad, Berlin schon', () => {
  const n = r.tagnummer(2027, 12, 21);
  assert.ok(r.mittagshoehe([78.2, 15.6], n) < r.MINDESTHOEHE);
  assert.ok(r.mittagshoehe(BERLIN, n) > r.MINDESTHOEHE);
  for (const f of V.tueren.filter((x) => x.standort === 'Longyearbyen')) {
    assert.deepEqual(r.treffenAmTag(f.ich, f.ort, n), [], f.name);
  }
});

test('Tempo: 500 Türen über 366 Tage in unter zwei Sekunden', () => {
  const t0 = performance.now();
  for (let i = 0; i < 500; i++) r.tuer(BERLIN, [-80 + (i % 33) * 5, -180 + i * 0.71], START);
  const ms = performance.now() - t0;
  assert.ok(ms < 2000, `gebraucht: ${Math.round(ms)} ms`);
});
