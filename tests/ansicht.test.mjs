// Tests zu site/ansicht.mjs: was die Seite aus der Rechnung macht. Aufruf: node --test tests/
// Mit der echten Ortsliste (site/orte.json) und nachgestellten Zeitzonen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as r from '../site/rechnung.mjs';
import { ansicht, naechstesTreffen, abstandGrad, utcTag, zeitraum, KNAPP_TAGE, VORN, ZEITRAUM_HOECHSTENS } from '../site/ansicht.mjs';

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
  // Die nächste Öffnung ist die früheste unter den geschlossenen Türen.
  assert.equal(a.naechsteAuf.zustand, 'zu');
  for (const e of a.tueren) if (e.zustand === 'zu' && e.naechste) assert.ok(e.naechste.tag >= a.naechsteAuf.naechste.tag, e.name);
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
  // Die Polarnacht sagt, wann es weitergeht: die früheste aller Öffnungen, und sie liegt nach heute.
  assert.equal(winter.naechsteAuf.zustand, 'zu');
  assert.equal(winter.naechsteAuf.naechste.was, 'auf');
  assert.ok(winter.naechsteAuf.naechste.in >= 1);
  for (const e of winter.tueren) if (e.naechste) assert.ok(e.naechste.tag >= winter.naechsteAuf.naechste.tag, e.name);
  // Von Longyearbyen aus kommt die Sonne erst im März wieder auf 5° (Mittagshöhe 11,78° + Deklination).
  assert.equal(r.datum(winter.naechsteAuf.naechste.tag).monat, 3);
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

// --- Lauf 9: knappe Türen und Zeiträume statt "um den" (REGELN.md Abschnitt 4) ---

test('zeitraum(): nur wenn beide Gegenstücke da sind, der Tag dazwischen liegt und die Spanne klein bleibt', () => {
  const s = { tag: 100, was: 'zu' };
  assert.deepEqual(zeitraum(s, [{ tag: 108, was: 'zu' }], [{ tag: 95, was: 'zu' }]), [95, 108]);
  assert.deepEqual(zeitraum(s, [{ tag: 95, was: 'zu' }], [{ tag: 108, was: 'zu' }]), [95, 108]);
  // Das nächstgelegene Gegenstück zählt, und nur eines derselben Art.
  assert.deepEqual(zeitraum(s, [{ tag: 300, was: 'zu' }, { tag: 104, was: 'zu' }, { tag: 101, was: 'auf' }], [{ tag: 97, was: 'zu' }]), [97, 104]);
  assert.equal(zeitraum(s, [], [{ tag: 95, was: 'zu' }]), null);
  assert.equal(zeitraum(s, [{ tag: 108, was: 'auf' }], [{ tag: 95, was: 'zu' }]), null);
  assert.equal(zeitraum(s, [{ tag: 110, was: 'zu' }], [{ tag: 105, was: 'zu' }]), null, 'Tag liegt nicht dazwischen');
  assert.equal(zeitraum(s, [{ tag: 100 + ZEITRAUM_HOECHSTENS, was: 'zu' }], [{ tag: 99, was: 'zu' }]), null, 'zu lang');
});

