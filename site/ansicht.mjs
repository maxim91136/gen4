// Sonnentür: aus der Rechnung wird, was die Seite zeigt. Reines Modul, kennt weder Seite noch
// Browser. Die Zeitzone des Besuchers kommt als Funktion herein, damit Node jeden Ort der Erde
// nachstellen kann (tests/ansicht.test.mjs).
//
// Ortstag-Regel (B, Lauf 7; REGELN.md Abschnitt 4): Gerechnet wird auf UTC-Tagen. Das Datum,
// das die Seite nennt, ist aber der Kalendertag des Besuchers, an dem das letzte (bei "zu")
// oder erste (bei "auf") Treffen des Schwellentags liegt. Fahrplan und "offen heute" richten
// sich nach den Treffen, die in den Ortstag fallen.

import { tuer, treffenAmTag, mittagshoehe, spalt, deklination, MINDESTHOEHE, BAND, VORAUSSCHAU } from './rechnung.mjs';

const RAD = Math.PI / 180;
const TAG_MS = 86400000;
const EPOCHE = 10957; // Tage vom 1.1.1970 bis zum 1.1.2000, wie in rechnung.mjs

// Tage, die vor heute und hinter der Vorausschau mitgerechnet werden. Ohne diesen Rand fehlt
// einer Schwelle kurz hinter dem Anfang des Fensters ihr Gegenstück bei 5,5° (es läge vor dem
// Fenster), sie hieße dann "um den", und "Heute zum letzten Mal" käme nie vor. Gefunden in
// Lauf 8 an Tokio von Berlin aus. Zehn Tage reichen, weil schon mehr als drei "ungefähr" heißt.
export const RAND = 10;

// Knappe Türen (REGELN.md Abschnitt 4, Zusatz Lauf 9): heute offen und entweder in höchstens
// so vielen Tagen zu oder vor höchstens so vielen Tagen noch zu gewesen. Seit Lauf 10 ist das
// nur noch ein Merkmal der Tür; was oben steht, entscheidet VORN.
export const KNAPP_TAGE = 30;

// Die vordersten Türen (Vorschlag B, Lauf 9; REGELN.md Abschnitt 4, Zusatz Lauf 10): die
// höchstens so vielen heute offenen Türen mit dem kleinsten Abstand in Tagen zu ihrer Schwelle.
// Nur sie kommen in die oberste Zeile und in den kurzen Fahrplan. Eine Frist in Tagen lief um
// die Sonnenwenden leer und lieferte am Polarkreis 197 Türen; eine Rangfolge kann beides nicht.
export const VORN = 10;

// Weiche Daten als Zeitraum (Vorschlag B, Lauf 8): Statt "um den" nennt die Seite die Tage, die
// die Rechnung bei 4,5° und bei 5,5° hergibt. Ist der Zeitraum länger als das hier, gehören die
// beiden Tage nicht zu derselben Schwelle (gemessen in Lauf 9: echte Zeiträume höchstens 45
// Tage, falsche Paare über 90), und es bleibt bei "um den".
export const ZEITRAUM_HOECHSTENS = 60;

const istOffen = (sp, grenze) => sp !== null && sp >= grenze;

/** Tage, an denen eine Reihe von Spalten die Grenze kreuzt. Wie `wechsel` in rechnung.mjs. */
function wechsel(reihe, start, grenze) {
  const aus = [];
  for (let i = 1; i < reihe.length; i++) {
    const jetzt = istOffen(reihe[i], grenze), vorher = istOffen(reihe[i - 1], grenze);
    if (jetzt && !vorher) aus.push({ tag: start + i, was: 'auf' });
    if (vorher && !jetzt) aus.push({ tag: start + i - 1, was: 'zu' });
  }
  return aus;
}

/**
 * Zeitraum einer weichen Schwelle: [von, bis] in UTC-Tagen oder null. Null, wenn bei 4,5° oder
 * 5,5° das Gegenstück fehlt, wenn der Tag bei 5° nicht zwischen beiden liegt oder wenn der
 * Zeitraum länger ist als ZEITRAUM_HOECHSTENS.
 */
