// Sonnentür: die Seite. Holt die Ortsliste (eigene Datei, keine fremde Adresse), lässt
// ansicht.mjs rechnen und schreibt das Ergebnis in die Seite. Stand Bauschritt 4: Ortswahl.
// Ohne gewählten Ort rechnet die Seite für Berlin und sagt, dass das ein Beispiel ist.

import { tagnummer, datum, MINDESTHOEHE, VORAUSSCHAU } from './rechnung.mjs';
import { ansicht, naechstesTreffen } from './ansicht.mjs';
import { suche, koordinaten, standort, gradteile, alsText, ausText } from './ortswahl.mjs';
import { satz } from './texte.mjs';

const BERLIN_ID = 2950159;      // GeoNames-Kennung, der Ort selbst kommt aus orte.json
const NACHLAUF_MS = 2 * 60000;  // ein Treffen gilt zwei Minuten lang als "jetzt"
const ERSTE_TUEREN = 24;

const $ = (id) => document.getElementById(id);
const neu = (art, klasse, text) => {
  const e = document.createElement(art);
  if (klasse) e.className = klasse;
  if (text !== undefined) e.textContent = text;
  return e;
};

// Der Speicher im Browser darf fehlen (REGELN.md Abschnitt 9, Punkt 5).
const merke = {
  lies(k) { try { return localStorage.getItem(k); } catch { return null; } },
  schreib(k, v) { try { localStorage.setItem(k, v); } catch { /* dann eben nicht */ } },
  vergiss(k) { try { localStorage.removeItem(k); } catch { /* dann eben nicht */ } },
};

let sprache = merke.lies('sonnentuer.sprache') ||
  ((navigator.language || 'de').toLowerCase().startsWith('de') ? 'de' : 'en');
if (sprache !== 'de' && sprache !== 'en') sprache = 'de';

let daten = null, ich = null, orte = null, bild = null;
let wahl = null;      // gewählter Ort { art, name, land, ort } oder null für das Beispiel Berlin
let berlin = null;    // der Beispielort aus orte.json
let meldung = '';     // Schlüssel der Meldung in der Ortswahl oder ''
let anfrage = 0;      // zählt jede Ortswahl und jede Standortabfrage; eine späte Antwort des Geräts gilt nur, wenn sich nichts getan hat

const t = (k, w) => satz(sprache, k, w);
const ortstag = (ms) => { const d = new Date(ms); return tagnummer(d.getFullYear(), d.getMonth() + 1, d.getDate()); };
const uhr = (ms) => new Intl.DateTimeFormat(sprache, { hour: sprache === 'de' ? '2-digit' : 'numeric', minute: '2-digit' }).format(new Date(ms)) + (sprache === 'de' ? ' Uhr' : '');
const tagtext = (n) => {
  const d = datum(n);
  return new Intl.DateTimeFormat(sprache, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(d.jahr, d.monat - 1, d.tag)));
};
const grad = (h) => Math.floor(h); // abgerundet, damit nie mehr dasteht, als gerechnet ist
const ortsname = (e) => e.name;
const zahltext = (x) => new Intl.NumberFormat(sprache, { maximumFractionDigits: 2 }).format(x);

// Wann eine Schwelle liegt: festes Datum, Zeitraum (bei 4,5° und 5,5° gerechnet) oder "um den".
const wannwerte = (n) => ({ datum: tagtext(n.tag), tage: n.in, von: n.von === null ? '' : tagtext(n.von), bis: n.bis === null ? '' : tagtext(n.bis) });

/** Was an einer Tür als Nächstes geschieht, als Satzteil. Für die Zeile der Tür und die oberste Zeile. */
function schwellentext(n) {
  const w = wannwerte(n);
  if (n.was === 'zu') {
    if (n.von !== null) return t('schliesst_zwischen', w);
    if (n.ungefaehr) return t('schliesst_um', w);
    return n.in === 0 ? t('schliesst_heute') : n.in === 1 ? t('schliesst_morgen', w) : t('schliesst_in', w);
  }
  if (n.von !== null) return t('auf_zwischen', w);
  if (n.ungefaehr) return t('auf_um', w);
  return n.in === 1 ? t('auf_morgen', w) : t('auf_in', w);
}

function festeTexte() {
  document.documentElement.lang = sprache;
  for (const e of document.querySelectorAll('[data-t]')) {
    e.textContent = t(e.dataset.t, { grad: MINDESTHOEHE, tage: VORAUSSCHAU, datum: daten ? isoText(daten.abgerufen) : '' });
  }
  maleOrt();
}

