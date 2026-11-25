// Tests zu site/ortswahl.mjs: Suche in der echten Ortsliste, Koordinaten, Standort, Speicher.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { vergleichsform, suche, anzeigename, zahl, koordinaten, runde, standort, gradteile, alsText, ausText, TREFFER_HOECHSTENS } from '../site/ortswahl.mjs';

const D = JSON.parse(readFileSync(new URL('../site/orte.json', import.meta.url), 'utf8'));

test('Die Suchliste hat die Form, von der die Suche ausgeht', () => {
  assert.deepEqual(D.orte_spalten.slice(0, 4), ['name', 'land', 'breite', 'laenge']);
  assert.equal(D.orte.length, D.zahlen.suchliste);
  for (const z of D.orte) {
    assert.ok(typeof z[0] === 'string' && z[0] && typeof z[1] === 'string', String(z));
    assert.ok(Math.abs(z[2]) <= 90 && Math.abs(z[3]) <= 180, String(z));
  }
});

test('Vergleichsform: Groß und klein, Akzente, Satzzeichen', () => {
  assert.equal(vergleichsform('  São  Paulo '), 'sao paulo');
  assert.equal(vergleichsform('Saint John’s'), 'saint john s');
  assert.equal(vergleichsform('Gießen'), 'giessen');
  assert.equal(vergleichsform('Zürich'), 'zurich');
});

test('Suche: Anfang des Namens zuerst, große Städte zuerst, ohne Akzente, höchstens acht', () => {
  assert.deepEqual(suche(D.orte, 'b'), []);
  assert.deepEqual(suche(D.orte, '   '), []);
  const berlin = suche(D.orte, 'berl');
  assert.equal(berlin[0].name, 'Berlin');
  assert.equal(berlin[0].land, 'DE');
  assert.ok(Math.abs(berlin[0].ort[0] - 52.52) < 0.05 && Math.abs(berlin[0].ort[1] - 13.4) < 0.05);
  assert.equal(suche(D.orte, 'SAO PAU')[0].name, 'São Paulo');
  assert.equal(suche(D.orte, 'zuri')[0].land, 'CH');
  // Ein Wort mitten im Namen wird auch gefunden, steht aber hinter den Namen, die so anfangen.
  const york = suche(D.orte, 'york').map((o) => o.name);
  assert.ok(york.includes('New York City'), york.join());
  const san = suche(D.orte, 'san');
  assert.equal(san.length, TREFFER_HOECHSTENS);
  // Seit es deutsche Namen gibt, darf auch der deutsche so anfangen (Saint Petersburg heißt
  // Sankt Petersburg). Daran scheiterte der zweite Namenslauf, zu Recht am Test, nicht an der Suche.
  for (const o of san) assert.ok(vergleichsform(o.name).startsWith('san') || vergleichsform(o.nameDe).startsWith('san'), o.name);
  assert.deepEqual(suche(D.orte, 'qqqqzz'), []);
  assert.deepEqual(suche(D.orte, '<script>'), suche(D.orte, 'script'));
});

test('Deutsche Namen: Suche in beiden Namen, Anzeige nach Sprache, alte Liste ohne fünfte Spalte geht weiter', () => {
  // Erfundene Liste in der Form von orte.json nach dem Namenslauf, keine Daten.
  const L = [['Milan', 'IT', 45.46, 9.19, 'Mailand'], ['Mainz', 'DE', 50, 8.27, ''], ['Cologne', 'DE', 50.93, 6.95, 'Köln'],
    ['Mexico City', 'MX', 19.43, -99.13, 'Mexiko-Stadt'], ['Frankfurt am Main', 'DE', 50.12, 8.68, ''], ['Alt', 'XX', 1, 2]];
  assert.deepEqual(suche(L, 'mail').map((o) => o.name), ['Milan']);
  assert.deepEqual(suche(L, 'mila').map((o) => o.nameDe), ['Mailand']);
  assert.deepEqual(suche(L, 'koln').map((o) => o.name), ['Cologne']);
  assert.deepEqual(suche(L, 'ma').map((o) => o.name), ['Milan', 'Mainz', 'Frankfurt am Main']); // Anfang (auch deutsch) vor Wortmitte
  assert.deepEqual(suche(L, 'stadt').map((o) => o.name), ['Mexico City']);
  assert.deepEqual(suche(L, 'city').map((o) => o.name), ['Mexico City']);
  assert.equal(suche(L, 'main')[0].nameDe, '');
  assert.deepEqual(suche(L, 'alt'), [{ name: 'Alt', nameDe: '', land: 'XX', ort: [1, 2] }]);
  assert.equal(anzeigename('Milan', 'Mailand', 'de'), 'Mailand');
  assert.equal(anzeigename('Milan', 'Mailand', 'en'), 'Milan');
  assert.equal(anzeigename('Mainz', '', 'de'), 'Mainz');
  assert.equal(anzeigename('Alt', undefined, 'de'), 'Alt');
  assert.equal(anzeigename('Alt', 5, 'de'), 'Alt');
});