export function zeitraum(schwelle, unten, oben) {
  const nah = (liste) => {
    let b = null;
    for (const x of liste) if (x.was === schwelle.was && (b === null || Math.abs(x.tag - schwelle.tag) < Math.abs(b - schwelle.tag))) b = x.tag;
    return b;
  };
  const a = nah(unten), b = nah(oben);
  if (a === null || b === null) return null;
  const von = Math.min(a, b), bis = Math.max(a, b);
  if (schwelle.tag < von || schwelle.tag > bis || bis - von > ZEITRAUM_HOECHSTENS) return null;
  return [von, bis];
}

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
 *   tueren      je Ort { id, name, land, zustand, streift, spalt, naechste, danach, knapp, frisch, seit, abstand, vorn }, sortiert
 *               nach dem, was als Nächstes geschieht.
 *               zustand: 'offen' | 'zu' (Tür wechselt) | 'immer' | 'nie' (über die Vorausschau)
 *               spalt: höchste gemeinsame Höhe heute oder null
 *               naechste / danach: { was, tag, in, ungefaehr, von, bis, ms } oder null. tag ist ein
 *               Ortstag. von / bis: Zeitraum einer weichen Schwelle in Ortstagen oder null.
 *               knapp: heute offen und binnen KNAPP_TAGE zu oder vor Kurzem noch zu gewesen
 *               frisch: heute offen und an einem der letzten KNAPP_TAGE Tage zu gewesen
 *               seit: vor wie vielen Tagen sie zuletzt zu war (1 bis KNAPP_TAGE) oder null
 *               abstand: Tage bis zur nächsten Schließung oder seit, das kleinere; null ohne beides
 *               vorn: eine der höchstens VORN offenen Türen mit dem kleinsten abstand
 *   fahrplan    Treffen des Ortstags { ms, hoehe, tuer, knapp, vorn } nach Zeit, tuer zeigt in `tueren`
 *   morgen      erstes Treffen des nächsten Ortstags oder null
 *   morgenVorn  erstes Treffen des nächsten Ortstags mit einer vorderen Tür oder null
 *   heuteZu     Türen, deren letztes Treffen heute liegt (Datum fest, nicht "um den")
 *   heuteAuf    Türen, die heute zum ersten Mal wieder offen sind
 *   naechsteZu  die Tür, die als Nächste nach heute schließt, oder null
 *   naechsteAuf die geschlossene Tür, die als Nächste nach heute aufgeht, oder null (für die Polarnacht)
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
  const roh = [], morgige = [];

  for (const o of orte) {
    // Näher als das Band: Die Sonne steht für beide immer gleich hoch, soweit das Modell
    // unterscheiden kann. Das ist keine Tür (REGELN.md Abschnitt 4, Zusatz Lauf 8).
    if (abstandGrad(ich, o.ort) < BAND) { nachbarn.push({ id: o.id, name: o.name, land: o.land }); continue; }

    const t = tuer(ich, o.ort, start, tage);
    const eintrag = { id: o.id, name: o.name, land: o.land, zustand: t.art, streift: t.streift,
      spalt: null, naechste: null, danach: null, heuteAuf: false, knapp: false, frisch: false,
      seit: null, abstand: null, vorn: false };

    // Treffen des Ortstags und das erste von morgen, aus vier UTC-Tagen.
    const heutige = [];
    for (let n = n0 - 1; n <= n0 + 2; n++) {
      for (const m of treffenAmTag(ich, o.ort, n)) {
        const tag = ortstag(m.ms);
        if (tag === heute) heutige.push(m);
        else if (tag === heute + 1) {
          morgige.push({ ms: m.ms, hoehe: m.hoehe, eintrag });
          if (morgen === null || m.ms < morgen.ms) morgen = { ms: m.ms, hoehe: m.hoehe, eintrag };
        }
      }
    }
    for (const m of heutige) {
      if (eintrag.spalt === null || m.hoehe > eintrag.spalt) eintrag.spalt = m.hoehe;
      roh.push({ ms: m.ms, hoehe: m.hoehe, eintrag });
    }

    if (t.art === 'wechselt') {
      // Schwellen auf Ortstage umrechnen.
      const schwellen = [];
      let unten = null, oben = null;
      for (const s of t.schwellen) {
        const m = treffenAmTag(ich, o.ort, s.tag);
        if (!m.length) continue;
        const ms = s.was === 'zu' ? m[m.length - 1].ms : m[0].ms;
        const tag = ortstag(ms);
        let von = null, bis = null;
        if (s.ungefaehr) {
          unten ??= wechsel(t.spalt, start, MINDESTHOEHE - BAND);
          oben ??= wechsel(t.spalt, start, MINDESTHOEHE + BAND);
          const z = zeitraum(s, unten, oben);
          // Die Ränder wandern mit dem Tag der Schwelle vom UTC-Tag auf den Ortstag.
          if (z) { von = z[0] + tag - s.tag; bis = z[1] + tag - s.tag; }
        }
        schwellen.push({ was: s.was, tag, ungefaehr: s.ungefaehr, von, bis, ms });
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
      if (offen) {
        // War die Tür an einem der letzten KNAPP_TAGE Tage zu? Gezählt in UTC-Tagen, das reicht
        // für die Auswahl; ein Datum wird daraus nicht.
        for (let k = 1; k <= KNAPP_TAGE && !eintrag.frisch; k++) {
          const i = n0 - k - start;
          const sp = i >= 0 ? t.spalt[i] : spalt(ich, o.ort, deklination(n0 - k));
          if (!istOffen(sp, MINDESTHOEHE)) { eintrag.frisch = true; eintrag.seit = k; }
        }
        eintrag.knapp = eintrag.frisch || (eintrag.naechste !== null && eintrag.naechste.in <= KNAPP_TAGE);
        const bis = eintrag.naechste !== null ? eintrag.naechste.in : null;
        eintrag.abstand = bis === null ? eintrag.seit : eintrag.seit === null ? bis : Math.min(bis, eintrag.seit);
      }
    }
    tueren.push(eintrag);
  }

  // Sortiert nach dem, was als Nächstes geschieht. Türen ohne Ereignis ans Ende.
  const rang = (e) => e.naechste ? 0 : e.zustand === 'offen' || e.zustand === 'zu' ? 1 : e.zustand === 'immer' ? 2 : 3;
  tueren.sort((a, b) => rang(a) - rang(b) ||
    (a.naechste && b.naechste ? a.naechste.tag - b.naechste.tag : 0) ||
    (a.name < b.name ? -1 : a.name > b.name ? 1 : 0) || a.id - b.id);
  tueren.forEach((e, i) => { e.nr = i; });

  // Die vordersten: kleinster Abstand zuerst. Bei gleichem Abstand die Tür mit dem schmaleren
  // Spalt (sie hängt am dünneren Faden), dann die Kennung, damit die Auswahl feststeht.
  tueren.filter((e) => e.abstand !== null)
    .sort((a, b) => a.abstand - b.abstand || a.spalt - b.spalt || a.id - b.id)
    .slice(0, VORN).forEach((e) => { e.vorn = true; });

  const fahrplan = roh.sort((a, b) => a.ms - b.ms).map((m) => ({ ms: m.ms, hoehe: m.hoehe, tuer: m.eintrag.nr, knapp: m.eintrag.knapp, vorn: m.eintrag.vorn }));
  const zahlen = { offen: 0, zu: 0, immer: 0, nie: 0 };
  for (const e of tueren) zahlen[e.zustand]++;
  const schliesst = (e) => e.zustand === 'offen' && e.naechste;
  // Die Auswahl von heute gilt auch für das erste Treffen von morgen. Morgen wird neu gerechnet.
  let morgenVorn = null;
  for (const m of morgige) if (m.eintrag.vorn && (morgenVorn === null || m.ms < morgenVorn.ms)) morgenVorn = m;

  return {
    heute,
    polarnacht: mittagshoehe(ich, n0) < MINDESTHOEHE && fahrplan.length === 0,
    tueren, fahrplan,
    morgen: morgen ? { ms: morgen.ms, hoehe: morgen.hoehe, tuer: morgen.eintrag.nr, knapp: morgen.eintrag.knapp, vorn: morgen.eintrag.vorn } : null,
    morgenVorn: morgenVorn ? { ms: morgenVorn.ms, hoehe: morgenVorn.hoehe, tuer: morgenVorn.eintrag.nr, knapp: morgenVorn.eintrag.knapp, vorn: true } : null,
    heuteZu: tueren.filter((e) => schliesst(e) && e.naechste.in === 0 && !e.naechste.ungefaehr),
    heuteAuf: tueren.filter((e) => e.heuteAuf),
    naechsteZu: tueren.find((e) => schliesst(e) && e.naechste.in > 0) || null,
    naechsteAuf: tueren.find((e) => e.zustand === 'zu' && e.naechste) || null,
    nachbarn, zahlen,
  };
}

/**
 * Das nächste Treffen nach jetztMs aus einer Ansicht, für die oberste Zeile. Reihenfolge:
 * heute mit einer vorderen Tür, heute mit irgendeiner, morgen mit einer vorderen, morgen mit
 * irgendeiner, sonst null. Mit nurAlle = true zählt "vorn" nicht (alter Stand, für Tests).
 */
export function naechstesTreffen(a, jetztMs, nachlaufMs = 0, nurAlle = false) {
  const ab = jetztMs - nachlaufMs;
  if (!nurAlle) for (const m of a.fahrplan) if (m.vorn && m.ms >= ab) return m;
  for (const m of a.fahrplan) if (m.ms >= ab) return m;
  return (!nurAlle && a.morgenVorn) || a.morgen;
}