function maleOrt() {
  const zeile = $('ort-jetzt');
  if (!ich) { zeile.textContent = ''; return; }
  if (!wahl) zeile.textContent = t('ort_beispiel');
  else if (wahl.art === 'liste') zeile.textContent = t('ort_liste', { name: wahl.name, land: wahl.land });
  else {
    const g = gradteile(wahl.ort);
    const w = { breite: zahltext(g.breite), ns: t(g.nord ? 'nord' : 'sued'), laenge: zahltext(g.laenge), ow: t(g.ost ? 'ost' : 'west') };
    zeile.textContent = wahl.art === 'standort' ? t('ort_standort', w) : t('ort_koordinaten', w);
  }
  const offen = !$('ortswahl').hidden;
  $('ort-knopf').hidden = false;
  $('ort-knopf').textContent = offen ? t('ort_schliessen') : t('ort_aendern');
  $('ort-knopf').setAttribute('aria-expanded', String(offen));
  $('ort-zurueck').hidden = !wahl;
  $('ort-meldung').textContent = meldung ? t(meldung) : '';
  maleTreffer();
}

function maleTreffer() {
  const liste = $('ort-treffer');
  liste.replaceChildren();
  if (!daten) return;
  const eingabe = $('ort-suche').value;
  const treffer = suche(daten.orte, eingabe);
  for (const o of treffer) {
    const knopf = neu('button', 'treffer-knopf');
    knopf.type = 'button';
    knopf.append(neu('span', 'ort', o.name), ' ', neu('span', 'land', o.land));
    knopf.addEventListener('click', () => waehle({ art: 'liste', name: o.name, land: o.land, ort: o.ort }));
    const li = neu('li');
    li.append(knopf);
    liste.append(li);
  }
  if (!treffer.length && eingabe.trim().length >= 2) liste.append(neu('li', 'klein', t('ort_keiner')));
}

/** Neuer Ort (oder null für das Beispiel): merken, rechnen, malen. */
function waehle(neueWahl) {
  anfrage++;
  wahl = neueWahl;
  if (wahl) merke.schreib('sonnentuer.ort', alsText(wahl)); else merke.vergiss('sonnentuer.ort');
  ich = wahl ? wahl.ort : berlin.ort;
  meldung = '';
  $('ortswahl').hidden = true;
  $('ort-suche').value = '';
  rechne();
  male();
  $('ort-knopf').focus();
}

function ortswahlAnschliessen() {
  $('ort-knopf').addEventListener('click', () => {
    const kasten = $('ortswahl');
    kasten.hidden = !kasten.hidden;
    meldung = '';
    maleOrt();
    if (!kasten.hidden) $('ort-suche').focus();
  });
  $('ort-suche').addEventListener('input', maleTreffer);
  const nimm = () => {
    const k = koordinaten($('ort-breite').value, $('ort-laenge').value);
    if (!k) { meldung = 'ort_koordinaten_falsch'; maleOrt(); return; }
    waehle({ art: 'koordinaten', name: '', land: '', ort: k });
  };
  $('ort-nehmen').addEventListener('click', nimm);
  for (const id of ['ort-breite', 'ort-laenge']) $(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') nimm(); });
  $('ort-geraet').addEventListener('click', () => {
    // Nur auf diesen Tipp. Das Ergebnis wird gerundet, bevor irgendetwas damit geschieht.
    if (!navigator.geolocation) { meldung = 'ort_geraet_fehlt'; maleOrt(); return; }
    meldung = 'ort_geraet_sucht'; maleOrt();
    // Fund B, Lauf 9: Wählt der Besucher eine Stadt, während das Gerät noch sucht (bis 20
    // Sekunden), darf die späte Antwort seine Wahl nicht überschreiben.
    const meine = ++anfrage;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (meine !== anfrage) return;
        const k = standort(p.coords.latitude, p.coords.longitude);
        if (k) waehle({ art: 'standort', name: '', land: '', ort: k });
        else { meldung = 'ort_geraet_fehlt'; maleOrt(); }
      },
      () => { if (meine !== anfrage) return; meldung = 'ort_geraet_fehlt'; maleOrt(); },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 3600000 },
    );
  });
  $('ort-zurueck').addEventListener('click', () => waehle(null));
}

function isoText(iso) {
  const [j, m, d] = iso.split('-').map(Number);
  return tagtext(tagnummer(j, m, d)) + ' ' + j;
}

function tuerbild(e) {
  // Ein kleiner Türrahmen. Der helle Streifen ist der Spalt: je höher die gemeinsame Sonne, desto breiter.
  const rahmen = neu('span', 'tuer ' + (e.spalt === null ? 'tuer-zu' : 'tuer-offen'));
  rahmen.setAttribute('aria-hidden', 'true');
  if (e.spalt !== null) rahmen.style.setProperty('--spalt', Math.max(8, Math.min(100, Math.round(e.spalt / 60 * 100))) + '%');
  return rahmen;
}

