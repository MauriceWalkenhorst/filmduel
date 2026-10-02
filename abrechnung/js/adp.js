// Liest die ADP-Verdienstabrechnung aus den Textbausteinen von PDF.js.
// PDF.js liefert lose Textstücke mit Koordinaten; daraus werden zuerst echte
// Zeilen gebaut und erst danach die Lohnpositionen erkannt.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./zahlen.js'));
  else root.AbrAdp = factory(root.AbrZahlen);
})(typeof self !== 'undefined' ? self : this, function (Z) {
  'use strict';

  // seiten: [{ seite, items: [{ str, x, y }] }] -> [{ seite, text }]
  function zeilenAusPdf(seiten) {
    const zeilen = [];
    for (const { seite, items } of seiten) {
      const teile = items
        .filter((it) => typeof it.str === 'string' && it.str.trim() !== '')
        .sort((a, b) => b.y - a.y || a.x - b.x);
      let aktuell = null;
      for (const it of teile) {
        if (!aktuell || Math.abs(aktuell.y - it.y) > 2) {
          aktuell = { seite, y: it.y, teile: [] };
          zeilen.push(aktuell);
        }
        aktuell.teile.push(it);
      }
    }
    return zeilen.map((z) => ({
      seite: z.seite,
      text: z.teile
        .sort((a, b) => a.x - b.x)
        .map((t) => t.str.trim())
        .join(' ')
        .replace(/\s+/g, ' '),
    }));
  }

  const ZAHL = '-?\\d+(?:\\.\\d{3})*,\\d{2}-?';
  const KZ = '([LlSsEeGg]{2})';
  // F&B (Concession) 12300 6,25 ST 14,71 91,94 LL
  // -Nacht v. 24 Uhr 460 1,00 ST 50,00 14,71 7,36 GG
  const MIT_MENGE = new RegExp(`^(.+?)\\s+([a-z]{1,4})?(\\d{3,5})\\s+(${ZAHL})\\s+(ST|TG)\\s+(?:(${ZAHL})\\s+)?(${ZAHL})\\s+(${ZAHL})\\s+${KZ}(?:\\s|$)`);
  // Leistungsprämie 350 10,03 LL
  const NUR_BETRAG = new RegExp(`^(.+?)\\s+([a-z]{1,4})?(\\d{3,5})\\s+(${ZAHL})\\s+${KZ}(?:\\s|$)`);
  // -Nacht v. 24 Uhr pfl461 ll 3,68
  const KZ_VOR_BETRAG = new RegExp(`^(.+?)\\s+([a-z]{1,4})?(\\d{3,5})\\s+${KZ}\\s+(${ZAHL})(?:\\s|$)`);
  const NACHBERECHNUNG = /r[üu]ck(?:rechn|zahl|buch)|nachber|nachzahl|korrektur|storno|vormonat|differenz/i;
  const GESAMT_BRUTTO = new RegExp(`^GESAMT-BRUTTO\\s+\\d{3}\\s+(${ZAHL})`);

  const zahl = (text) => (text === undefined ? null : Z.deZuHundertstel(text));

  function parseAdp(zeilen) {
    const ergebnis = {
      quelle: 'adp',
      nichtPruefbar: [],
      klaerungen: [],
      hinweise: [],
      monat: null,
      monatText: null,
      person: null,
      positionen: [],
      unerkannt: [],
      gesamtBrutto: null,
    };
    const textGesamt = zeilen.map((z) => z.text).join(' ');
    if (textGesamt.replace(/\s/g, '').length < 20) {
      ergebnis.nichtPruefbar.push('Die PDF enthält keinen auslesbaren Text. Gescannte Abrechnungen (Bilder) werden nicht unterstützt; bitte die Original-PDF aus ADP verwenden.');
      return ergebnis;
    }

    // Kopfdaten je Seite: Abrechnungsmonat "08.26/1" und Personalnummer "RP/123456"
    const seiten = [...new Set(zeilen.map((z) => z.seite))];
    const monate = new Set();
    const nummern = new Set();
    for (const seite of seiten) {
      const seitenText = zeilen.filter((z) => z.seite === seite).map((z) => z.text).join('\n');
      const m = /\b(\d{2})\.(\d{2})\/\d+\b/.exec(seitenText);
      if (m && +m[1] >= 1 && +m[1] <= 12) {
        monate.add(`20${m[2]}-${m[1]}`);
        if (!ergebnis.monatText) ergebnis.monatText = `${m[1]}.${m[2]}`;
      }
      const p = /(?:^|\s)([A-Z]{1,4})\/(\d{3,10})\b/m.exec(seitenText);
      if (p) nummern.add(p[2].replace(/^0+/, ''));
    }
    if (monate.size === 0) ergebnis.nichtPruefbar.push('In der PDF wurde kein Abrechnungsmonat gefunden. Unterstützt wird die ADP-Verdienstabrechnung („Entgeltbescheinigung“).');
    if (monate.size > 1) ergebnis.nichtPruefbar.push('Die PDF enthält Abrechnungen für mehrere Monate. Bitte genau eine Monatsabrechnung auswählen.');
    if (nummern.size === 0) ergebnis.nichtPruefbar.push('In der PDF wurde keine Personalnummer gefunden.');
    if (nummern.size > 1) ergebnis.nichtPruefbar.push('Die PDF enthält Abrechnungen für mehrere Personen. Pro Prüfung wird genau eine Person unterstützt.');
    if (ergebnis.nichtPruefbar.length) return ergebnis;
    ergebnis.monat = [...monate][0];

    const nummer = [...nummern][0];
    const nrZeile = zeilen.findIndex((z) => new RegExp(`(?:^|\\s)[A-Z]{1,4}/0*${nummer}\\b`).test(z.text));
    let name = '';
    if (nrZeile >= 0 && zeilen[nrZeile + 1] && /^[A-Za-zÀ-ÖØ-öø-ÿß'.\- ]{3,60}$/.test(zeilen[nrZeile + 1].text)) {
      name = zeilen[nrZeile + 1].text.trim();
    }
    ergebnis.person = { nummer, name };

    // Positionsblock: ab der ersten erkannten Lohnposition bis GESAMT-BRUTTO
    let begonnen = false;
    for (const z of zeilen) {
      const text = z.text;
      const brutto = GESAMT_BRUTTO.exec(text);
      if (brutto) {
        ergebnis.gesamtBrutto = { betrag: zahl(brutto[1]), seite: z.seite, text };
        break;
      }
      if (/^[-=]{5,}$/.test(text)) continue;

      let pos = null;
      let m = MIT_MENGE.exec(text);
      if (m) {
        pos = {
          bezeichnung: m[1].trim(), praefix: m[2] || '', lohnart: m[3], menge: zahl(m[4]), einheit: m[5],
          prozent: zahl(m[6]), satz: zahl(m[7]), betrag: zahl(m[8]), kennzeichen: m[9],
        };
      } else if ((m = NUR_BETRAG.exec(text))) {
        pos = { bezeichnung: m[1].trim(), praefix: m[2] || '', lohnart: m[3], menge: null, einheit: null, prozent: null, satz: null, betrag: zahl(m[4]), kennzeichen: m[5] };
      } else if ((m = KZ_VOR_BETRAG.exec(text))) {
        pos = { bezeichnung: m[1].trim(), praefix: m[2] || '', lohnart: m[3], menge: null, einheit: null, prozent: null, satz: null, betrag: zahl(m[5]), kennzeichen: m[4] };
      }

      if (pos) {
        begonnen = true;
        pos.seite = z.seite;
        pos.text = text;
        pos.fundstelle = `ADP Seite ${z.seite}, Zeile „${text}“`;
        pos.grundlohn = pos.einheit === 'ST' && !pos.praefix && /^(\d{2})?300$/.test(pos.lohnart);
        pos.nachberechnung = NACHBERECHNUNG.test(text) || /\b\d{2}\.\d{2}\b/.test(pos.bezeichnung)
          || (pos.menge !== null && pos.menge < 0) || (pos.betrag !== null && pos.betrag < 0);
        ergebnis.positionen.push(pos);
      } else if (begonnen && /\d,\d{2}/.test(text)) {
        ergebnis.unerkannt.push({ text, seite: z.seite, nachberechnung: NACHBERECHNUNG.test(text), fundstelle: `ADP Seite ${z.seite}, Zeile „${text}“` });
      }
    }

    if (ergebnis.positionen.length === 0) {
      ergebnis.nichtPruefbar.push('In der PDF wurden keine Lohnpositionen erkannt. Das Format dieser Abrechnung wird nicht unterstützt.');
    }
    if (!ergebnis.gesamtBrutto) {
      ergebnis.hinweise.push('Die Zeile GESAMT-BRUTTO wurde nicht gefunden; das Gesamtbrutto konnte nicht gegengerechnet werden.');
    }
    return ergebnis;
  }

  return { zeilenAusPdf, parseAdp };
});
