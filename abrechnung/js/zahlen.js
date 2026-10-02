// Ganzzahlige Rechenhilfen. Stunden, Tage, Prozent und Euro werden intern als
// Hundertstel geführt (7,47 h = 747, 91,94 € = 9194), damit keine
// Gleitkommafehler in Vergleiche oder Summen geraten.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AbrZahlen = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DE_ZAHL = /^(-)?(\d{1,3}(?:\.\d{3})+|\d+),(\d{2})(-)?$/;

  // "1.234,56", "23,16-" oder "-4,00" in Hundertstel. Kein Treffer -> null.
  function deZuHundertstel(text) {
    if (typeof text !== 'string') return null;
    const m = text.trim().match(DE_ZAHL);
    if (!m || (m[1] && m[4])) return null;
    const wert = parseInt(m[2].replace(/\./g, ''), 10) * 100 + parseInt(m[3], 10);
    return m[1] || m[4] ? -wert : wert;
  }

  // XLSX-Zellwert in Hundertstel. Leere Zelle -> null, unlesbarer Wert -> NaN.
  function zelleZuHundertstel(wert) {
    if (wert === null || wert === undefined) return null;
    if (typeof wert === 'number') return Number.isFinite(wert) ? Math.round(wert * 100) : NaN;
    if (typeof wert !== 'string') return NaN;
    const text = wert.trim();
    if (text === '') return null;
    const de = deZuHundertstel(text);
    if (de !== null) return de;
    if (/^-?\d+(\.\d+)?$/.test(text)) return Math.round(parseFloat(text) * 100);
    if (/^-?\d+,\d+$/.test(text)) return Math.round(parseFloat(text.replace(',', '.')) * 100);
    return NaN;
  }

  // Ganzzahlige Division mit kaufmännischer Rundung (ab ,5 vom Nullpunkt weg).
  function rundeKaufmaennisch(zaehler, nenner) {
    const vorzeichen = zaehler < 0 ? -1 : 1;
    const betrag = Math.abs(zaehler);
    let quotient = Math.floor(betrag / nenner);
    if (2 * (betrag - quotient * nenner) >= nenner) quotient += 1;
    return vorzeichen * quotient;
  }

  // Positionsbetrag in Cent aus Menge (Hundertstel), Satz (Cent) und optional
  // Prozentsatz (Hundertstel Prozent), kaufmännisch auf Cent gerundet.
  function positionsBetrag(mengeH, satzC, prozentH) {
    if (prozentH === null || prozentH === undefined) {
      return rundeKaufmaennisch(mengeH * satzC, 100);
    }
    return rundeKaufmaennisch(mengeH * satzC * prozentH, 1000000);
  }

  // Exakte Minuten in Hundertstelstunden, kaufmännisch gerundet (448 min -> 747).
  function minutenZuHundertstel(minuten) {
    return rundeKaufmaennisch(minuten * 100, 60);
  }

  const zahlFormat = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function format(hundertstel) {
    if (hundertstel === null || hundertstel === undefined || Number.isNaN(hundertstel)) return '–';
    return zahlFormat.format(hundertstel / 100);
  }

  const formatStunden = (h) => `${format(h)} h`;
  const formatTage = (h) => `${format(h)} ${h === 100 ? 'Tag' : 'Tage'}`;
  const formatEuro = (c) => `${format(c)} €`;

  function formatMinuten(minuten) {
    const std = Math.floor(minuten / 60);
    const min = minuten % 60;
    return min ? `${std} Std. ${min} Min.` : `${std} Std.`;
  }

  // "2026-08-03" -> "03.08.2026"
  function formatDatum(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? `${m[3]}.${m[2]}.${m[1]}` : String(iso);
  }

  const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August',
    'September', 'Oktober', 'November', 'Dezember'];

  // "2026-08" -> "August 2026"
  function formatMonat(monat) {
    const m = /^(\d{4})-(\d{2})$/.exec(monat || '');
    return m ? `${MONATE[parseInt(m[2], 10) - 1]} ${m[1]}` : String(monat);
  }

  // 0 -> "A", 20 -> "U", 26 -> "AA"
  function spaltenBuchstabe(index) {
    let n = index + 1;
    let text = '';
    while (n > 0) {
      const rest = (n - 1) % 26;
      text = String.fromCharCode(65 + rest) + text;
      n = Math.floor((n - 1) / 26);
    }
    return text;
  }

  return {
    deZuHundertstel,
    zelleZuHundertstel,
    rundeKaufmaennisch,
    positionsBetrag,
    minutenZuHundertstel,
    format,
    formatStunden,
    formatTage,
    formatEuro,
    formatMinuten,
    formatDatum,
    formatMonat,
    spaltenBuchstabe,
  };
});