test('Zahlen und Koordinaten: Komma oder Punkt, nichts Halbes, nichts außerhalb', () => {
  assert.equal(zahl('52,52'), 52.52);
  assert.equal(zahl(' -33.9 '), -33.9);
  assert.equal(zahl('+7'), 7);
  for (const s of ['', ' ', 'abc', '1e3', '12 34', '1,2,3', '0x10', 'NaN', 'Infinity', '--1']) assert.equal(zahl(s), null, s);
  assert.deepEqual(koordinaten('52,52', '13,4'), [52.52, 13.4]);
  assert.deepEqual(koordinaten('-90', '180'), [-90, 180]);
  assert.equal(koordinaten('90.01', '0'), null);
  assert.equal(koordinaten('0', '-180.5'), null);
  assert.equal(koordinaten('', '13'), null);
  assert.equal(koordinaten('52', ''), null);
});

test('Standort des Geräts wird auf 0,1° gerundet, bevor er irgendwo ankommt', () => {
  assert.deepEqual(standort(52.520008, 13.404954), [52.5, 13.4]);
  assert.deepEqual(standort(-33.9249, 18.4241), [-33.9, 18.4]);
  assert.deepEqual(standort(-0.04, 0.04), [0, 0]);
  assert.ok(Object.is(runde(-0.04), 0));
  assert.equal(standort(NaN, 3), null);
  assert.equal(standort(91, 3), null);
  assert.equal(standort(undefined, undefined), null);
  // Nie mehr als eine Nachkommastelle.
  for (let i = 0; i < 200; i++) {
    const [b, l] = standort(-90 + i * 0.9037, -180 + i * 1.8071);
    assert.ok(Math.abs(b * 10 - Math.round(b * 10)) < 1e-9 && Math.abs(l * 10 - Math.round(l * 10)) < 1e-9);
  }
});

test('Gradteile für die Anzeige', () => {
  assert.deepEqual(gradteile([-33.9, 18.4]), { breite: 33.9, nord: false, laenge: 18.4, ost: true });
  assert.deepEqual(gradteile([52.5, -0.1]), { breite: 52.5, nord: true, laenge: 0.1, ost: false });
});

test('Speicher: hin und zurück, und Unsinn im Speicher wird zu "kein Ort"', () => {
  const w = { art: 'liste', name: 'Milan', nameDe: 'Mailand', land: 'IT', ort: [45.46, 9.19] };
  assert.deepEqual(ausText(alsText(w)), w);
  const k = { art: 'standort', name: '', nameDe: '', land: '', ort: [52.5, 13.4] };
  // Was vor den deutschen Namen gemerkt wurde, gilt weiter.
  assert.deepEqual(ausText('{"art":"liste","name":"Lima","land":"PE","ort":[-12.04,-77.03]}'), { art: 'liste', name: 'Lima', nameDe: '', land: 'PE', ort: [-12.04, -77.03] });
  assert.equal(ausText(JSON.stringify({ ...k, nameDe: 'Unsinn' })).nameDe, '');
  assert.deepEqual(ausText(alsText(k)), k);
  // Im Speicher steht nur, was die Seite braucht.
  assert.deepEqual(Object.keys(JSON.parse(alsText({ ...w, geheim: 1 }))).sort(), ['art', 'land', 'name', 'nameDe', 'ort']);
  for (const s of [null, undefined, '', 'Berlin', '{', '[]', 'null', '{"art":"liste","ort":[1,2]}', '{"art":"x","name":"a","ort":[1,2]}',
    '{"art":"koordinaten","ort":[91,2]}', '{"art":"koordinaten","ort":["1","2"]}', '{"art":"koordinaten","ort":[1]}', '{"art":"koordinaten"}']) {
    assert.equal(ausText(s), null, String(s));
  }
  // Ein Name aus dem Speicher kann nicht beliebig lang werden.
  assert.equal(ausText(JSON.stringify({ art: 'liste', name: 'x'.repeat(500), land: 'ABCDEF', ort: [1, 2] })).name.length, 80);
});
