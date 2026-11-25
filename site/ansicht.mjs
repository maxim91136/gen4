// Sonnentür: aus der Rechnung wird, was die Seite zeigt. Reines Modul, kennt weder Seite noch
// Browser. Die Zeitzone des Besuchers kommt als Funktion herein, damit Node jeden Ort der Erde
// nachstellen kann (tests/ansicht.test.mjs).
//
// Ortstag-Regel (B, Lauf 7; REGELN.md Abschnitt 4): Gerechnet wird auf UTC-Tagen. Das Datum,
// das die Seite nennt, ist aber der Kalendertag des Besuchers, an dem das letzte (bei "zu")
// oder erste (bei "auf") Treffen des Schwellentags liegt. Fahrplan und "offen heute" richten
// sich nach den Treffen, die in den Ortstag fallen.

import { tuer, treffenAmTag, mittagshoehe, MINDESTHOEHE, BAND, VORAUSSCHAU } from './rechnung.mjs';

const RAD = Math.PI / 180;
const TAG_MS = 86400000;
const EPOCHE = 10957; // Tage vom 1.1.1970 bis zum 1.1.2000, wie in rechnung.mjs

// Tage, die vor heute und hinter der Vorausschau mitgerechnet werden. Ohne diesen Rand fehlt
// einer Schwelle kurz hinter dem Anfang des Fensters ihr Gegenstück bei 5,5° (es läge vor dem
// Fenster), sie hieße dann "um den", und "Heute zum letzten Mal" käme nie vor. Gefunden in
// Lauf 8 an Tokio von Berlin aus. Zehn Tage reichen, weil schon mehr als drei "ungefähr" heißt.
export const RAND = 10;

/** UTC-Tagnummer (Tage seit 1.1.2000) eines Zeitpunkts. */
export const utcTag = (ms) => Math.floor(ms / TAG_MS) - EPOCHE;