function tuerzeile(e) {
  const li = neu('li', 'zeile');
  li.append(tuerbild(e));
  const text = neu('div', 'zeile-text');
  const kopf = neu('div', 'zeile-kopf');
  kopf.append(neu('span', 'ort', ortsname(e)), neu('span', 'land', e.land));
  if (e.streift) kopf.append(neu('span', 'marke', t('streift')));
  text.append(kopf);
  const teile = [];
  teile.push(e.spalt !== null ? t('spalt', { grad: grad(e.spalt) }) : t('zu'));
  const n = e.naechste;
  if (e.zustand === 'immer') teile.push(t('immer', { tage: VORAUSSCHAU }));
  else if (e.zustand === 'nie') teile.push(t('nie', { tage: VORAUSSCHAU }));
  else if (!n) teile.push(t('ohne_datum'));
  else teile.push(schwellentext(n));
  text.append(neu('div', 'zeile-fuss', teile.join(' · ')));
  li.append(text);
  return li;
}

function maleNaechstes() {
  const kasten = $('naechstes');
  kasten.replaceChildren();
  const jetzt = Date.now();
  if (bild.polarnacht) { kasten.append(neu('p', 'gross', t('polarnacht', { grad: MINDESTHOEHE }))); return; }
  const m = naechstesTreffen(bild, jetzt, NACHLAUF_MS);
  if (!m) { kasten.append(neu('p', 'gross', t('kein_treffen'))); return; }
  const e = bild.tueren[m.tuer], ort = ortsname(e), min = Math.round((m.ms - jetzt) / 60000);
  const morgen = m === bild.morgen || m === bild.morgenVorn;
  let kopf, fuss = t('dann', { grad: grad(m.hoehe), uhr: uhr(m.ms) });
  if (morgen) kopf = t('morgen_erst', { ort });
  else if (min <= 0) { kopf = t('jetzt', { ort }); fuss = t('jetzt_hoehe', { grad: grad(m.hoehe) }); }
  else if (min === 1) kopf = t('in_minute', { ort });
  else if (min < 60) kopf = t('in_minuten', { min, ort });
  else kopf = t('in_stunden', { std: Math.floor(min / 60), min: min % 60, ort });
  kasten.append(neu('p', 'gross', kopf), neu('p', 'klein', fuss));
  // Warum gerade dieses Treffen oben steht: Die Tür ist eine der vordersten (REGELN.md
  // Abschnitt 4). Genannt wird, was näher liegt: die Schließung oder das Aufgehen vor Kurzem.
  if (m.vorn) {
    const bald = e.naechste && (e.seit === null || e.naechste.in <= e.seit);
    kasten.append(neu('p', 'klein grund', t('grund_knapp', { ort, was: bald ? schwellentext(e.naechste) : t('frisch') })));
  }
}

function maleHeute() {
  const kasten = $('heute');
  kasten.replaceChildren();
  const jetzt = Date.now();
  for (const e of bild.heuteZu) {
    const ort = ortsname(e), vorbei = e.naechste.ms < jetzt - NACHLAUF_MS;
    const d = e.danach;
    const wieder = !d ? t('erst_wieder_offen', { tage: VORAUSSCHAU }) : d.von !== null ? t('erst_wieder_zwischen', wannwerte(d)) : t(d.ungefaehr ? 'erst_wieder_um' : 'erst_wieder', wannwerte(d));
    const p = neu('p', 'gross');
    p.append(vorbei ? t('heute_zu_vorbei', { ort, uhr: uhr(e.naechste.ms) }) : t('heute_zu', { ort }), ' ', neu('span', 'leiser', wieder));
    kasten.append(p);
  }
  if (!bild.heuteZu.length) {
    const p = neu('p', 'gross', t('keine_heute'));
    const n = bild.naechsteZu;
    if (n) {
      const w = { ort: ortsname(n), ...wannwerte(n.naechste) };
      p.append(' ', neu('span', 'leiser', n.naechste.von !== null ? t('naechste_zu_zwischen', w) : t(n.naechste.ungefaehr ? 'naechste_zu_um' : 'naechste_zu', w)));
    }
    kasten.append(p);
  }
  for (const e of bild.heuteAuf) kasten.append(neu('p', 'klein', t('heute_auf', { ort: ortsname(e) })));
}

