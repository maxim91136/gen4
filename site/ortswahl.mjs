// Sonnentür: die Wahl des eigenen Orts. Reines Modul, kennt weder Seite noch Browser
// (tests/ortswahl.test.mjs). REGELN.md Abschnitt 5: aus der Liste gewählt, als Breite und Länge
// eingetippt oder, nur auf ausdrücklichen Tipp, vom Gerät, dann auf 0,1° gerundet. Der Ort
// liegt im Speicher des Browsers und sonst nirgends.

export const STANDORT_STELLEN = 1;   // Nachkommastellen für den Standort des Geräts (0,1°, etwa 11 km)
export const TREFFER_HOECHSTENS = 8;

/** Schreibweise zum Vergleichen: klein, ohne Akzente, nur Buchstaben, Ziffern und einzelne Leerzeichen. */
export function vergleichsform(s) {
  return String(s).toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Orte, deren Name zur Eingabe passt. `liste` hat Zeilen [name, land, breite, länge], die größten
 * Städte zuerst (so liegt sie in orte.json). Erst Namen, die so anfangen, dann Namen, in denen
 * ein Wort so anfängt; innerhalb davon bleibt die Reihenfolge der Liste. Unter zwei Zeichen nichts.
 * Ergebnis: Liste { name, land, ort: [breite, länge] }.
 */
export function suche(liste, eingabe, hoechstens = TREFFER_HOECHSTENS) {
  const q = vergleichsform(eingabe);
  if (q.length < 2) return [];
  const vorn = [], innen = [];
  for (const z of liste) {
    const n = vergleichsform(z[0]);
    if (n.startsWith(q)) vorn.push(z);
    else if (innen.length < hoechstens && n.includes(' ' + q)) innen.push(z);
    if (vorn.length >= hoechstens) break;
  }
  return vorn.concat(innen).slice(0, hoechstens).map((z) => ({ name: z[0], land: z[1], ort: [z[2], z[3]] }));
}

/** Eine Zahl aus einem Textfeld, Komma oder Punkt als Dezimalzeichen. Sonst null. */
export function zahl(text) {
  const s = String(text).trim().replace(',', '.');
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(s)) return null;
  return Number(s);
}

/** [Breite, Länge] aus zwei Textfeldern oder null, wenn etwas fehlt oder außerhalb liegt. */
export function koordinaten(breiteText, laengeText) {
  const b = zahl(breiteText), l = zahl(laengeText);
  if (b === null || l === null || Math.abs(b) > 90 || Math.abs(l) > 180) return null;
  return [b, l];
}

/** Auf `stellen` Nachkommastellen gerundet. */
export function runde(wert, stellen = STANDORT_STELLEN) {
  const f = 10 ** stellen;
  return Math.round(wert * f) / f + 0; // + 0 macht aus -0 eine 0
}

/** Der Standort des Geräts, gerundet, oder null, wenn er keine brauchbaren Zahlen hat. */
export function standort(breite, laenge) {
  if (!Number.isFinite(breite) || !Number.isFinite(laenge) || Math.abs(breite) > 90 || Math.abs(laenge) > 180) return null;
  return [runde(breite), runde(laenge)];
}

/**
 * Teile für die Anzeige von Koordinaten: { breite, nord, laenge, ost } mit Beträgen als Zahl.
 * Die Seite setzt daraus den Text in ihrer Sprache.
 */
export function gradteile(ort) {
  return { breite: Math.abs(ort[0]), nord: ort[0] >= 0, laenge: Math.abs(ort[1]), ost: ort[1] >= 0 };
}

/** Was im Speicher des Browsers liegt: Text aus einem gewählten Ort. */
export function alsText(wahl) {
  return JSON.stringify({ art: wahl.art, name: wahl.name || '', land: wahl.land || '', ort: wahl.ort });
}

/** Gewählter Ort aus dem Text im Speicher oder null, wenn dort nichts Brauchbares steht. */
export function ausText(text) {
  if (typeof text !== 'string' || !text) return null;
  let w;
  try { w = JSON.parse(text); } catch { return null; }
  if (!w || typeof w !== 'object' || !['liste', 'koordinaten', 'standort'].includes(w.art)) return null;
  if (!Array.isArray(w.ort) || w.ort.length !== 2 || !standort(w.ort[0], w.ort[1])) return null;
  if (w.art === 'liste' && (typeof w.name !== 'string' || !w.name.trim())) return null;
  return {
    art: w.art,
    name: w.art === 'liste' ? w.name.slice(0, 80) : '',
    land: w.art === 'liste' && typeof w.land === 'string' ? w.land.slice(0, 3) : '',
    ort: [w.ort[0], w.ort[1]],
  };
}
