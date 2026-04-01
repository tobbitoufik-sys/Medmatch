export const doctorLanguageOptions = [
  "Arabisch",
  "Bulgarisch",
  "Chinesisch",
  "Dari",
  "Deutsch",
  "Englisch",
  "Französisch",
  "Griechisch",
  "Hindi",
  "Italienisch",
  "Kroatisch",
  "Kurdisch",
  "Niederländisch",
  "Persisch",
  "Polnisch",
  "Portugiesisch",
  "Rumänisch",
  "Russisch",
  "Serbisch",
  "Slowakisch",
  "Slowenisch",
  "Spanisch",
  "Tschechisch",
  "Türkisch",
  "Ukrainisch",
  "Ungarisch"
] as const;

export const doctorLanguageCefrOptions = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const doctorLanguageLabelOptions = [
  "Anfänger",
  "Grundkenntnisse",
  "Gute Kenntnisse",
  "Fließend",
  "Verhandlungssicher",
  "Muttersprache"
] as const;

export type DoctorLanguageName = (typeof doctorLanguageOptions)[number];
export type DoctorLanguageCefrLevel = (typeof doctorLanguageCefrOptions)[number];
export type DoctorLanguageLabelLevel = (typeof doctorLanguageLabelOptions)[number];