/** Winkelabstand zweier Orte in Grad. */
export function abstandGrad(a, b) {
  const s = Math.sin(a[0] * RAD) * Math.sin(b[0] * RAD) +
    Math.cos(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.cos((a[1] - b[1]) * RAD);
  return Math.acos(Math.max(-1, Math.min(1, s))) / RAD;
}

/**
 * Alles, was die Seite für einen Ort und einen Augenblick zeigt.
 *
 *   ich      [Breite, Länge]
 *   orte     Liste { id, name, land, ort: [Breite, Länge] }
 *   jetztMs  Millisekunden seit 1970
 *   ortstag  Funktion ms -> Tagnummer des Kalendertags in der Zeitzone des Besuchers
 *
 * Ergebnis:
 *   heute       Tagnummer des Ortstags
 *   polarnacht  true, wenn die Sonne heute am eigenen Ort nie die Mindesthöhe erreicht
 *   tueren      je Ort { id, name, land, zustand, streift, spalt, naechste, danach }, sortiert
 *               nach dem, was als Nächstes geschieht.
 *               zustand: 'offen' | 'zu' (Tür wechselt) | 'immer' | 'nie' (über die Vorausschau)
 *               spalt: höchste gemeinsame Höhe heute oder null
 *               naechste / danach: { was, tag, in, ungefaehr, ms } oder null. tag ist ein Ortstag.
 *   fahrplan    Treffen des Ortstags { ms, hoehe, tuer } nach Zeit, tuer zeigt in `tueren`
 *   morgen      erstes Treffen des nächsten Ortstags oder null
 *   heuteZu     Türen, deren letztes Treffen heute liegt (Datum fest, nicht "um den")
 *   heuteAuf    Türen, die heute zum ersten Mal wieder offen sind
 *   naechsteZu  die Tür, die als Nächste nach heute schließt, oder null
 *   nachbarn    Orte, die näher als das Band liegen und deshalb keine Tür sind
 *   zahlen      { offen, zu, immer, nie }
 */
export function ansicht(ich, orte, jetztMs, ortstag) {
  const heute = ortstag(jetztMs);
  const n0 = utcTag(jetztMs);
  const start = n0 - RAND;
  const tage = VORAUSSCHAU + 2 * RAND;
  const tueren = [], nachbarn = [];
  let morgen = null;
  const roh = [];

  for (const o of orte) {
    // Näher als das Band: Die Sonne steht für beide immer gleich hoch, soweit das Modell
    // unterscheiden kann. Das ist keine Tür (REGELN.md Abschnitt 4, Zusatz Lauf 8).
    if (abstandGrad(ich, o.ort) < BAND) { nachbarn.push({ id: o.id, name: o.name, land: o.land }); continue; }

    const t = tuer(ich, o.ort, start, tage);
    const eintrag = { id: o.id, name: o.name, land: o.land, zustand: t.art, streift: t.streift,
      spalt: null, naechste: null, danach: null, heuteAuf: false };

    // Treffen des Ortstags und das erste von morgen, aus vier UTC-Tagen.
    const heutige = [];
    for (let n = n0 - 1; n <= n0 + 2; n++) {
      for (const m of treffenAmTag(ich, o.ort, n)) {
        const tag = ortstag(m.ms);
        if (tag === heute) heutige.push(m);
        else if (tag === heute + 1 && (morgen === null || m.ms < morgen.ms)) morgen = { ms: m.ms, hoehe: m.hoehe, eintrag };
      }
    }
    for (const m of heutige) {
      if (eintrag.spalt === null || m.hoehe > eintrag.spalt) eintrag.spalt = m.hoehe;
      roh.push({ ms: m.ms, hoehe: m.hoehe, eintrag });
    }

    if (t.art === 'wechselt') {
      // Schwellen auf Ortstage umrechnen.
      const schwellen = [];
      for (const s of t.schwellen) {
        const m = treffenAmTag(ich, o.ort, s.tag);
        if (!m.length) continue;
        const ms = s.was === 'zu' ? m[m.length - 1].ms : m[0].ms;
        schwellen.push({ was: s.was, tag: ortstag(ms), ungefaehr: s.ungefaehr, ms });
      }
      const offen = heutige.length > 0;
      eintrag.zustand = offen ? 'offen' : 'zu';
      const i = schwellen.findIndex((s) => offen ? (s.was === 'zu' && s.tag >= heute) : (s.was === 'auf' && s.tag > heute));
      if (i >= 0) {
        eintrag.naechste = { ...schwellen[i], in: schwellen[i].tag - heute };
        const d = schwellen.slice(i + 1).find((s) => s.was !== schwellen[i].was);
        if (d) eintrag.danach = { ...d, in: d.tag - heute };
      }
      eintrag.heuteAuf = schwellen.some((s) => s.was === 'auf' && s.tag === heute && !s.ungefaehr);
    }
    tueren.push(eintrag);
  }

  // Sortiert nach dem, was als Nächstes geschieht. Türen ohne Ereignis ans Ende.
  const rang = (e) => e.naechste ? 0 : e.zustand === 'offen' || e.zustand === 'zu' ? 1 : e.zustand === 'immer' ? 2 : 3;
  tueren.sort((a, b) => rang(a) - rang(b) ||
    (a.naechste && b.naechste ? a.naechste.tag - b.naechste.tag : 0) ||
    (a.name < b.name ? -1 : a.name > b.name ? 1 : 0) || a.id - b.id);
  tueren.forEach((e, i) => { e.nr = i; });

  const fahrplan = roh.sort((a, b) => a.ms - b.ms).map((m) => ({ ms: m.ms, hoehe: m.hoehe, tuer: m.eintrag.nr }));
  const zahlen = { offen: 0, zu: 0, immer: 0, nie: 0 };
  for (const e of tueren) zahlen[e.zustand]++;
  const schliesst = (e) => e.zustand === 'offen' && e.naechste;

  return {
    heute,
    polarnacht: mittagshoehe(ich, n0) < MINDESTHOEHE && fahrplan.length === 0,
    tueren, fahrplan,
    morgen: morgen ? { ms: morgen.ms, hoehe: morgen.hoehe, tuer: morgen.eintrag.nr } : null,
    heuteZu: tueren.filter((e) => schliesst(e) && e.naechste.in === 0 && !e.naechste.ungefaehr),
    heuteAuf: tueren.filter((e) => e.heuteAuf),
    naechsteZu: tueren.find((e) => schliesst(e) && e.naechste.in > 0) || null,
    nachbarn, zahlen,
  };
}

/** Das nächste Treffen nach jetztMs aus einer Ansicht: Eintrag des Fahrplans, `morgen` oder null. */
export function naechstesTreffen(a, jetztMs, nachlaufMs = 0) {
  for (const m of a.fahrplan) if (m.ms >= jetztMs - nachlaufMs) return m;
  return a.morgen;
}
