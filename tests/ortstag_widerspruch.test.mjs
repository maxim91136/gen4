// B, Lauf 8: Widerspruchsprobe für die Ortstag-Regel. Fünf Beobachter (auch UTC+14 und UTC-11,
// Polarkreis), das ganze Jahr 2027 im Fünf-Tage-Schritt, alle Türen. Prüft, dass "offen" und "zu"
// zu den Treffen des Ortstags passen und dass "heute zum letzten Mal" kein Treffen am Folgetag hat.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as r from '../site/rechnung.mjs';
import { ansicht } from '../site/ansicht.mjs';

const D = JSON.parse(readFileSync(new URL('../site/orte.json', import.meta.url), 'utf8'));
const ORTE = D.tueren.map((z) => ({ id: z[0], name: z[1], land: z[2], ort: [z[3], z[4]] }));
const BEOBACHTER = [['Berlin', [52.52, 13.4], 1], ['Auckland', [-36.85, 174.76], 13],
  ['Kiritimati', [1.87, -157.4], 14], ['Pago Pago', [-14.28, -170.7], -11], ['Tromsø', [69.65, 18.96], 1]];

test('Ortstag: offen/zu und "heute zum letzten Mal" widersprechen keinem Treffen', () => {
  for (const [nm, ich, h] of BEOBACHTER) {
    const zone = (ms) => Math.floor((ms + h * 3600000) / 86400000) - 10957;
    for (let d = 0; d < 366; d += 5) {
      const t = Date.UTC(2027, 0, 1, 12) + d * 86400000;
      const n0 = Math.floor(t / 86400000) - 10957;
      const a = ansicht(ich, ORTE, t, zone);
      const nachId = new Map(ORTE.map((o) => [o.id, o.ort]));
      for (const e of a.tueren) {
        let heute = 0, morgen = 0;
        for (let u = n0 - 1; u <= n0 + 3; u++) for (const m of r.treffenAmTag(ich, nachId.get(e.id), u)) {
          const k = zone(m.ms) - a.heute;
          if (k === 0) heute++; else if (k === 1) morgen++;
        }
        const wo = `${nm} Tag ${d} ${e.name}`;
        if (e.zustand === 'offen') assert.ok(heute > 0, 'offen ohne Treffen: ' + wo);
        if (e.zustand === 'zu') assert.equal(heute, 0, 'zu mit Treffen: ' + wo);
        if (a.heuteZu.includes(e)) assert.equal(morgen, 0, 'heuteZu, aber morgen Treffen: ' + wo);
      }
    }
  }
});
