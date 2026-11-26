// Gegenprobe gegen fremde Rechnungen (REGELN.md Abschnitt 9, Punkt 2).
// tests/gegenprobe_fremd.json schreibt werkzeug/gegenprobe_fremd.py mit PyEphem und Astral; die
// beiden Pakete gehören nicht zu den Tests. Hier wird geprüft, dass die Datei noch zur Rechnung
// der Seite passt, dass die Stichproben die Grenzen halten und dass der Satz auf der Seite
// dieselben Zahlen nennt wie die Datei.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stichproben } from '../werkzeug/gegenprobe_stichproben.mjs';
import { TEXTE } from '../site/texte.mjs';

const G = JSON.parse(readFileSync(new URL('./gegenprobe_fremd.json', import.meta.url), 'utf8'));

test('Die Stichproben in der Datei sind die, die die Seite heute rechnet', () => {
  const jetzt = stichproben();
  assert.equal(jetzt.length, G.stichproben.length);
  jetzt.forEach((p, i) => {
    const g = G.stichproben[i];
    assert.deepEqual([p.ich, p.ort, p.tag], [g.ich, g.ort, g.tag]);
    assert.ok(Math.abs(p.ms - g.ms) <= 1, `Uhrzeit ${p.ich} ${p.ort} ${p.tag}`);
    assert.ok(Math.abs(p.hoehe - g.hoehe) <= 1e-5, `Höhe ${p.ich} ${p.ort} ${p.tag}`);
  });
});

test('Mindestens zehn Stichproben, jede hält 0,5° und drei Minuten gegen beide fremden Rechnungen', () => {
  assert.ok(G.stichproben.length >= 10);
  assert.equal(G.grenzen.hoehe_grad, 0.5);
  assert.equal(G.grenzen.zeit_s, 180);
  for (const p of G.stichproben) for (const wer of ['pyephem', 'astral']) {
    assert.ok(p[wer].hoehe_abstand <= 0.5, `${wer} Höhe ${p.ich} ${p.ort} ${p.tag}`);
    assert.ok(p[wer].zeit_abstand_s !== null && Math.abs(p[wer].zeit_abstand_s) <= 180, `${wer} Uhrzeit ${p.ich} ${p.ort} ${p.tag}`);
  }
});

test('Der Satz auf der Seite nennt die Zahlen der Datei', () => {
  const z = G.zaehlung, [j, m, t] = G.stand.split('-').map(Number);
  const groesste = Math.max(z.hoehe_abstand.groesster, ...G.stichproben.flatMap((p) => [p.pyephem.hoehe_abstand, p.astral.hoehe_abstand]));
  assert.ok(groesste <= 0.2, 'der Satz sagt 0,2°');
  assert.ok(z.zeit_abstand_s.groesster < 600, 'der Satz sagt knapp zehn Minuten');
  assert.equal(z.hoehe_abstand.ueber_grenze, 0);
  const monat = { de: 'November', en: 'November' };
  assert.equal(m, 11); // ändert sich der Stand, müssen Satz und diese Zeile neu geschrieben werden
  for (const [sprache, tausender] of [['de', ' '], ['en', ',']]) {
    const s = TEXTE[sprache].gegenprobe;
    const treffen = String(z.treffen).replace(/(\d)(?=(\d{3})+$)/g, '$1' + tausender);
    for (const teil of [String(G.stichproben.length) + ' ', treffen, `PyEphem ${G.fremd.pyephem}`, `Astral ${G.fremd.astral}`,
      ` ${z.zeit_abstand_s.ueber_grenze} `, ` ${z.zeit_abstand_s.ohne_gleichstand_in_einer_stunde} `, String(t), monat[sprache], String(j)]) {
      assert.ok(s.includes(teil), `${sprache}: „${teil}“ fehlt im Satz`);
    }
  }
});
