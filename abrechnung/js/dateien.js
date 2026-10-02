// Liest die ausgewählten Dateien im Arbeitsspeicher. Die Bibliotheken werden
// als Parameter übergeben, damit dieselben Funktionen auch in den Tests laufen.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AbrDateien = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class LeseFehler extends Error {}

  function beginntMit(bytes, zeichen) {
    if (!bytes || bytes.length < zeichen.length) return false;
    for (let i = 0; i < zeichen.length; i++) if (bytes[i] !== zeichen.charCodeAt(i)) return false;
    return true;
  }

  // XLSX ist ein ZIP-Archiv ("PK"), PDF beginnt mit "%PDF" (eventuell nach wenigen Bytes Vorspann).
  const istXlsx = (bytes) => beginntMit(bytes, 'PK\u0003\u0004');
  function istPdf(bytes) {
    if (!bytes) return false;
    const kopf = Array.from(bytes.subarray(0, 1024), (b) => String.fromCharCode(b)).join('');
    return kopf.includes('%PDF-');
  }

  // -> { rows, zeilenOffset, spaltenOffset }
  function leseXlsx(bytes, XLSX) {
    if (!bytes || bytes.length === 0) throw new LeseFehler('Die Datei ist leer.');
    if (!istXlsx(bytes)) {
      throw new LeseFehler('Die Datei ist keine XLSX-Datei. Bitte den Quinyx-Stundenexport im Format XLSX auswählen.');
    }
    let mappe;
    try {
      mappe = XLSX.read(bytes, { type: 'array', cellDates: true, cellFormula: false, cellHTML: false, WTF: false });
    } catch (e) {
      throw new LeseFehler('Die XLSX-Datei ist beschädigt und konnte nicht gelesen werden.');
    }
    if (!mappe.SheetNames || mappe.SheetNames.length === 0) throw new LeseFehler('Die XLSX-Datei enthält kein Tabellenblatt.');
    const blatt = mappe.Sheets[mappe.SheetNames[0]];
    if (!blatt || !blatt['!ref']) return { rows: [], zeilenOffset: 0, spaltenOffset: 0 };
    const bereich = XLSX.utils.decode_range(blatt['!ref']);
    const rows = XLSX.utils.sheet_to_json(blatt, { header: 1, raw: true, defval: null, blankrows: true });
    return { rows, zeilenOffset: bereich.s.r, spaltenOffset: bereich.s.c };
  }

  // Liefert [{ seite, items: [{ str, x, y }] }]. Das PDF-Dokument und sein
  // Worker werden in jedem Fall wieder zerstört. merkeTask erhält die
  // laufende Ladeaufgabe, damit "Neue Prüfung" sie abbrechen kann.
  async function lesePdf(bytes, pdfjsLib, merkeTask) {
    if (!bytes || bytes.length === 0) throw new LeseFehler('Die Datei ist leer.');
    if (!istPdf(bytes)) {
      throw new LeseFehler('Die Datei ist keine PDF-Datei. Bitte die ADP-Verdienstabrechnung als PDF auswählen.');
    }
    const task = pdfjsLib.getDocument({
      data: bytes,
      isEvalSupported: false,
      disableFontFace: true,
      useSystemFonts: false,
      disableAutoFetch: true,
      disableStream: true,
      verbosity: 0,
    });
    if (merkeTask) merkeTask(task);
    let dokument = null;
    try {
      dokument = await task.promise;
      const seiten = [];
      for (let s = 1; s <= dokument.numPages; s++) {
        const seite = await dokument.getPage(s);
        const inhalt = await seite.getTextContent();
        seiten.push({
          seite: s,
          items: inhalt.items.filter((it) => 'str' in it).map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5] })),
        });
        seite.cleanup();
      }
      return seiten;
    } catch (e) {
      if (e && e.name === 'PasswordException') throw new LeseFehler('Die PDF ist passwortgeschützt und kann nicht gelesen werden.');
      if (e instanceof LeseFehler) throw e;
      if (task.destroyed) throw new LeseFehler('Das Einlesen wurde abgebrochen.');
      throw new LeseFehler('Die PDF-Datei ist beschädigt und konnte nicht gelesen werden.');
    } finally {
      await task.destroy();
    }
  }

  return { LeseFehler, istXlsx, istPdf, leseXlsx, lesePdf };
});
