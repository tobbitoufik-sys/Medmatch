const MONTH_REPLACEMENTS: Record<string, string> = {
  Jan: "Januar",
  Feb: "Februar",
  Mar: "Maerz",
  Apr: "April",
  May: "Mai",
  Jun: "Juni",
  Jul: "Juli",
  Aug: "August",
  Sep: "September",
  Oct: "Oktober",
  Nov: "November",
  Dec: "Dezember"
};

export function normalizePdfText(value?: string | null) {
  if (!value) {
    return value ?? "";
  }

  let normalized = value
    .replace("Medical license in Germany", "Approbation in Deutschland")
    .replace("Medical authorization in Germany", "Berufserlaubnis in Deutschland")
    .replace(/\bPresent\b/g, "heute")
    .replace(/^since\s+/i, "seit ");

  for (const [from, to] of Object.entries(MONTH_REPLACEMENTS)) {
    normalized = normalized.replace(new RegExp(`\\b${from}\\b`, "g"), to);
  }

  return normalized;
}