test('Zeiträume und knappe Türen: über ein Jahr und fünf Orte stimmig', () => {
  const faelle = [[BERLIN, 1], [ort('Auckland'), 13], [ort('Quito'), -5], [[69.65, 18.96], 1], [ort('Singapore'), 8]];
  let mitZeitraum = 0, um = 0, knapp = 0, frisch = 0, meisteVorn = 0, ohneVorn = 0;
  for (const [ich, h] of faelle) {
    for (let k = 0; k < 366; k += 19) {
      const jetzt = Date.UTC(2027, 0, 1 + k, 12) - h * 3600000;
      const a = ansicht(ich, ORTE, jetzt, zone(h));
      const wo = `${ich} Tag ${k} `;
      for (const e of a.tueren) {
        for (const n of [e.naechste, e.danach]) {
          if (!n) continue;
          if (n.von === null) { assert.equal(n.bis, null, wo + e.name); if (n.ungefaehr) um++; continue; }
          mitZeitraum++;
          assert.equal(n.ungefaehr, true, wo + e.name);                 // feste Daten haben keinen Zeitraum
          assert.ok(n.von <= n.tag && n.tag <= n.bis, wo + e.name);      // das Datum bei 5° liegt darin
          assert.ok(n.bis - n.von > 3, wo + e.name);                     // sonst wäre es nicht weich
          assert.ok(n.bis - n.von <= ZEITRAUM_HOECHSTENS, wo + e.name);
        }
        // Knapp ist nur, was heute offen ist und wechselt.
        if (e.knapp) {
          knapp++;
          assert.equal(e.zustand, 'offen', wo + e.name);
          assert.ok(e.frisch || (e.naechste && e.naechste.in <= KNAPP_TAGE), wo + e.name);
        } else if (e.zustand === 'offen') {
          assert.ok(!e.frisch && (!e.naechste || e.naechste.in > KNAPP_TAGE), wo + e.name);
        }
        if (e.frisch) { frisch++; assert.equal(e.zustand, 'offen', wo + e.name); }
        if (e.zustand === 'immer' || e.zustand === 'nie' || e.zustand === 'zu') assert.equal(e.knapp, false, wo + e.name);
      }
      for (const m of a.fahrplan) { assert.equal(m.knapp, a.tueren[m.tuer].knapp, wo); assert.equal(m.vorn, a.tueren[m.tuer].vorn, wo); }
      // Die vordersten Türen (Lauf 10): höchstens VORN, alle offen, und keine Tür dahinter liegt näher
      // an ihrer Schwelle als eine davor. Leer nur, wenn keine offene Tür einen Abstand hat.
      const vorn = a.tueren.filter((e) => e.vorn), mitAbstand = a.tueren.filter((e) => e.abstand !== null);
      assert.equal(vorn.length, Math.min(VORN, mitAbstand.length), wo);
      meisteVorn = Math.max(meisteVorn, vorn.length);
      if (!vorn.length) ohneVorn++;
      const weitester = Math.max(...vorn.map((e) => e.abstand));
      for (const e of a.tueren) {
        if (e.abstand === null) { assert.ok(!e.vorn && !e.frisch && !(e.zustand === 'offen' && e.naechste), wo + e.name); continue; }
        assert.equal(e.zustand, 'offen', wo + e.name);
        assert.ok(e.abstand >= 0 && e.spalt !== null, wo + e.name);
        assert.equal(e.abstand, Math.min(e.naechste ? e.naechste.in : Infinity, e.seit ?? Infinity), wo + e.name);
        if (!e.vorn) assert.ok(e.abstand >= weitester, wo + e.name);
        if (e.seit !== null) assert.ok(e.frisch && e.seit >= 1 && e.seit <= KNAPP_TAGE, wo + e.name);
      }
      // Wer knapp ist, wird nur von anderen Knappen verdrängt.
      if (a.tueren.some((e) => e.knapp && !e.vorn)) assert.ok(vorn.every((e) => e.knapp), wo);
      // Die oberste Zeile: gibt es heute noch ein Treffen mit einer vorderen Tür, dann steht eines oben,
      // und zwar das früheste. Sonst das nächste überhaupt.
      const oben = naechstesTreffen(a, jetzt);
      const vordere = a.fahrplan.filter((m) => m.vorn && m.ms >= jetzt), alle = a.fahrplan.filter((m) => m.ms >= jetzt);
      if (vordere.length) assert.equal(oben, vordere[0], wo);
      else if (alle.length) assert.equal(oben, alle[0], wo);
      else assert.equal(oben, a.morgenVorn || a.morgen, wo);
      if (a.morgenVorn) {
        assert.equal(zone(h)(a.morgenVorn.ms), a.heute + 1, wo);
        assert.equal(a.tueren[a.morgenVorn.tuer].vorn, true, wo);
        assert.ok(a.morgenVorn.ms >= a.morgen.ms, wo);
      }
      assert.equal(naechstesTreffen(a, jetzt, 0, true), alle.length ? alle[0] : a.morgen, wo);
    }
  }
  // Der Test soll nicht leer laufen.
  assert.ok(mitZeitraum > 100 && knapp > 100 && frisch > 20, `${mitZeitraum} ${um} ${knapp} ${frisch}`);
  assert.ok(mitZeitraum > um, `Zeitraum ${mitZeitraum}, um den ${um}`);
  assert.equal(meisteVorn, VORN);
  console.log(`vorn: ${ohneVorn} von ${faelle.length * 20} Stichtagen ohne vordere Tür`);
});

test('Tromsø: nie mehr als zehn vordere Türen, leer nur in der Polarnacht', () => {
  // Bs Zählung aus Lauf 9: mit der Frist von 30 Tagen bis zu 197 knappe Türen an einem Tag und
  // 13 von 37 Stichtagen leer. Mit der Rangfolge: höchstens VORN, und leer nur ohne offene Tür.
  const tromso = [69.65, 18.96];
  let leer = 0, meisteKnapp = 0;
  for (let k = 0; k < 366; k += 10) {
    const jetzt = Date.UTC(2027, 0, 1 + k, 11);
    const a = ansicht(tromso, ORTE, jetzt, zone(1));
    const vorn = a.tueren.filter((e) => e.vorn);
    meisteKnapp = Math.max(meisteKnapp, a.tueren.filter((e) => e.knapp).length);
    assert.ok(vorn.length <= VORN, `Tag ${k}: ${vorn.length}`);
    if (!vorn.length) {
      leer++;
      // Leer heißt: keine wechselnde Tür ist offen. In der Polarnacht ist gar keine offen.
      assert.equal(a.zahlen.offen, 0, `Tag ${k}`);
    } else {
      assert.ok(a.fahrplan.some((m) => m.vorn), `Tag ${k}`);
    }
    if (a.polarnacht) assert.equal(vorn.length, 0, `Tag ${k}`);
  }
  assert.ok(meisteKnapp > 100, `knapp höchstens ${meisteKnapp}`); // die Flut gibt es wirklich
  console.log(`Tromsø: ${leer} von 37 Stichtagen ohne vordere Tür, bis zu ${meisteKnapp} knappe`);
});

test('Frisch: Rom ist von Berlin aus Anfang April 2028 knapp, weil es gerade erst wieder aufging', () => {
  // Rom geht um den 25. März 2028 wieder auf (REGELN.md Abschnitt 9) und schließt erst im September.
  const a = ansicht(BERLIN, ORTE, Date.UTC(2028, 3, 5, 10), zone(2));
  const rom = bei(a, 'Rome');
  assert.equal(rom.zustand, 'offen');
  assert.equal(rom.frisch, true);
  assert.equal(rom.knapp, true);
  assert.ok(rom.naechste.in > KNAPP_TAGE);
  const spaeter = bei(ansicht(BERLIN, ORTE, Date.UTC(2028, 5, 5, 10), zone(2)), 'Rome');
  assert.equal(spaeter.frisch, false);
  assert.equal(spaeter.knapp, false);
});
