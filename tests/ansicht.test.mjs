// Tests zu site/ansicht.mjs: was die Seite aus der Rechnung macht. Aufruf: node --test tests/
// Mit der echten Ortsliste (site/orte.json) und nachgestellten Zeitzonen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as r from '../site/rechnung.mjs';
import { ansicht, naechstesTreffen, abstandGrad, utcTag } from '../site/ansicht.mjs';

const D = JSON.parse(readFileSync(new URL('../site/orte.json', import.meta.url), 'utf8'));
const ORTE = D.tueren.map((z) => ({ id: z[0], name: z[1], land: z[2], ort: [z[3], z[4]] }));
const ort = (name) => ORTE.find((o) => o.name === name).ort;
const BERLIN = ort('Berlin');
// Zeitzone mit festem Abstand zu UTC in Stunden.
const zone = (h) => (ms) => Math.floor((ms + h * 3600000) / 86400000) - 10957;
const iso = (n) => { const d = r.datum(n); return `${d.jahr}-${String(d.monat).padStart(2, '0')}-${String(d.tag).padStart(2, '0')}`; };
const bei = (a, name) => a.tueren.find((e) => e.name === name);

test('Hilfen: UTC-Tag und Abstand', () => {
  assert.equal(utcTag(Date.UTC(2027, 0, 1, 13)), r.tagnummer(2027, 1, 1));
  assert.ok(Math.abs(abstandGrad([0, 0], [0, 90]) - 90) < 1e-9);
  assert.equal(abstandGrad(BERLIN, BERLIN), 0);
});

test('Berlin: jede Tür kommt genau einmal vor, der eigene Ort ist keine Tür', () => {
  const a = ansicht(BERLIN, ORTE, Date.UTC(2027, 3, 14, 10), zone(2));
  assert.equal(a.tueren.length + a.nachbarn.length, ORTE.length);
  assert.deepEqual(a.nachbarn.map((o) => o.name), ['Berlin']);
  assert.equal(a.zahlen.offen + a.zahlen.zu + a.zahlen.immer + a.zahlen.nie, a.tueren.length);
  assert.equal(a.polarnacht, false);
});

test('Berlin: Rom und Tokio schließen an den Tagen aus REGELN.md, höchstens ein Tag daneben', () => {
  // Die Orte der echten Liste liegen 0,02° neben den Probeorten, deshalb ein Tag Spiel.
  const rom = bei(ansicht(BERLIN, ORTE, Date.UTC(2027, 8, 10, 10), zone(2)), 'Rome');
  assert.equal(rom.zustand, 'offen');
  assert.equal(rom.naechste.was, 'zu');
  assert.ok(Math.abs(rom.naechste.tag - r.tagnummer(2027, 9, 18)) <= 1, iso(rom.naechste.tag));
  assert.equal(rom.danach.was, 'auf');
  assert.ok(Math.abs(rom.danach.tag - r.tagnummer(2028, 3, 25)) <= 1, iso(rom.danach.tag));
  const tokio = bei(ansicht(BERLIN, ORTE, Date.UTC(2027, 10, 1, 10), zone(1)), 'Tokyo');
  assert.ok(Math.abs(tokio.naechste.tag - r.tagnummer(2027, 11, 10)) <= 1, iso(tokio.naechste.tag));
  assert.ok(Math.abs(tokio.danach.tag - r.tagnummer(2028, 1, 31)) <= 1, iso(tokio.danach.tag));
});

