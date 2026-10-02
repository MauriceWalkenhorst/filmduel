// Oberfläche. Alle Dateiinhalte werden ausschließlich als Text (textContent)
// eingesetzt. Es gibt keine Speicherung, keine Netzwerkanfragen und keine
// Konsolenausgaben mit Datei- oder Ergebnisinhalten.
(function () {
  'use strict';

  const Z = window.AbrZahlen;
  const Q = window.AbrQuinyx;
  const A = window.AbrAdp;
  const V = window.AbrVergleich;
  const D = window.AbrDateien;
  const $ = (id) => document.getElementById(id);

  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/libs/pdf.worker.min.js';

  const zustand = {
    quinyx: null,
    adp: null,
    lauf: { quinyx: 0, adp: 0 },
    pdfTask: null,
  };

  const STATUS = {
    abweichung: { text: 'Abweichung', symbol: 'kreuz' },
    klaerung: { text: 'Klärung nötig', symbol: 'ausrufe' },
    nicht_pruefbar: { text: 'Nicht prüfbar', symbol: 'gesperrt' },
    ok: { text: 'Stimmt', symbol: 'haken' },
    info: { text: 'Hinweis', symbol: 'info' },
  };

  const SYMBOLE = {
    haken: ['M20 6 9 17l-5-5'],
    kreuz: ['M18 6 6 18', 'M6 6l12 12'],
    ausrufe: ['M12 8v5', 'M12 16.5v.01', 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z'],
    gesperrt: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M5.7 5.7l12.6 12.6'],
    info: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 11v5', 'M12 7.5v.01'],
    pfeil: ['M6 9l6 6 6-6'],
  };

  function symbol(name, klasse) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', klasse || 'symbol');
    for (const d of SYMBOLE[name]) {
      const pfad = document.createElementNS(ns, 'path');
      pfad.setAttribute('d', d);
      svg.appendChild(pfad);
    }
    return svg;
  }

  // Element mit Text- oder Kindknoten; Strings werden immer als Text eingefügt.
  function el(tag, attribute, ...kinder) {
    const knoten = document.createElement(tag);
    for (const [k, v] of Object.entries(attribute || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') knoten.className = v;
      else knoten.setAttribute(k, v === true ? '' : v);
    }
    for (const kind of kinder.flat()) {
      if (kind === null || kind === undefined || kind === false) continue;
      knoten.appendChild(typeof kind === 'string' ? document.createTextNode(kind) : kind);
    }
    return knoten;
  }

  function ansagen(text) {
    const ansage = $('ansage');
    ansage.textContent = '';
    window.setTimeout(() => { ansage.textContent = text; }, 50);
  }

  // ---------- Dateien ----------

  function setzeFeld(art, zustandName, dateiname, statusText) {
    $(`feld-${art}`).dataset.zustand = zustandName;
    $(`aktion-${art}`).textContent = dateiname ? 'Andere Datei wählen' : 'Datei auswählen';
    $(`name-${art}`).textContent = dateiname || 'oder hierher ziehen';
    $(`status-${art}`).textContent = statusText;
  }

  function zeigeErkannt(art, daten) {
    const liste = $(`erkannt-${art}`);
    liste.replaceChildren();
    if (!daten || daten.nichtPruefbar.length) {
      liste.hidden = true;
      return;
    }
    const eintraege = [];
    if (art === 'quinyx') {
      eintraege.push(['Monat', Z.formatMonat(daten.zeitraum.monat)]);
      eintraege.push(['Person', [daten.person.name, `Ausweisnr. ${daten.person.nummer}`].filter(Boolean).join(', ')]);
      eintraege.push(['Inhalt', `${daten.tage.length} Tageszeilen, ${Z.formatStunden(daten.summen.lohn300)} Lohnart 300`]);
    } else {
      eintraege.push(['Monat', Z.formatMonat(daten.monat)]);
      eintraege.push(['Person', [daten.person.name, `Personalnr. ${daten.person.nummer}`].filter(Boolean).join(', ')]);
      const grundlohn = daten.positionen.filter((p) => p.grundlohn);
      eintraege.push(['Inhalt', `${daten.positionen.length} Lohnpositionen, davon ${grundlohn.length} Grundlohn`]);
    }
    for (const [titel, wert] of eintraege) liste.append(el('dt', null, titel), el('dd', null, wert));
    liste.hidden = false;
  }

  async function verarbeite(art, datei) {
    const nr = ++zustand.lauf[art];
    zustand[art] = null;
    verbergeErgebnis();
    aktualisiere();
    if (art === 'adp' && zustand.pdfTask) {
      zustand.pdfTask.destroy();
      zustand.pdfTask = null;
    }
    setzeFeld(art, 'laedt', datei.name, 'Wird eingelesen …');
    zeigeErkannt(art, null);

    let daten;
    try {
      const bytes = new Uint8Array(await datei.arrayBuffer());
      if (nr !== zustand.lauf[art]) return;
      if (art === 'quinyx') {
        const gelesen = D.leseXlsx(bytes, window.XLSX);
        daten = Q.parseQuinyx(gelesen.rows, gelesen);
      } else {
        const seiten = await D.lesePdf(bytes, window.pdfjsLib, (task) => { zustand.pdfTask = task; });
        zustand.pdfTask = null;
        daten = A.parseAdp(A.zeilenAusPdf(seiten));
      }
    } catch (fehler) {
      daten = {
        nichtPruefbar: [fehler instanceof D.LeseFehler ? fehler.message : 'Die Datei konnte nicht gelesen werden.'],
        klaerungen: [],
        hinweise: [],
      };
    }
    if (nr !== zustand.lauf[art]) return;

    zustand[art] = daten;
    if (daten.nichtPruefbar.length) {
      setzeFeld(art, 'fehler', datei.name, `Nicht prüfbar: ${daten.nichtPruefbar[0]}`);
    } else {
      setzeFeld(art, 'bereit', datei.name, 'Eingelesen');
    }
    zeigeErkannt(art, daten);
    aktualisiere();
  }

  function aktualisiere() {
    const q = zustand.quinyx;
    const a = zustand.adp;
    $('pruefen').disabled = !(q && a);

    const box = $('abgleich');
    const hinweise = [];
    if (q && a && !q.nichtPruefbar.length && !a.nichtPruefbar.length) {
      if (q.person.nummer !== a.person.nummer) hinweise.push(`Die Dateien gehören zu verschiedenen Personen (${q.person.nummer} und ${a.person.nummer}).`);
      if (q.zeitraum.monat !== a.monat) hinweise.push(`Die Dateien betreffen verschiedene Monate (${Z.formatMonat(q.zeitraum.monat)} und ${Z.formatMonat(a.monat)}).`);
    }
    box.replaceChildren();
    if (hinweise.length) {
      box.append(symbol('ausrufe'), el('p', null, `${hinweise.join(' ')} Die Prüfung wird in diesem Fall angehalten.`));
      box.hidden = false;
    } else {
      box.hidden = true;
    }
  }

  function verbergeErgebnis() {
    const bereich = $('ergebnis');
    bereich.replaceChildren();
    bereich.hidden = true;
  }

  function zuruecksetzen() {
    zustand.lauf.quinyx += 1;
    zustand.lauf.adp += 1;
    if (zustand.pdfTask) zustand.pdfTask.destroy();
    zustand.pdfTask = null;
    zustand.quinyx = null;
    zustand.adp = null;
    for (const art of ['quinyx', 'adp']) {
      $(`datei-${art}`).value = '';
      setzeFeld(art, 'leer', '', 'Wartet auf Datei');
      zeigeErkannt(art, null);
    }
    verbergeErgebnis();
    aktualisiere();
    ansagen('Prüfung zurückgesetzt. Alle Dateien und Ergebnisse wurden verworfen.');
    $('datei-quinyx').focus();
  }

  // ---------- Ergebnis ----------

  function marke(status) {
    const s = STATUS[status];
    return el('span', { class: 'marke-status' }, symbol(s.symbol), s.text);
  }

  function kurzZeile(p) {
    if (p.erwartet !== undefined && p.abgerechnet !== undefined && p.status !== 'ok') {
      return `Erwartet ${p.erwartet} · abgerechnet ${p.abgerechnet}`;
    }
    return null;
  }

  function tabelle(daten) {
    const istZahl = (text) => /^[−+±-]?[\d.]+,\d{2}( (h|€|ST|TG|Tage?))?$/.test(text);
    const kopf = el('tr', null, daten.spalten.map((s, i) => el('th', { scope: 'col', class: i > 0 && i < daten.spalten.length - 1 && i !== 1 ? 'zahl' : null }, s)));
    const zeilen = daten.zeilen.map((z) => el('tr', null, z.map((zelle, i) => {
      let klasse = istZahl(zelle) ? 'zahl' : null;
      if (zelle === '✓' || zelle.startsWith('✓')) klasse = 'gut';
      else if (zelle === '✕') klasse = 'schlecht';
      else if (zelle.startsWith('!')) klasse = 'offen';
      return i === 0 ? el('th', { scope: 'row' }, zelle) : el('td', { class: klasse }, zelle === '✓' ? '✓ stimmt' : zelle === '✕' ? '✕ weicht ab' : zelle);
    })));
    return el('div', { class: 'tabelle-rahmen' }, el('table', null, el('thead', null, kopf), el('tbody', null, zeilen)));
  }

  function pruefungKarte(p) {
    const inhalt = el('div', { class: 'pruefung-inhalt' }, el('p', null, p.text));
    if (p.erwartet !== undefined && p.abgerechnet !== undefined) {
      const erwartetTitel = p.titel.startsWith('Rechenfehler') ? 'Nachgerechnet' : p.titel.startsWith('Stempelzeit und Lohnstunden') ? 'Quinyx gestempelt' : 'Erwartet (Quinyx)';
      const abgerechnetTitel = p.titel.startsWith('Stempelzeit und Lohnstunden') ? 'Quinyx Lohnart 300' : p.titel.startsWith('Quinyx-Summenzeile') ? 'Summenzeile' : 'Abgerechnet (ADP)';
      inhalt.append(el('dl', { class: 'werte' },
        el('div', { class: 'wert' }, el('dt', null, erwartetTitel), el('dd', null, p.erwartet)),
        el('div', { class: 'wert' }, el('dt', null, abgerechnetTitel), el('dd', null, p.abgerechnet))));
    }
    if (p.tabelle) inhalt.append(tabelle(p.tabelle));
    if (p.fundstellen && p.fundstellen.length) {
      inhalt.append(el('div', { class: 'fundstellen' }, el('strong', null, p.fundstellen.length === 1 ? 'Fundstelle' : 'Fundstellen'),
        el('ul', null, p.fundstellen.map((f) => el('li', null, f)))));
    }
    const offen = p.status === 'abweichung' || p.status === 'nicht_pruefbar' || p.status === 'klaerung';
    return el('details', { class: `pruefung s-${p.status}`, open: offen },
      el('summary', null,
        marke(p.status),
        el('span', { class: 'pruefung-titel' }, p.titel),
        el('span', { class: 'pfeil-rahmen', 'aria-hidden': 'true' }, symbol('pfeil')),
        kurzZeile(p) ? el('span', { class: 'pruefung-kurz' }, kurzZeile(p)) : null),
      inhalt);
  }

  function gruppe(titel, pruefungen) {
    if (!pruefungen.length) return null;
    return el('section', { class: 'gruppe', 'aria-label': titel },
      el('div', { class: 'gruppe-kopf' }, el('h2', null, titel), el('span', { class: 'anzahl', 'aria-label': `${pruefungen.length} Einträge` }, String(pruefungen.length))),
      el('div', { class: 'liste' }, pruefungen.map(pruefungKarte)));
  }

  function zeigeErgebnis(e) {
    const bereich = $('ergebnis');
    bereich.replaceChildren();

    const statusSymbol = STATUS[e.status].symbol;
    const chips = [e.monat, e.person && e.person.name ? e.person.name : null, e.person && e.person.nummer ? `Personalnr. ${e.person.nummer}` : null].filter(Boolean);
    const ueberschrift = el('h2', { id: 'ergebnis-titel', tabindex: '-1' }, e.titel);
    const druck = el('button', { type: 'button', class: 'knopf sekundaer klein drucken' }, 'Ergebnis drucken');
    druck.addEventListener('click', () => window.print());
    bereich.append(el('div', { class: `gesamt s-${e.status}` },
      el('span', { class: 'gesamt-symbol' }, symbol(statusSymbol, 'symbol')),
      el('div', { class: 'gesamt-kopf' },
        el('div', null,
          el('p', { class: 'etikett' }, 'Prüfergebnis'),
          ueberschrift,
          el('p', { class: 'gesamt-text' }, e.text),
          chips.length ? el('ul', { class: 'chips', 'aria-label': 'Geprüft für' }, chips.map((c) => el('li', { class: 'chip' }, c))) : null),
        el('div', null, druck))));

    if (e.kennzahlen.length) {
      bereich.append(el('dl', { class: 'kennzahlen' }, e.kennzahlen.map((k) =>
        el('div', { class: `kennzahl${k.markiert ? ' markiert' : ''}` },
          el('dt', null, k.titel), el('dd', null, k.wert), k.zusatz ? el('dd', { class: 'zusatz' }, k.zusatz) : null))));
    }

    const auffaellig = e.pruefungen.filter((p) => ['abweichung', 'nicht_pruefbar', 'klaerung'].includes(p.status));
    const bestanden = e.pruefungen.filter((p) => p.status === 'ok');
    const hinweise = e.pruefungen.filter((p) => p.status === 'info');
    bereich.append(...[
      gruppe('Auffälligkeiten', auffaellig),
      gruppe('Bestandene Prüfungen', bestanden),
      gruppe('Hinweise und nicht geprüfte Positionen', hinweise),
    ].filter(Boolean));

    bereich.append(el('section', { class: 'umfang', 'aria-label': 'Prüfumfang' },
      el('h2', null, 'Prüfumfang'),
      el('p', null, 'Geprüft wurden die Zuordnung von Person und Monat, die Summen des Quinyx-Exports, Stempelzeit gegen Lohnstunden je Tag, die Übernahme der Grundlohnstunden insgesamt und je Tätigkeit, die Rechenwerte der Positionen mit Menge und Satz, Nachtstunden, Urlaubstage und das Gesamtbrutto aus den Einzelpositionen.'),
      el('p', null, 'Nicht Gegenstand der Prüfung:'),
      el('ul', null, e.umfang.nichtGeprueft.map((t) => el('li', null, t)))));

    bereich.hidden = false;
    ueberschrift.focus({ preventScroll: true });
    bereich.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    ansagen(`Ergebnis: ${e.titel}. ${e.text}`);
  }

  // ---------- Ereignisse ----------

  for (const art of ['quinyx', 'adp']) {
    const eingabe = $(`datei-${art}`);
    eingabe.addEventListener('change', () => {
      const datei = eingabe.files && eingabe.files[0];
      if (datei) verarbeite(art, datei);
    });

    const feld = $(`feld-${art}`);
    feld.addEventListener('dragover', (ev) => {
      ev.preventDefault();
      feld.classList.add('ziehen');
    });
    feld.addEventListener('dragleave', () => feld.classList.remove('ziehen'));
    feld.addEventListener('drop', (ev) => {
      ev.preventDefault();
      feld.classList.remove('ziehen');
      const datei = ev.dataTransfer && ev.dataTransfer.files[0];
      if (!datei) return;
      try { eingabe.files = ev.dataTransfer.files; } catch (e) { /* älterer Browser: Datei wird trotzdem verarbeitet */ }
      verarbeite(art, datei);
    });
  }
  // Außerhalb der Felder fallen gelassene Dateien nicht im Browser öffnen
  window.addEventListener('dragover', (ev) => ev.preventDefault());
  window.addEventListener('drop', (ev) => ev.preventDefault());

  $('pruefen').addEventListener('click', () => {
    if (!zustand.quinyx || !zustand.adp) return;
    zeigeErgebnis(V.pruefe(zustand.quinyx, zustand.adp));
  });
  $('zuruecksetzen').addEventListener('click', zuruecksetzen);

  // Beim Drucken alle Details aufklappen
  window.addEventListener('beforeprint', () => {
    document.querySelectorAll('#ergebnis details').forEach((d) => { d.dataset.warOffen = d.open ? '1' : ''; d.open = true; });
  });
  window.addEventListener('afterprint', () => {
    document.querySelectorAll('#ergebnis details').forEach((d) => { d.open = d.dataset.warOffen === '1'; });
  });
})();
