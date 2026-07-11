export const brl = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);

export const compact = (n: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export const brlCompact = (n: number) =>
  "R$" + new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export const pct = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;

// Brazilian state code → full name (Olist stores 2-letter codes).
const BR_STATES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará",
  DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão",
  MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará",
  PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima",
  SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins",
};

export const stateName = (code: string | null | undefined) =>
  code ? BR_STATES[code] ?? code : "Unknown";

// "bed_bath_table" → "Bed Bath Table"; tolerates null/undefined categories.
export const prettyCategory = (raw: string | null | undefined) =>
  (raw ?? "unknown").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