test('Der Tag vor, an und nach einer Schwelle erzählt dieselbe Geschichte', () => {
  // Fund aus Lauf 8: Ohne Rand am Fenster hieß Tokio am letzten Tag "um den", und
  // "Heute zum letzten Mal" kam nie vor.
  for (const [name, h] of [['Rome', 2], ['Tokyo', 1]]) {
    const frueh = bei(ansicht(BERLIN, ORTE, Date.UTC(2027, 7, 1, 10), zone(h)), name);
    const tag = frueh.naechste.tag;
    assert.equal(frueh.naechste.ungefaehr, false, name);
    const mittag = (n) => (n + 10957) * 86400000 + 10 * 3600000;
    for (let k = -5; k <= 0; k++) {
      const a = ansicht(BERLIN, ORTE, mittag(tag + k), zone(h));
      const e = bei(a, name);
      assert.equal(e.zustand, 'offen', `${name} ${k}`);
      assert.ok(e.spalt >= r.MINDESTHOEHE, `${name} ${k}`);
      assert.deepEqual([e.naechste.was, e.naechste.tag, e.naechste.in, e.naechste.ungefaehr], ['zu', tag, Math.abs(k), false], `${name} ${k}`);
      assert.equal(a.heuteZu.includes(e), k === 0, `${name} ${k}`);
    }
    const danach = bei(ansicht(BERLIN, ORTE, mittag(tag + 1), zone(h)), name);
    assert.equal(danach.zustand, 'zu', name);
    assert.equal(danach.spalt, null, name);
    assert.equal(danach.naechste.was, 'auf', name);
    assert.equal(danach.naechste.tag, frueh.danach.tag, name);
    // Am Tag des Wiederaufgehens steht die Tür unter "heute auf".
    const auf = ansicht(BERLIN, ORTE, mittag(danach.naechste.tag), zone(1));
    assert.ok(auf.heuteAuf.includes(bei(auf, name)), name);
    assert.equal(bei(auf, name).zustand, 'offen', name);
  }
});

test('Ortstag-Regel: Auckland und Tokio, das Datum ist der Tag des Besuchers', () => {
  // B, Lauf 7: Die Schwelle "Tokio zu" liegt auf dem UTC-Tag 1. Juni 2027, das letzte Treffen
  // aber am Morgen des 2. Juni in Auckland. Die Seite muss den 2. Juni nennen.
  const AKL = ort('Auckland'), z = zone(12);
  const morgens = (j, m, t) => Date.UTC(j, m - 1, t, 1) - 12 * 3600000; // 1 Uhr Ortszeit
  const am1 = ansicht(AKL, ORTE, morgens(2027, 6, 1), z), am2 = ansicht(AKL, ORTE, morgens(2027, 6, 2), z), am3 = ansicht(AKL, ORTE, morgens(2027, 6, 3), z);
  assert.equal(iso(am2.heute), '2027-06-02');
  assert.equal(bei(am1, 'Tokyo').naechste.in, 1);
  assert.equal(iso(bei(am1, 'Tokyo').naechste.tag), '2027-06-02');
  assert.ok(am2.heuteZu.includes(bei(am2, 'Tokyo')));
  assert.equal(bei(am3, 'Tokyo').zustand, 'zu');
  // Das letzte Treffen steht am 2. Juni im Fahrplan, am 3. Juni steht keines mehr da.
  const nr2 = bei(am2, 'Tokyo').nr, nr3 = bei(am3, 'Tokyo').nr;
  const letzte = am2.fahrplan.filter((m) => m.tuer === nr2);
  assert.ok(letzte.length >= 1);
  assert.equal(letzte[letzte.length - 1].ms, bei(am2, 'Tokyo').naechste.ms);
  assert.equal(am3.fahrplan.filter((m) => m.tuer === nr3).length, 0);
  // Der UTC-Tag dieses Treffens ist tatsächlich der Vortag: genau der Fall, um den es geht.
  assert.equal(iso(utcTag(bei(am2, 'Tokyo').naechste.ms)), '2027-06-01');
});