function maleTueren() {
  $('zahlen').textContent = t('zahlen', bild.zahlen);
  const liste = $('tueren'), rest = $('tueren-rest'), mehr = $('tueren-mehr');
  liste.replaceChildren(...bild.tueren.slice(0, ERSTE_TUEREN).map(tuerzeile));
  rest.replaceChildren(...bild.tueren.slice(ERSTE_TUEREN).map(tuerzeile));
  mehr.hidden = bild.tueren.length <= ERSTE_TUEREN;
  $('tueren-mehr-text').textContent = t('alle_tueren', { zahl: bild.tueren.length });
  const nah = $('nachbarn');
  nah.hidden = !bild.nachbarn.length;
  nah.textContent = t('nachbarn', { orte: bild.nachbarn.map((o) => o.name).join(', ') });
}

function treffenzeile(m, jetzt) {
  const li = neu('li', m.ms < jetzt - NACHLAUF_MS ? 'vorbei' : '');
  li.append(neu('span', 'zeit', uhr(m.ms)), neu('span', 'ort', ortsname(bild.tueren[m.tuer])), neu('span', 'hoch', grad(m.hoehe) + '°'));
  return li;
}

function maleFahrplan() {
  const kasten = $('fahrplan'), knapp = $('fahrplan-knapp'), alle = $('fahrplan-alle');
  kasten.replaceChildren();
  knapp.replaceChildren();
  alle.hidden = !bild.fahrplan.length;
  $('fahrplan-knapp-text').hidden = !bild.fahrplan.length;
  if (!bild.fahrplan.length) { $('fahrplan-zahl').textContent = t('fahrplan_leer'); return; }
  $('fahrplan-zahl').textContent = t('fahrplan_zahl', { zahl: bild.fahrplan.length, orte: new Set(bild.fahrplan.map((m) => m.tuer)).size });
  const jetzt = Date.now();
  // Zuerst die Treffen der vordersten Türen, als kurze Liste. Darunter, auf Wunsch, alle Treffen,
  // nach Stunden gebündelt, weil ein Tag mehrere hundert hat.
  const knappe = bild.fahrplan.filter((m) => m.vorn);
  $('fahrplan-knapp-text').textContent = knappe.length ? t('fahrplan_knapp', { zahl: new Set(knappe.map((m) => m.tuer)).size }) : t('fahrplan_knapp_leer');
  knapp.append(...knappe.map((m) => treffenzeile(m, jetzt)));
  $('fahrplan-alle-text').textContent = t('fahrplan_alle', { zahl: bild.fahrplan.length });
  const stunden = new Map();
  for (const m of bild.fahrplan) {
    const s = new Date(m.ms).getHours();
    if (!stunden.has(s)) stunden.set(s, []);
    stunden.get(s).push(m);
  }
  const naechstes = bild.fahrplan.find((m) => m.ms >= jetzt - NACHLAUF_MS);
  for (const [, treffen] of stunden) {
    const d = neu('details', 'stunde');
    const anfang = new Date(treffen[0].ms); anfang.setMinutes(0, 0, 0);
    d.append(neu('summary', '', t('stunde', { uhr: uhr(anfang.getTime()), zahl: treffen.length })));
    const ol = neu('ol', 'treffen');
    ol.append(...treffen.map((m) => treffenzeile(m, jetzt)));
    d.append(ol);
    if (naechstes && treffen.includes(naechstes)) d.open = true;
    kasten.append(d);
  }
}

function rechne() {
  bild = ansicht(ich, orte, Date.now(), ortstag);
}

function male() {
  festeTexte();
  maleNaechstes(); maleHeute(); maleTueren(); maleFahrplan();
  $('laedt').hidden = true;
  $('inhalt').hidden = false;
}

function takt() {
  // Jede halbe Minute die Zeile oben. Wechselt der Kalendertag, wird alles neu gerechnet.
  if (!bild) return;
  if (ortstag(Date.now()) !== bild.heute) { rechne(); male(); } else { maleNaechstes(); maleHeute(); }
}

async function los() {
  festeTexte();
  $('sprache').addEventListener('click', () => {
    sprache = sprache === 'de' ? 'en' : 'de';
    merke.schreib('sonnentuer.sprache', sprache);
    if (bild) male(); else festeTexte();
  });
  try {
    const antwort = await fetch('orte.json');
    if (!antwort.ok) throw new Error(String(antwort.status));
    daten = await antwort.json();
    orte = daten.tueren.map((z) => ({ id: z[0], name: z[1], land: z[2], ort: [z[3], z[4]] }));
    berlin = orte.find((o) => o.id === BERLIN_ID);
    if (!berlin) throw new Error('Berlin fehlt in der Ortsliste');
    wahl = ausText(merke.lies('sonnentuer.ort'));
    ich = wahl ? wahl.ort : berlin.ort;
    ortswahlAnschliessen();
    rechne();
    male();
    setInterval(takt, 30000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) takt(); });
  } catch (fehler) {
    $('laedt').dataset.t = 'fehler';
    festeTexte();
    console.error(fehler);
  }
}

los();
