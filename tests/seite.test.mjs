// Tests zu den Dateien der Seite: Texte in beiden Sprachen, keine fremden Adressen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { TEXTE, satz } from '../site/texte.mjs';

const SITE = new URL('../site/', import.meta.url);
const lies = (name) => readFileSync(new URL(name, SITE), 'utf8');
const platzhalter = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test('Jeder Satz steht in beiden Sprachen, mit denselben Platzhaltern', () => {
  assert.deepEqual(Object.keys(TEXTE.de).sort(), Object.keys(TEXTE.en).sort());
  for (const k of Object.keys(TEXTE.de)) {
    assert.ok(TEXTE.de[k].trim() && TEXTE.en[k].trim(), k);
    assert.deepEqual([...new Set(platzhalter(TEXTE.de[k]))], [...new Set(platzhalter(TEXTE.en[k]))], k);
  }
});

test('Die Seite benutzt nur Sätze, die es gibt, und jeder Satz wird benutzt', () => {
  const html = lies('index.html'), js = lies('seite.mjs');
  const benutzt = new Set();
  for (const m of html.matchAll(/data-t="(\w+)"/g)) benutzt.add(m[1]);
  for (const m of js.matchAll(/\bt\(\s*'(\w+)'/g)) benutzt.add(m[1]);
  for (const m of js.matchAll(/\bt\([^()]*\? '(\w+)' : '(\w+)'/g)) { benutzt.add(m[1]); benutzt.add(m[2]); } // t(x ? 'a' : 'b')
  for (const m of js.matchAll(/dataset\.t = '(\w+)'/g)) benutzt.add(m[1]);
  for (const k of benutzt) assert.ok(k in TEXTE.de, 'fehlt in der Tabelle: ' + k);
  benutzt.add('ohneSkript'); // steht fest im noscript der Seite, siehe nächster Test
  for (const k of Object.keys(TEXTE.de)) assert.ok(benutzt.has(k), 'steht in der Tabelle, wird aber nicht benutzt: ' + k);
});

test('satz() füllt Platzhalter und versteckt keine Lücke', () => {
  assert.equal(satz('de', 'in_minuten', { min: 23, ort: 'Lima' }), 'In 23 Minuten: Lima.');
  assert.equal(satz('en', 'in_minuten', { min: 23, ort: 'Lima' }), 'In 23 minutes: Lima.');
  assert.equal(satz('de', 'gibt_es_nicht'), '[gibt_es_nicht]');
  assert.equal(satz('de', 'in_minuten', { min: 5 }), 'In 5 Minuten: {ort}.');
});

test('Ohne JavaScript steht ein Satz da, und die Herkunft steht in der Seite selbst', () => {
  const html = lies('index.html');
  assert.match(html, /<noscript>[\s\S]*JavaScript[\s\S]*<\/noscript>/);
  assert.ok(html.includes(TEXTE.de.ohneSkript) && html.includes(TEXTE.en.ohneSkript));
  assert.ok(html.includes(TEXTE.de.herkunft));
  assert.match(TEXTE.de.herkunft, /zwei KI-Sitzungen/);
  assert.match(TEXTE.en.herkunft, /two AI sessions/);
  assert.match(TEXTE.de.quellen, /GeoNames.*CC BY 4\.0/);
});

test('Nichts in site/ lädt etwas von einer fremden Adresse', () => {
  // Erlaubt sind Verweise zum Anklicken (<a href>), sonst keine Adresse mit Schema.
  const erlaubt = new Set(['https://github.com/maxim91136/gen4', 'https://www.geonames.org/']);
  for (const name of readdirSync(SITE)) {
    if (!/\.(html|mjs|js|css)$/.test(name)) continue;
    const text = lies(name);
    for (const m of text.matchAll(/(?:https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}[^\s"'<>)]*/gi)) {
      assert.ok(name === 'index.html' && erlaubt.has(m[0]), `${name}: ${m[0]}`);
    }
    if (name === 'index.html') {
      for (const m of text.matchAll(/<(?:script|link|img|iframe|source)\b[^>]*>/gi)) assert.ok(!/https?:|\/\//.test(m[0]), m[0]);
      for (const u of erlaubt) assert.ok(new RegExp(`<a href="${u}"`).test(text), u);
    }
    assert.ok(!/@import|sendBeacon|XMLHttpRequest|WebSocket|cookie/i.test(text), name);
  }
  assert.deepEqual([...lies('seite.mjs').matchAll(/fetch\(([^)]*)\)/g)].map((m) => m[1]), ["'orte.json'"]);
});