test('Über ein Jahr und vier Zeitzonen: Zustand, Spalt, Fahrplan und Reihenfolge passen zusammen', () => {
  const faelle = [[BERLIN, 1], [ort('Auckland'), 13], [[21.31, -157.86], -10], [ort('Quito'), -5]];
  for (const [ich, h] of faelle) {
    for (let k = 0; k < 366; k += 23) {
      const jetzt = Date.UTC(2027, 0, 1 + k, 3, 17);
      const a = ansicht(ich, ORTE, jetzt, zone(h));
      const wo = `${ich} Tag ${k}`;
      assert.equal(a.heute, zone(h)(jetzt), wo);
      let vorher = -Infinity;
      for (const m of a.fahrplan) {
        assert.equal(zone(h)(m.ms), a.heute, wo);
        assert.ok(m.ms >= vorher && m.hoehe >= r.MINDESTHOEHE && Number.isFinite(m.hoehe), wo);
        assert.ok(a.tueren[m.tuer].spalt >= m.hoehe, wo);
        vorher = m.ms;
      }
      let rang = -Infinity;
      for (const e of a.tueren) {
        if (e.zustand === 'offen') assert.ok(e.spalt >= r.MINDESTHOEHE, wo + e.name);
        if (e.zustand === 'zu' || e.zustand === 'nie') assert.equal(e.spalt, null, wo + e.name);
        if (e.naechste) {
          assert.equal(e.naechste.was, e.zustand === 'offen' ? 'zu' : 'auf', wo + e.name);
          assert.ok(e.naechste.in >= (e.zustand === 'offen' ? 0 : 1), wo + e.name);
          assert.ok(e.naechste.tag >= rang, wo + e.name);
          rang = e.naechste.tag;
          if (e.danach) assert.ok(e.danach.tag >= e.naechste.tag && e.danach.was !== e.naechste.was, wo + e.name);
        }
      }
      if (a.morgen) assert.equal(zone(h)(a.morgen.ms), a.heute + 1, wo);
      const n = naechstesTreffen(a, jetzt);
      if (n) assert.ok(n.ms >= jetzt, wo);
    }
  }
});

test('Ränder der Erde: Polarnacht, Mitternachtssonne, Äquator, Datumsgrenze, Pole', () => {
  const LYB = [78.22, 15.64]; // Longyearbyen, wie in werkzeug/vergleichswerte.py
  const winter = ansicht(LYB, ORTE, Date.UTC(2027, 11, 21, 11), zone(1));
  assert.equal(winter.polarnacht, true);
  assert.equal(winter.fahrplan.length, 0);
  assert.equal(naechstesTreffen(winter, Date.UTC(2027, 11, 21, 11)), null);
  assert.equal(winter.heuteZu.length, 0);
  const sommer = ansicht(LYB, ORTE, Date.UTC(2027, 5, 21, 11), zone(2));
  assert.equal(sommer.polarnacht, false);
  assert.ok(sommer.fahrplan.length > 0);
  for (const [ich, h] of [[[0, -78.5], -5], [[-16.5, 180], 12], [[-16.5, -180], -12], [[90, 0], 0], [[-90, 0], 0], [[0, 0], 0]]) {
    for (const monat of [0, 3, 6, 9]) {
      const a = ansicht(ich, ORTE, Date.UTC(2027, monat, 21, 0, 30), zone(h));
      assert.equal(a.tueren.length + a.nachbarn.length, ORTE.length);
      for (const e of a.tueren) {
        assert.ok(e.spalt === null || Number.isFinite(e.spalt));
        if (e.naechste) assert.ok(Number.isInteger(e.naechste.tag) && Number.isInteger(e.naechste.in));
      }
    }
  }
});

test('Ein Ort als sein eigener Besucher ist Nachbar, keine Tür', () => {
  for (const name of ['Tokyo', 'Quito', 'Auckland']) {
    const a = ansicht(ort(name), ORTE, Date.UTC(2027, 4, 5, 12), zone(0));
    assert.ok(a.nachbarn.some((o) => o.name === name), name);
    assert.ok(!a.tueren.some((e) => e.name === name), name);
  }
});

test('Tempo: eine Ansicht mit allen Türen in unter zwei Sekunden', () => {
  const t0 = performance.now();
  ansicht(BERLIN, ORTE, Date.UTC(2027, 3, 14, 10), zone(2));
  assert.ok(performance.now() - t0 < 2000);
});
