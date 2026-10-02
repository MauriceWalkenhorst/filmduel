// Vergleicht normalisierte Quinyx- und ADP-Daten und liefert Einzelprüfungen
// mit eigenem Status. Der Gesamtstatus verdeckt keine offenen Prüfungen.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./zahlen.js'));
  else root.AbrVergleich = factory(root.AbrZahlen);
})(typeof self !== 'undefined' ? self : this, function (Z) {
  'use strict';

  const RANG = { abweichung: 0, nicht_pruefbar: 1, klaerung: 2, ok: 3, info: 4 };
  const h = Z.formatStunden;

  const NICHT_GEPRUEFT = [
    'Stundensätze gegen Arbeitsvertrag oder Tarif',
    'Anspruchsvoraussetzungen von Zuschlägen',
    'Urlaubsentgeltbasis und Urlaubsanspruch',
    'Lohnsteuer, Sozialabgaben und Nettobetrag',
    'Positionen ohne ausgewiesene Menge (zum Beispiel Prämien)',
  ];

  function normName(text) {
    return String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/ß/g, 'ss').split(/[^a-z]+/).filter(Boolean).sort().join(' ');
  }

  function normTaetigkeit(text) {
    return String(text || '').replace(/^\d+(?:\.\d+)*\s+/, '').replace(/\([^)]*\)/g, '')
      .replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function tagText(tag) {
    const teile = tag.intervalle.map((iv) => `${iv.von}–${iv.bis}`).join(', ');
    return teile || 'keine Stempelintervalle';
  }

  function differenzText(a, b) {
    const d = a - b;
    return `${d > 0 ? '+' : d < 0 ? '−' : '±'}${Z.format(Math.abs(d))}`;
  }

  function pruefe(q, a) {
    const pruefungen = [];
    const neu = (status, titel, text, extra) => {
      const p = Object.assign({ status, titel, text }, extra || {});
      pruefungen.push(p);
      return p;
    };

    // 1. Dateien lesbar und vollständig
    const sperren = [
      ...q.nichtPruefbar.map((t) => ({ datei: 'Quinyx-Stundenexport', text: t })),
      ...a.nichtPruefbar.map((t) => ({ datei: 'ADP-Abrechnung', text: t })),
    ];
    if (sperren.length) {
      for (const s of sperren) neu('nicht_pruefbar', s.datei, s.text);
      return abschluss(pruefungen, q, a, false);
    }

    // 2. Person und Monat
    if (q.person.nummer !== a.person.nummer) {
      neu('nicht_pruefbar', 'Verschiedene Beschäftigte',
        `Der Quinyx-Export gehört zur Ausweisnummer ${q.person.nummer}${q.person.name ? ` (${q.person.name})` : ''}, die ADP-Abrechnung zur Personalnummer ${a.person.nummer}${a.person.name ? ` (${a.person.name})` : ''}. Die Prüfung wurde angehalten.`);
      return abschluss(pruefungen, q, a, false);
    }
    if (q.zeitraum.monat !== a.monat) {
      neu('nicht_pruefbar', 'Verschiedene Monate',
        `Der Quinyx-Export betrifft ${Z.formatMonat(q.zeitraum.monat)}, die ADP-Abrechnung ${Z.formatMonat(a.monat)}. Die Prüfung wurde angehalten.`);
      return abschluss(pruefungen, q, a, false);
    }
    neu('ok', 'Person und Monat',
      `Beide Dateien gehören zur Personalnummer ${a.person.nummer} und betreffen ${Z.formatMonat(a.monat)}.`,
      { fundstellen: [q.zeitraum.zeile ? `Quinyx Zeile ${q.zeitraum.zeile}` : 'Quinyx Tageszeilen', `ADP Kopf: ${a.monatText}, Personalnummer ${a.person.nummer}`] });
    if (q.person.name && a.person.name && normName(q.person.name) !== normName(a.person.name)) {
      neu('klaerung', 'Name weicht ab',
        `Die Personalnummer stimmt überein, der Name aber nicht: Quinyx „${q.person.name}“, ADP „${a.person.name}“.`);
    }

    // 3. Datenqualität des Quinyx-Exports
    for (const k of q.klaerungen) neu('klaerung', k.titel, k.text, { fundstellen: [k.fundstelle] });
    if (q.summenzeile) {
      const falsch = q.summenzeile.vergleiche.filter((v) => !v.stimmt);
      if (falsch.length) {
        for (const v of falsch) {
          neu('klaerung', `Quinyx-Summenzeile: ${v.titel}`,
            `Die Summenzeile nennt ${Z.format(v.export)}, die Tageszeilen ergeben zusammen ${Z.format(v.berechnet)}. Für den Vergleich werden die nachgerechneten Tageszeilen verwendet.`,
            { erwartet: Z.format(v.berechnet), abgerechnet: Z.format(v.export), fundstellen: [v.fundstelle] });
        }
      } else {
        neu('ok', 'Quinyx-Summen nachgerechnet',
          `Die Summenzeile (Zeile ${q.summenzeile.zeile}) stimmt in allen ${q.summenzeile.vergleiche.length} geprüften Spalten mit den ${q.tage.length} Tageszeilen überein.`);
      }
    }

    // 4. Stempelintervalle gegen exportierte Stempelstunden
    const intervallFehler = [];
    for (const tag of q.tage) {
      if (tag.stempelFehler) {
        intervallFehler.push(tag);
        neu('klaerung', `Stempelzeit ${Z.formatDatum(tag.datum)} nicht lesbar`, tag.stempelFehler, { datum: tag.datum, fundstellen: [`Quinyx Zeile ${tag.zeile}`] });
        continue;
      }
      if (tag.gestempelt === null || tag.intervalle.length === 0) continue;
      const ausIntervallen = Z.minutenZuHundertstel(tag.rohMinuten);
      if (ausIntervallen !== tag.gestempelt) {
        intervallFehler.push(tag);
        neu('klaerung', `Stempelintervalle ${Z.formatDatum(tag.datum)}`,
          `Die Stempelintervalle (${tagText(tag)}) ergeben ${Z.formatMinuten(tag.rohMinuten)} = ${h(ausIntervallen)}, der Export nennt ${h(tag.gestempelt)} gestempelt.`,
          { datum: tag.datum, erwartet: h(ausIntervallen), abgerechnet: h(tag.gestempelt), fundstellen: [`Quinyx Zeile ${tag.zeile}`] });
      }
    }

    // Einheitlicher Stundensatz der Grundlohnpositionen (für Hinweise in Euro)
    const grundlohn = a.positionen.filter((p) => p.grundlohn && !p.nachberechnung);
    const saetze = [...new Set(grundlohn.map((p) => p.satz))];
    const einSatz = saetze.length === 1 ? saetze[0] : null;
    const euroHinweis = (stunden) => (einSatz === null ? ''
      : ` Beim ausgewiesenen Satz von ${Z.formatEuro(einSatz)} entspräche das rechnerisch ${Z.formatEuro(Z.positionsBetrag(Math.abs(stunden), einSatz, null))} brutto.`);

    // 5. Stempelzeit gegen Lohnart 300 je Tag
    const nachDatum = new Map();
    for (const tag of q.tage) {
      if (!nachDatum.has(tag.datum)) nachDatum.set(tag.datum, []);
      nachDatum.get(tag.datum).push(tag);
    }
    let arbeitstage = 0;
    let tagesDifferenzen = 0;
    for (const [datum, tage] of nachDatum) {
      const gestempelt = tage.reduce((s, t) => s + (t.gestempelt || 0), 0);
      const lohn = tage.reduce((s, t) => s + (t.lohn300 || 0), 0);
      if (gestempelt === 0 && lohn === 0) continue;
      arbeitstage += 1;
      if (gestempelt === lohn) continue;
      tagesDifferenzen += 1;
      const differenz = gestempelt - lohn;
      const pausen = tage.flatMap((t) => t.pausen);
      const intervallText = tage.map(tagText).join('; ');
      const pausenText = pausen.length
        ? `Pausenintervall${pausen.length > 1 ? 'e' : ''} ${pausen.map((p) => `${p.von}–${p.bis} (${p.minuten} Min.)`).join(', ')}`
        : 'kein Pausenintervall gestempelt';
      const ursache = differenz > 0
        ? ' Die Ursache der Kürzung ist im Export nicht belegt. Ein automatischer Pausenabzug ist eine mögliche Erklärung; ob tatsächlich eine unbezahlte Pause genommen wurde, ist zu klären.'
        : ' Es wurden mehr Lohnstunden verbucht als gestempelt. Der Grund ist im Export nicht belegt.';
      neu('klaerung', `Stempelzeit und Lohnstunden am ${Z.formatDatum(datum)}`,
        `Gestempelt ${h(gestempelt)} (${intervallText}, ${pausenText}), als Lohnart 300 verbucht ${h(lohn)}. Differenz ${Z.format(Math.abs(differenz))} h.${ursache}${euroHinweis(differenz)}`,
        {
          datum,
          erwartet: `${h(gestempelt)} gestempelt`,
          abgerechnet: `${h(lohn)} Lohnart 300`,
          fundstellen: tage.map((t) => `Quinyx Zeile ${t.zeile} (Gestempelt, 300 Stundenlohn)`),
        });
    }
    if (arbeitstage > 0 && tagesDifferenzen === 0) {
      neu('ok', 'Stempelzeit und Lohnstunden je Tag',
        `An allen ${arbeitstage} Tagen mit Stunden entsprechen die Lohnstunden (Lohnart 300) genau der gestempelten Zeit.`);
    }

    // 6. Grundlohnstunden gesamt
    const nachberechnungen = a.positionen.filter((p) => p.nachberechnung);
    const adpGrundlohn = grundlohn.reduce((s, p) => s + p.menge, 0);
    const qLohn = q.summen.lohn300;
    let grundlohnOk = false;
    if (qLohn === 0 && adpGrundlohn === 0) {
      neu('nicht_pruefbar', 'Grundlohnstunden',
        'Weder der Quinyx-Export noch die ADP-Abrechnung enthalten Grundlohnstunden. Ein Stundenvergleich ist nicht möglich.');
    } else if (qLohn === adpGrundlohn) {
      grundlohnOk = true;
      neu('ok', 'Grundlohnstunden vollständig übernommen',
        `Quinyx weist ${h(qLohn)} als Lohnart 300 aus, ADP rechnet in ${grundlohn.length} Grundlohnposition${grundlohn.length === 1 ? '' : 'en'} ebenfalls ${h(adpGrundlohn)} ab.`,
        { erwartet: h(qLohn), abgerechnet: h(adpGrundlohn) });
    } else {
      const differenz = qLohn - adpGrundlohn;
      const richtung = differenz > 0 ? 'weniger' : 'mehr';
      const status = nachberechnungen.some((p) => p.grundlohn) ? 'klaerung' : 'abweichung';
      neu(status, 'Grundlohnstunden weichen ab',
        `Quinyx weist ${h(qLohn)} als Lohnart 300 aus, ADP rechnet ${h(adpGrundlohn)} ab, also ${Z.format(Math.abs(differenz))} h ${richtung}.${differenz > 0 ? euroHinweis(differenz) : ''}${status === 'klaerung' ? ' Die Abrechnung enthält Nachberechnungen, die nicht automatisch zugeordnet werden.' : ''}`,
        {
          erwartet: h(qLohn), abgerechnet: h(adpGrundlohn),
          fundstellen: [q.summenzeile ? `Quinyx Summe aus ${q.tage.length} Tageszeilen` : 'Quinyx Tageszeilen', ...grundlohn.map((p) => p.fundstelle)],
        });
    }

    // 7. Aufteilung nach Tätigkeit
    const qGruppen = new Map();
    const gemischt = [];
    for (const tag of q.tage) {
      if (!tag.lohn300) continue;
      const unproduktiv = tag.unproduktiv || 0;
      const produktiv = tag.produktiv || 0;
      let schluessel;
      let titel;
      if (unproduktiv > 0 && produktiv > 0) {
        gemischt.push(tag);
        continue;
      } else if (unproduktiv > 0) {
        schluessel = '#unproduktiv';
        titel = 'Unproduktive Stunden';
      } else {
        schluessel = normTaetigkeit(tag.schichttyp) || '#ohne';
        titel = tag.schichttyp ? tag.schichttyp.replace(/^\d+(?:\.\d+)*\s+/, '') : 'Ohne Schichttyp';
      }
      if (!qGruppen.has(schluessel)) qGruppen.set(schluessel, { titel, stunden: 0, tage: [] });
      const g = qGruppen.get(schluessel);
      g.stunden += tag.lohn300;
      g.tage.push(tag);
    }
    const aGruppen = new Map();
    for (const p of grundlohn) {
      const schluessel = normTaetigkeit(p.bezeichnung);
      if (!aGruppen.has(schluessel)) aGruppen.set(schluessel, { titel: p.bezeichnung, lohnart: p.lohnart, stunden: 0 });
      aGruppen.get(schluessel).stunden += p.menge;
    }
    const zeilen = [];
    let aufteilungOffen = gemischt.length > 0;
    let eigeneMeldungen = 0;
    const freieQ = new Map(qGruppen);
    const freieA = [];
    for (const [schluessel, ag] of aGruppen) {
      const qg = freieQ.get(schluessel);
      if (qg) {
        freieQ.delete(schluessel);
        const stimmt = qg.stunden === ag.stunden;
        if (!stimmt) aufteilungOffen = true;
        zeilen.push([`${ag.titel} (${ag.lohnart})`, h(qg.stunden), h(ag.stunden), stimmt ? '✓ stimmt' : `! ${differenzText(ag.stunden, qg.stunden)} h`]);
      } else {
        freieA.push(ag);
      }
    }
    for (const ag of freieA) {
      aufteilungOffen = true;
      const passend = [...freieQ.entries()].find(([, qg]) => qg.stunden === ag.stunden);
      if (passend) {
        freieQ.delete(passend[0]);
        eigeneMeldungen += 1;
        const tage = passend[1].tage.map((t) => `${Z.formatDatum(t.datum)}, Schichttyp ${t.schichttyp}`).join('; ');
        zeilen.push([`${ag.titel} (${ag.lohnart})`, `${h(passend[1].stunden)} ${passend[1].titel}`, h(ag.stunden), '! Zuordnung nicht belegt']);
        neu('klaerung', `Zuordnung „${ag.titel}“`,
          `ADP rechnet ${h(ag.stunden)} als „${ag.titel}“ ab. In Quinyx gibt es dafür keine gleichnamige Tätigkeit; die Menge entspricht den in Quinyx als unproduktiv gestempelten Stunden (${tage}). Die Mengen passen, die Zuordnung ist aus den Dateien allein aber nicht belegt.`,
          { fundstellen: [...passend[1].tage.map((t) => `Quinyx Zeile ${t.zeile}`), ...grundlohn.filter((p) => normTaetigkeit(p.bezeichnung) === normTaetigkeit(ag.titel)).map((p) => p.fundstelle)] });
      } else {
        zeilen.push([`${ag.titel} (${ag.lohnart})`, '–', h(ag.stunden), '! keine Entsprechung']);
      }
    }
    for (const [, qg] of freieQ) {
      aufteilungOffen = true;
      zeilen.push([qg.titel, h(qg.stunden), '–', '! keine Entsprechung']);
    }
    for (const tag of gemischt) {
      zeilen.push([`${Z.formatDatum(tag.datum)} ${tag.schichttyp}`, h(tag.lohn300), '–', '! produktiv und unproduktiv gemischt']);
    }
    if (zeilen.length) {
      const nurEigene = aufteilungOffen && eigeneMeldungen > 0 && zeilen.filter((z) => z[3].startsWith('!')).length === eigeneMeldungen;
      neu(!aufteilungOffen ? 'ok' : nurEigene ? 'info' : 'klaerung', 'Aufteilung nach Tätigkeit',
        nurEigene
          ? 'Alle gleichnamigen Tätigkeiten stimmen überein. Die offene Zuordnung ist als eigener Klärungspunkt aufgeführt.'
          : aufteilungOffen
          ? 'Nicht alle Quinyx-Tätigkeiten lassen sich eindeutig einer ADP-Grundlohnposition zuordnen. Zugeordnet wird nur über den gleichen Namen, nicht über zufällig gleiche Mengen.'
          : 'Jede ADP-Grundlohnposition entspricht genau den Stunden der gleichnamigen Quinyx-Tätigkeit.',
        { tabelle: { spalten: ['Tätigkeit', 'Quinyx', 'ADP', 'Ergebnis'], zeilen } });
    }

    // 8. Rechenwerte der Positionen
    const rechenPruefung = (positionen, titelOk, titelFehler) => {
      const tabelle = [];
      let fehler = 0;
      let summeAdp = 0;
      let summeNeu = 0;
      for (const p of positionen) {
        const neuBerechnet = Z.positionsBetrag(p.menge, p.satz, p.prozent);
        const stimmt = neuBerechnet === p.betrag;
        summeAdp += p.betrag;
        summeNeu += neuBerechnet;
        const rechnung = `${Z.format(p.menge)} ${p.einheit} × ${Z.formatEuro(p.satz)}${p.prozent !== null ? ` × ${Z.format(p.prozent)} %` : ''}`;
        tabelle.push([`${p.bezeichnung} (${p.lohnart})`, rechnung, Z.formatEuro(p.betrag), Z.formatEuro(neuBerechnet), stimmt ? '✓' : '✕']);
        if (!stimmt) {
          fehler += 1;
          neu('abweichung', `${titelFehler}: ${p.bezeichnung}`,
            `${rechnung} ergibt kaufmännisch gerundet ${Z.formatEuro(neuBerechnet)}, ADP weist ${Z.formatEuro(p.betrag)} aus (${differenzText(p.betrag, neuBerechnet)} €).`,
            { erwartet: Z.formatEuro(neuBerechnet), abgerechnet: Z.formatEuro(p.betrag), fundstellen: [p.fundstelle] });
        }
      }
      tabelle.push(['Summe', '', Z.formatEuro(summeAdp), Z.formatEuro(summeNeu), summeAdp === summeNeu ? '✓' : '✕']);
      neu(fehler ? 'info' : 'ok', titelOk,
        fehler
          ? `${positionen.length - fehler} von ${positionen.length} Positionen stimmen. Jede Position wurde einzeln auf Cent gerundet und erst danach summiert.`
          : `Alle ${positionen.length} Positionen sind rechnerisch richtig. Jede Position wurde einzeln kaufmännisch auf Cent gerundet und erst danach summiert.`,
        { tabelle: { spalten: ['Position', 'Rechnung', 'ADP', 'Nachgerechnet', ''], zeilen: tabelle } });
      return fehler === 0;
    };
    let positionenOk = false;
    if (grundlohn.length) {
      positionenOk = rechenPruefung(grundlohn, 'Grundlohnpositionen nachgerechnet', 'Rechenfehler');
    }
    const weitereMitMenge = a.positionen.filter((p) => !p.grundlohn && !p.nachberechnung && p.menge !== null);
    if (weitereMitMenge.length) {
      rechenPruefung(weitereMitMenge, 'Zuschläge und Urlaub nachgerechnet', 'Rechenfehler');
    }

    // 9. Weitere Mengen: Lohnarten mit Stunden (z. B. 460 Nacht) und Tage (Urlaub, Krankheit)
    const nachLohnart = new Map();
    for (const p of weitereMitMenge) {
      const schluessel = `${p.lohnart}|${p.einheit}`;
      if (!nachLohnart.has(schluessel)) nachLohnart.set(schluessel, { lohnart: p.lohnart, einheit: p.einheit, bezeichnung: p.bezeichnung, menge: 0, positionen: [] });
      const g = nachLohnart.get(schluessel);
      g.menge += p.menge;
      g.positionen.push(p);
    }
    const erledigteCodes = new Set(['300']);
    let urlaubGeprueft = false;
    let krankGeprueft = false;
    for (const g of nachLohnart.values()) {
      const fund = g.positionen.map((p) => p.fundstelle);
      if (g.einheit === 'ST') {
        const spalte = q.gehaltstypen.find((t) => t.code === g.lohnart);
        if (!spalte) {
          neu('klaerung', `Lohnart ${g.lohnart} ohne Gegenstück`,
            `ADP rechnet ${h(g.menge)} „${g.bezeichnung}“ ab. Der Quinyx-Export enthält keine Spalte für Lohnart ${g.lohnart}; die Menge kann nicht verglichen werden.`,
            { fundstellen: fund });
          continue;
        }
        erledigteCodes.add(g.lohnart);
        const qMenge = q.summen.gehaltstypen[g.lohnart];
        neu(qMenge === g.menge ? 'ok' : 'abweichung', `${spalte.titel}`,
          qMenge === g.menge
            ? `Quinyx und ADP weisen übereinstimmend ${h(g.menge)} aus${g.positionen.length > 1 ? ` (ADP in ${g.positionen.length} Positionen)` : ''}. Geprüft wird nur die Menge, nicht der Anspruch.`
            : `Quinyx weist ${h(qMenge)} aus, ADP rechnet ${h(g.menge)} ab (${differenzText(g.menge, qMenge)} h).`,
          { erwartet: h(qMenge), abgerechnet: h(g.menge), fundstellen: fund });
      } else {
        const urlaub = /urlaub/i.test(g.bezeichnung);
        const krank = /krank/i.test(g.bezeichnung);
        const qTage = urlaub ? q.summen.urlaubTage : krank ? q.summen.krankTage : null;
        if (qTage === null) {
          neu('klaerung', `Lohnart ${g.lohnart} ohne Gegenstück`,
            `ADP rechnet ${Z.formatTage(g.menge)} „${g.bezeichnung}“ ab. Im Quinyx-Export gibt es dafür keine passende Tagesspalte.`,
            { fundstellen: fund });
          continue;
        }
        if (urlaub) urlaubGeprueft = true;
        if (krank) krankGeprueft = true;
        erledigteCodes.add(g.lohnart);
        neu(qTage === g.menge ? 'ok' : 'abweichung', urlaub ? 'Urlaubstage' : 'Krankheitstage',
          qTage === g.menge
            ? `Quinyx und ADP weisen übereinstimmend ${Z.formatTage(g.menge)} aus. ${urlaub ? 'Die Urlaubsentgeltbasis wird nicht geprüft.' : 'Die Entgeltfortzahlung selbst wird nicht geprüft.'}`
            : `Quinyx weist ${Z.formatTage(qTage)} aus, ADP rechnet ${Z.formatTage(g.menge)} ab.`,
          { erwartet: Z.formatTage(qTage), abgerechnet: Z.formatTage(g.menge), fundstellen: fund });
      }
    }
    for (const t of q.gehaltstypen) {
      if (erledigteCodes.has(t.code)) continue;
      const menge = q.summen.gehaltstypen[t.code];
      if (!menge) continue;
      const alsTage = [...nachLohnart.values()].some((g) => g.lohnart === t.code && g.einheit === 'TG');
      if (alsTage) continue; // z. B. 540 Urlaub: Quinyx in Stunden, ADP in Tagen; Vergleich über die Tagesspalte
      neu('abweichung', `${t.titel} fehlt in ADP`,
        `Quinyx weist ${h(menge)} als Lohnart ${t.code} aus, die ADP-Abrechnung enthält keine Position mit dieser Lohnart.`,
        { erwartet: h(menge), abgerechnet: '0,00 h', fundstellen: [`Quinyx Spalte ${Z.spaltenBuchstabe(t.index)}`] });
    }
    if (!urlaubGeprueft && q.summen.urlaubTage) {
      neu('klaerung', 'Urlaubstage ohne ADP-Position',
        `Quinyx weist ${Z.formatTage(q.summen.urlaubTage)} Urlaub aus, in der ADP-Abrechnung wurde keine Urlaubsposition in Tagen gefunden.`);
    }
    if (!krankGeprueft && q.summen.krankTage) {
      neu('klaerung', 'Krankheitstage ohne ADP-Position',
        `Quinyx weist ${Z.formatTage(q.summen.krankTage)} Krankheit aus, in der ADP-Abrechnung wurde keine Krankheitsposition in Tagen gefunden.`);
    }

    // 10. Nachberechnungen und unerkannte Zeilen
    for (const p of nachberechnungen) {
      neu('klaerung', `Nachberechnung oder Korrektur: ${p.bezeichnung}`,
        'Diese Position sieht nach einer Nachberechnung, Korrektur oder Rückrechnung aus. Sie wird nicht automatisch zugeordnet und ist in den Stundensummen nicht enthalten.',
        { fundstellen: [p.fundstelle] });
    }
    for (const u of a.unerkannt) {
      neu('klaerung', u.nachberechnung ? 'Nachberechnung nicht zugeordnet' : 'Unbekannte Zeile in der Abrechnung',
        'Diese Zeile im Bereich der Lohnpositionen wurde nicht erkannt und ist in keiner Prüfung enthalten.',
        { fundstellen: [u.fundstelle] });
    }

    // 11. Gesamtbrutto aus den Einzelpositionen
    if (a.gesamtBrutto) {
      const imBrutto = a.positionen.filter((p) => /^[A-Z]/.test(p.kennzeichen));
      const summe = imBrutto.reduce((s, p) => s + p.betrag, 0);
      neu(summe === a.gesamtBrutto.betrag ? 'ok' : 'klaerung', 'Gesamtbrutto aus Einzelpositionen',
        summe === a.gesamtBrutto.betrag
          ? `Die ${imBrutto.length} Positionen mit Kennzeichen „im Gesamtbrutto“ ergeben zusammen ${Z.formatEuro(summe)}, genau das ausgewiesene Gesamtbrutto.`
          : `Die ${imBrutto.length} Positionen mit Kennzeichen „im Gesamtbrutto“ ergeben ${Z.formatEuro(summe)}, ausgewiesen sind ${Z.formatEuro(a.gesamtBrutto.betrag)}.`,
        { erwartet: Z.formatEuro(summe), abgerechnet: Z.formatEuro(a.gesamtBrutto.betrag), fundstellen: [`ADP Seite ${a.gesamtBrutto.seite}, Zeile „${a.gesamtBrutto.text}“`] });
    }

    // 12. Nicht geprüfte Positionen
    const ohneMenge = a.positionen.filter((p) => p.menge === null && !p.nachberechnung);
    if (ohneMenge.length) {
      neu('info', 'Nicht geprüfte Positionen',
        'Diese Positionen haben keine Menge und liegen außerhalb des Stundenvergleichs.',
        {
          tabelle: {
            spalten: ['Position', 'Lohnart', 'Betrag', 'Kennzeichen'],
            zeilen: ohneMenge.map((p) => [p.bezeichnung, `${p.praefix}${p.lohnart}`, Z.formatEuro(p.betrag), /^[A-Z]/.test(p.kennzeichen) ? `${p.kennzeichen} (im Gesamtbrutto)` : `${p.kennzeichen} (nicht im Gesamtbrutto)`]),
          },
        });
    }

    // 13. Bestätigungsstatus
    if (q.bestaetigung) {
      const offen = q.tage.filter((t) => (t.lohn300 || t.gestempelt) && !/^(ja|yes|true|1|x|bestätigt|genehmigt|attestiert)$/i.test(String(t.bestaetigt ?? '').trim()));
      neu(offen.length ? 'klaerung' : 'ok', 'Bestätigungsstatus',
        offen.length
          ? `Laut Spalte „${q.bestaetigung.titel}“ sind ${offen.length} Tage nicht als bestätigt markiert: ${offen.map((t) => Z.formatDatum(t.datum)).join(', ')}.`
          : `Laut Spalte „${q.bestaetigung.titel}“ sind alle Tage mit Stunden bestätigt.`);
    } else {
      neu('info', 'Bestätigungsstatus',
        'Der Export enthält keine Spalte zum Bestätigungsstatus. Ob die Stunden bestätigt sind, lässt sich aus der Datei allein nicht nachweisen.');
    }
    for (const t of [...q.hinweise, ...a.hinweise]) neu('info', 'Hinweis', t);

    return abschluss(pruefungen, q, a, grundlohnOk && positionenOk && intervallFehler.length === 0);
  }

  function abschluss(pruefungen, q, a, kernGeprueft) {
    pruefungen.sort((x, y) => RANG[x.status] - RANG[y.status]);
    const anzahl = (s) => pruefungen.filter((p) => p.status === s).length;
    const abw = anzahl('abweichung');
    const np = anzahl('nicht_pruefbar');
    const kl = anzahl('klaerung');
    const plural = (n, ein, mehr) => `${n} ${n === 1 ? ein : mehr}`;
    const offen = kl ? ` Zusätzlich ${kl === 1 ? 'ist' : 'sind'} ${plural(kl, 'Punkt', 'Punkte')} zu klären.` : '';

    let status;
    let titel;
    let text;
    const gesperrt = !q.summen || !a.monat || pruefungen.some((p) => p.status === 'nicht_pruefbar' && p.titel !== 'Grundlohnstunden');
    if (gesperrt) {
      status = 'nicht_pruefbar';
      titel = 'Nicht prüfbar';
      text = 'Die Dateien konnten nicht verglichen werden. Die Gründe stehen unten.';
    } else if (abw) {
      status = 'abweichung';
      titel = 'Abweichung gefunden';
      text = `${plural(abw, 'belegte Abweichung', 'belegte Abweichungen')} zwischen Quinyx und ADP.${offen}`;
    } else if (np) {
      status = 'nicht_pruefbar';
      titel = 'Nicht prüfbar';
      text = `Ein Teil der Prüfung war nicht möglich.${offen}`;
    } else if (kl) {
      status = 'klaerung';
      titel = 'Klärung nötig';
      text = `Keine belegte Abweichung, aber ${plural(kl, 'Punkt ist', 'Punkte sind')} offen und ${kl === 1 ? 'muss' : 'müssen'} geklärt werden.`;
    } else if (kernGeprueft) {
      status = 'ok';
      titel = 'Stimmt überein';
      text = 'Alle geprüften Werte stimmen überein. Was genau geprüft wurde und was nicht, steht unter „Prüfumfang“.';
    } else {
      status = 'nicht_pruefbar';
      titel = 'Nicht prüfbar';
      text = 'Der Stundenvergleich konnte nicht vollständig durchgeführt werden.';
    }

    const kennzahlen = [];
    if (!gesperrt) {
      const adpGrundlohn = a.positionen.filter((p) => p.grundlohn && !p.nachberechnung).reduce((s, p) => s + p.menge, 0);
      kennzahlen.push(
        { titel: 'Quinyx gestempelt', wert: h(q.summen.gestempelt), zusatz: `${q.tage.length} Tageszeilen` },
        {
          titel: 'Quinyx Lohnart 300',
          wert: h(q.summen.lohn300),
          zusatz: q.summen.gestempelt === q.summen.lohn300 ? 'entspricht der Stempelzeit' : `${differenzText(q.summen.lohn300, q.summen.gestempelt)} h gegenüber Stempelzeit`,
        },
        {
          titel: 'ADP Grundlohnstunden',
          wert: h(adpGrundlohn),
          markiert: adpGrundlohn !== q.summen.lohn300,
          zusatz: adpGrundlohn === q.summen.lohn300 ? 'entspricht Lohnart 300' : `${differenzText(adpGrundlohn, q.summen.lohn300)} h gegenüber Lohnart 300`,
        },
      );
    }

    return {
      status,
      titel,
      text,
      monat: a.monat ? Z.formatMonat(a.monat) : null,
      person: a.person || q.person || null,
      kennzahlen,
      pruefungen,
      umfang: { nichtGeprueft: NICHT_GEPRUEFT },
    };
  }

  return { pruefe, normTaetigkeit };
});
