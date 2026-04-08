import type { DoctorCoverLetterManualContext } from "@/lib/ai/cover-letter";

export function buildCoverLetterPrompt(promptFacts: string) {
  const systemPrompt = [
    "Du schreibst ein professionelles deutsches Motivationsschreiben fuer einen Arzt oder eine Aerztin.",
    "Nutze ausschliesslich die bereitgestellten Fakten aus dem Profil und dem optionalen Bewerbungskontext.",
    "Strukturiere das Schreiben wie ein realistisches deutsches Bewerbungsschreiben.",
    "Wenn moeglich, nutze diese Reihenfolge: Absenderkontext, Ort/Datum-Zeile, Empfaengerkontext, Betreff, Anrede, Hauptteil, Schlussformel, Name.",
    "Erfinde niemals Berufsjahre, Institutionen, Abschluesse, Sprachlevel, Titel, Lizenzen, Verfahren oder Daten.",
    "Wenn Informationen fehlen, lasse sie weg oder formuliere vorsichtig und allgemein.",
    "Der Ton muss formell, glaubwuerdig, medizinisch-professionell und bewerbungstauglich sein.",
    "Halte den Text kompakt, realistisch, wenig repetitiv und ohne Uebertreibungen.",
    "Gib nur das fertige Motivationsschreiben auf Deutsch zurueck, ohne Erklaerungen oder Meta-Kommentare."
  ].join(" ");

  const userPrompt = [
    "Verfasse ein deutsches Motivationsschreiben auf Basis dieser verifizierten Daten.",
    "Fuege eine passende formale Betreff-Zeile ein, die mit 'Betreff: ' beginnt.",
    "Schreibe die finale Fassung als reinen Klartext ohne Markdown, ohne Sternchen und ohne Formatierungszeichen.",
    "Verwende niemals eckige Klammer-Platzhalter oder interne Bearbeitungshinweise wie '[...]'.",
    "Wenn Angaben fuer Empfaenger, Klinik oder Adresse fehlen, lasse die jeweilige Zeile einfach weg.",
    "Nutze eine realistische deutsche Anrede.",
    "Wenn die manuelle Anrede auf 'Frau' steht und eine Ansprechperson vorhanden ist, verwende 'Sehr geehrte Frau ...'.",
    "Wenn die manuelle Anrede auf 'Herr' steht und eine Ansprechperson vorhanden ist, verwende 'Sehr geehrter Herr ...'.",
    "Wenn die manuelle Anrede auf 'Unbekannt' steht, rate niemals das Geschlecht und verwende stattdessen die sichere formale Standardanrede.",
    "Wenn keine Ansprechperson vorliegt, verwende 'Sehr geehrte Damen und Herren,'.",
    "Nutze die bereitgestellte Datum-Angabe und gib niemals '[Datum]' aus.",
    "Wenn ein nutzbarer Ort aus Profil- oder Klinik-Kontext vorliegt, nutze die bereitgestellte Ort/Datum-Zeile. Wenn nicht, erfinde keinen Ort.",
    "Wenn Klinikname, Ansprechperson oder Klinikadresse vorliegen, bilde daraus einen sauberen Empfaengerblock mit einer Information pro Zeile.",
    "Falls narrative Profilfelder fehlen, kompensiere das nicht mit erfundenen Details.",
    "Behandle bestaetigte Approbations- oder Lizenzangaben aus dem Profil immer als bereits vorliegende Fakten und niemals als voraussichtliche kuenftige Erteilung, ausser der Quelldatensatz sagt das ausdruecklich.",
    "",
    promptFacts
  ].join("\n");

  return {
    systemPrompt,
    userPrompt
  };
}
