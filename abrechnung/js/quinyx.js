// Liest den Quinyx-Stundenexport ("PunchedHours") aus den Zeilen des ersten
// Tabellenblatts (Array von Arrays, wie SheetJS sheet_to_json mit header: 1).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./zahlen.js'));
  else root.AbrQuinyx = factory(root.AbrZahlen);
})(typeof self !== 'undefined' ? self : this, function (Z) {
  'use strict';

  const SPALTEN = {
    datum: ['datum'],
    nummer: ['ausweisnummer', 'personalnummer', 'mitarbeiternummer'],
    vorname: ['vorname'],
    nachname: ['nachname'],
    schichttyp: ['schichttyp'],
    stempelzeit: ['stempelzeit'],
    gestempelt: ['gestempelt'],
    abwesenheit: ['abwesenheit'],
    produktiv: ['produktive gestempelte stunden'],
    unproduktiv: ['unproduktive gestempelte stunden'],
    urlaubTage: ['urlaub'],
    krankTage: ['krankheit'],
  };
  const PFLICHT = { datum: 'Datum', nummer: 'Ausweisnummer', gestempelt: 'Gestempelt' };
  const SUMMEN_TEXTE = ['total', 'summe', 'gesamt', 'gesamtsumme'];
  const BESTAETIGUNG = /best[äa]tig|genehmig|attestiert|freigegeben|approved/i;

  function normiere(text) {
    return String(text).replace(/\s+/g, ' ').trim().replace(/:$/, '').trim().toLowerCase();
  }

  function zweistellig(n) {
    return String(n).padStart(2, '0');
  }

  // Datumszelle als "YYYY-MM-DD" oder null.
  function datumAusZelle(wert) {
    if (typeof wert === 'string') {
      const text = wert.trim();
      return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
    }
    if (wert instanceof Date && !Number.isNaN(wert.getTime())) {
      return `${wert.getFullYear()}-${zweistellig(wert.getMonth() + 1)}-${zweistellig(wert.getDate())}`;
    }
    if (typeof wert === 'number' && wert > 20000 && wert < 80000 && Number.isInteger(wert)) {
      const d = new Date(Date.UTC(1899, 11, 30) + wert * 86400000);
      return `${d.getUTCFullYear()}-${zweistellig(d.getUTCMonth() + 1)}-${zweistellig(d.getUTCDate())}`;
    }
    return null;
  }

  function letzterTag(jahr, monat) {
    return new Date(Date.UTC(jahr, monat, 0)).getUTCDate();
  }

  function minutenSeitEpoche(datum, std, min) {
    const [j, m, t] = datum.split('-').map(Number);
    return Date.UTC(j, m - 1, t, std, min) / 60000;
  }

  // "2026-08-02 16:00 - 2026-08-02 18:38\n2026-08-02 19:10 - 2026-08-03 00:00"
  function parseStempelzeit(text) {
    const ergebnis = { intervalle: [], pausen: [], rohMinuten: 0, fehler: null };
    if (typeof text !== 'string' || text.trim() === '') return ergebnis;
    const muster = /^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})$/;
    for (const teil of text.split(/\r?\n/).map((t) => t.trim()).filter(Boolean)) {
      const m = muster.exec(teil);
      if (!m) {
        ergebnis.fehler = `Stempelintervall „${teil}“ ist nicht lesbar.`;
        return ergebnis;
      }
      const start = minutenSeitEpoche(m[1], +m[2], +m[3]);
      const ende = minutenSeitEpoche(m[4], +m[5], +m[6]);
      if (ende < start) {
        ergebnis.fehler = `Stempelintervall „${teil}“ endet vor seinem Beginn.`;
        return ergebnis;
      }
      ergebnis.intervalle.push({ von: `${m[2].padStart(2, '0')}:${m[3]}`, bis: `${m[5].padStart(2, '0')}:${m[6]}`, start, ende, minuten: ende - start });
    }
    ergebnis.intervalle.sort((a, b) => a.start - b.start);
    for (let i = 0; i < ergebnis.intervalle.length; i++) {
      const iv = ergebnis.intervalle[i];
      ergebnis.rohMinuten += iv.minuten;
      if (i > 0) {
        const vorher = ergebnis.intervalle[i - 1];
        if (iv.start < vorher.ende) {
          ergebnis.fehler = 'Stempelintervalle überschneiden sich.';
          return ergebnis;
        }
        if (iv.start > vorher.ende) ergebnis.pausen.push({ von: vorher.bis, bis: iv.von, minuten: iv.start - vorher.ende });
      }
    }
    return ergebnis;
  }

  function leer(wert) {
    return wert === null || wert === undefined || (typeof wert === 'string' && wert.trim() === '');
  }

  function parseQuinyx(rows, optionen) {
    const zeilenOffset = (optionen && optionen.zeilenOffset) || 0;
    const spaltenOffset = (optionen && optionen.spaltenOffset) || 0;
    const ergebnis = {
      quelle: 'quinyx',
      nichtPruefbar: [],
      klaerungen: [],
      hinweise: [],
      zeitraum: null,
      person: null,
      gehaltstypen: [],
      bestaetigung: null,
      tage: [],
      summen: null,
      summenzeile: null,
    };
    const zeileNr = (i) => i + 1 + zeilenOffset;
    const fundstelle = (i, spalte) =>
      spalte === undefined || spalte < 0
        ? `Quinyx Zeile ${zeileNr(i)}`
        : `Quinyx Zeile ${zeileNr(i)}, Spalte ${Z.spaltenBuchstabe(spalte + spaltenOffset)}`;

    if (!Array.isArray(rows) || rows.every((r) => !Array.isArray(r) || r.every(leer))) {
      ergebnis.nichtPruefbar.push('Der Quinyx-Export ist leer.');
      return ergebnis;
    }

    // Kopfzeile suchen
    let kopf = -1;
    for (let i = 0; i < Math.min(rows.length, 30); i++) {
      const r = rows[i];
      if (Array.isArray(r) && r.some((c) => typeof c === 'string' && normiere(c) === 'datum')) {
        kopf = i;
        break;
      }
    }
    if (kopf === -1) {
      ergebnis.nichtPruefbar.push('Im Quinyx-Export wurde keine Kopfzeile mit der Spalte „Datum“ gefunden. Unterstützt wird der Stundenexport „PunchedHours“ als XLSX.');
      return ergebnis;
    }

    const kopfzeile = rows[kopf].map((c) => (c === null || c === undefined ? '' : normiere(c)));
    const spalte = {};
    for (const [schluessel, namen] of Object.entries(SPALTEN)) {
      spalte[schluessel] = kopfzeile.findIndex((h) => namen.includes(h));
    }
    kopfzeile.forEach((h, index) => {
      const m = /^(\d{3})\s+(.+)$/.exec(h);
      if (m) ergebnis.gehaltstypen.push({ code: m[1], titel: String(rows[kopf][index]).replace(/\s+/g, ' ').trim(), index });
      if (BESTAETIGUNG.test(h) && !ergebnis.bestaetigung) ergebnis.bestaetigung = { index, titel: String(rows[kopf][index]).trim() };
    });
    const lohn300 = ergebnis.gehaltstypen.find((g) => g.code === '300');

    const fehlend = Object.entries(PFLICHT).filter(([k]) => spalte[k] === -1).map(([, name]) => name);
    if (!lohn300) fehlend.push('300 Stundenlohn');
    if (fehlend.length) {
      ergebnis.nichtPruefbar.push(`Im Quinyx-Export fehlen Pflichtspalten: ${fehlend.join(', ')}.`);
      return ergebnis;
    }
    ergebnis.spalten = spalte;

    // Berichtszeitraum aus den Zeilen über der Kopfzeile ("Bericht 2026-08-01 - 2026-08-31")
    for (let i = 0; i < kopf; i++) {
      const text = (rows[i] || []).filter((c) => typeof c === 'string').join(' ');
      const m = /(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})/.exec(text);
      if (m) {
        ergebnis.zeitraum = { von: m[1], bis: m[2], quelle: 'Berichtskopf', zeile: zeileNr(i) };
        break;
      }
    }

    const zahl = (row, i, index, titel) => {
      if (index === -1 || index === undefined) return null;
      const wert = Z.zelleZuHundertstel(row[index]);
      if (Number.isNaN(wert)) {
        ergebnis.klaerungen.push({
          titel: 'Unlesbarer Zellwert',
          text: `Der Wert „${String(row[index])}“ in der Spalte „${titel}“ ist keine Zahl und wurde nicht mitgezählt.`,
          fundstelle: fundstelle(i, index),
        });
        return null;
      }
      return wert;
    };

    const gesehen = new Map();
    const nummern = new Set();
    for (let i = kopf + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!Array.isArray(row) || row.every(leer)) continue;
      const datum = datumAusZelle(row[spalte.datum]);

      if (!datum) {
        const istSumme = row.some((c) => typeof c === 'string' && SUMMEN_TEXTE.includes(normiere(c)));
        if (istSumme) {
          if (ergebnis.summenzeile) {
            ergebnis.klaerungen.push({ titel: 'Mehrere Summenzeilen', text: 'Der Export enthält mehr als eine Summenzeile. Nur die erste wurde gegengerechnet.', fundstelle: fundstelle(i) });
          } else {
            ergebnis.summenzeile = { i, zeile: zeileNr(i), row };
          }
        } else {
          const relevant = [spalte.gestempelt, lohn300.index].some((idx) => !leer(row[idx]));
          if (relevant) {
            ergebnis.klaerungen.push({ titel: 'Zeile ohne Datum', text: 'Diese Zeile enthält Stundenwerte, aber kein Datum und ist keine Summenzeile. Sie wurde nicht mitgezählt.', fundstelle: fundstelle(i) });
          }
        }
        continue;
      }

      const schluessel = JSON.stringify(row);
      if (gesehen.has(schluessel)) {
        ergebnis.klaerungen.push({
          titel: 'Doppelter Datensatz',
          text: `Die Zeile für den ${Z.formatDatum(datum)} ist identisch mit Zeile ${zeileNr(gesehen.get(schluessel))}. Sie wurde nur einmal gezählt.`,
          fundstelle: fundstelle(i),
        });
        continue;
      }
      gesehen.set(schluessel, i);

      const nummer = leer(row[spalte.nummer]) ? null : String(row[spalte.nummer]).trim();
      if (nummer) nummern.add(nummer.replace(/^0+/, ''));
      if (!ergebnis.person && nummer) {
        const vorname = spalte.vorname >= 0 && !leer(row[spalte.vorname]) ? String(row[spalte.vorname]).trim() : '';
        const nachname = spalte.nachname >= 0 && !leer(row[spalte.nachname]) ? String(row[spalte.nachname]).trim() : '';
        ergebnis.person = { nummer: nummer.replace(/^0+/, ''), vorname, nachname, name: `${vorname} ${nachname}`.trim() };
      }

      const stempelText = spalte.stempelzeit >= 0 && typeof row[spalte.stempelzeit] === 'string' ? row[spalte.stempelzeit] : '';
      const stempel = parseStempelzeit(stempelText);
      const tag = {
        datum,
        i,
        zeile: zeileNr(i),
        schichttyp: spalte.schichttyp >= 0 && !leer(row[spalte.schichttyp]) ? String(row[spalte.schichttyp]).trim() : '',
        stempelText,
        intervalle: stempel.intervalle,
        pausen: stempel.pausen,
        rohMinuten: stempel.rohMinuten,
        stempelFehler: stempel.fehler,
        gestempelt: zahl(row, i, spalte.gestempelt, 'Gestempelt'),
        lohn300: zahl(row, i, lohn300.index, lohn300.titel),
        produktiv: zahl(row, i, spalte.produktiv, 'Produktive gestempelte Stunden'),
        unproduktiv: zahl(row, i, spalte.unproduktiv, 'Unproduktive gestempelte Stunden'),
        abwesenheit: zahl(row, i, spalte.abwesenheit, 'Abwesenheit'),
        urlaubTage: zahl(row, i, spalte.urlaubTage, 'Urlaub'),
        krankTage: zahl(row, i, spalte.krankTage, 'Krankheit'),
        gehaltstypen: {},
        bestaetigt: ergebnis.bestaetigung ? row[ergebnis.bestaetigung.index] : undefined,
      };
      for (const g of ergebnis.gehaltstypen) tag.gehaltstypen[g.code] = zahl(row, i, g.index, g.titel);
      ergebnis.tage.push(tag);
    }

    if (ergebnis.tage.length === 0) {
      ergebnis.nichtPruefbar.push('Der Quinyx-Export enthält keine Tageszeilen. Ein leerer Bericht kann nicht geprüft werden.');
      return ergebnis;
    }
    if (nummern.size > 1) {
      ergebnis.nichtPruefbar.push(`Der Quinyx-Export enthält ${nummern.size} verschiedene Ausweisnummern. Pro Prüfung wird genau eine Person unterstützt; bitte einen Export nur für dich selbst verwenden.`);
      return ergebnis;
    }
    if (!ergebnis.person) {
      ergebnis.nichtPruefbar.push('Im Quinyx-Export ist keine Ausweisnummer eingetragen.');
      return ergebnis;
    }

    // Zeitraum prüfen: genau ein Kalendermonat
    if (ergebnis.zeitraum) {
      const [vj, vm, vt] = ergebnis.zeitraum.von.split('-').map(Number);
      const [bj, bm, bt] = ergebnis.zeitraum.bis.split('-').map(Number);
      if (vj !== bj || vm !== bm || vt !== 1 || bt !== letzterTag(bj, bm)) {
        ergebnis.nichtPruefbar.push(`Der Quinyx-Bericht umfasst ${Z.formatDatum(ergebnis.zeitraum.von)} bis ${Z.formatDatum(ergebnis.zeitraum.bis)}. Pro Prüfung wird genau ein vollständiger Kalendermonat unterstützt.`);
        return ergebnis;
      }
      ergebnis.zeitraum.monat = `${vj}-${zweistellig(vm)}`;
    } else {
      const monate = new Set(ergebnis.tage.map((t) => t.datum.slice(0, 7)));
      if (monate.size > 1) {
        ergebnis.nichtPruefbar.push('Die Tageszeilen des Quinyx-Exports stammen aus mehreren Monaten. Pro Prüfung wird genau ein Monat unterstützt.');
        return ergebnis;
      }
      const monat = [...monate][0];
      ergebnis.zeitraum = { monat, quelle: 'Tageszeilen' };
      ergebnis.hinweise.push('Der Export enthält keinen Berichtszeitraum. Der Monat wurde aus den Tageszeilen abgeleitet; ob der Export den ganzen Monat umfasst, lässt sich nicht nachweisen.');
      ergebnis.klaerungen.push({ titel: 'Berichtszeitraum fehlt', text: 'Ohne Berichtszeitraum lässt sich nicht belegen, dass der Export den vollständigen Monat enthält.', fundstelle: 'Quinyx Kopfbereich' });
    }
    for (const tag of ergebnis.tage) {
      if (tag.datum.slice(0, 7) !== ergebnis.zeitraum.monat) {
        ergebnis.klaerungen.push({ titel: 'Tag außerhalb des Berichtsmonats', text: `Die Zeile für den ${Z.formatDatum(tag.datum)} liegt außerhalb des Berichtszeitraums.`, fundstelle: fundstelle(tag.i) });
      }
    }

    // Summen unabhängig aus den Tageszeilen
    const summe = (f) => ergebnis.tage.reduce((s, t) => s + (f(t) || 0), 0);
    ergebnis.summen = {
      gestempelt: summe((t) => t.gestempelt),
      lohn300: summe((t) => t.lohn300),
      urlaubTage: spalte.urlaubTage >= 0 ? summe((t) => t.urlaubTage) : null,
      krankTage: spalte.krankTage >= 0 ? summe((t) => t.krankTage) : null,
      gehaltstypen: {},
    };
    for (const g of ergebnis.gehaltstypen) ergebnis.summen.gehaltstypen[g.code] = summe((t) => t.gehaltstypen[g.code]);

    // Summenzeile des Exports gegenrechnen
    if (ergebnis.summenzeile) {
      const pruefen = [
        { titel: 'Gestempelt', index: spalte.gestempelt, wert: ergebnis.summen.gestempelt },
        ...ergebnis.gehaltstypen.map((g) => ({ titel: g.titel, index: g.index, wert: ergebnis.summen.gehaltstypen[g.code] })),
      ];
      if (spalte.urlaubTage >= 0) pruefen.push({ titel: 'Urlaub (Tage)', index: spalte.urlaubTage, wert: ergebnis.summen.urlaubTage });
      if (spalte.krankTage >= 0) pruefen.push({ titel: 'Krankheit (Tage)', index: spalte.krankTage, wert: ergebnis.summen.krankTage });
      const sz = ergebnis.summenzeile;
      sz.vergleiche = pruefen.map((p) => {
        const export_ = Z.zelleZuHundertstel(sz.row[p.index]);
        return {
          titel: p.titel,
          fundstelle: fundstelle(sz.i, p.index),
          export: export_,
          berechnet: p.wert,
          stimmt: (export_ === null ? 0 : export_) === p.wert,
        };
      });
      delete sz.row;
    } else {
      ergebnis.hinweise.push('Der Export enthält keine Summenzeile. Die Summen wurden nur aus den Tageszeilen gebildet.');
    }

    return ergebnis;
  }

  return { parseQuinyx, parseStempelzeit, datumAusZelle };
});
