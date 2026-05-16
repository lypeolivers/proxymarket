import { z } from 'zod';

/** Códigos oficiais das UFs brasileiras (27 unidades federativas). */
export const BRAZIL_UF_CODES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

export type TBrazilUf = (typeof BRAZIL_UF_CODES)[number];

export const BrazilUf = z.enum(BRAZIL_UF_CODES);

/** Cidade: trim e vazio torna-se null quando o campo existe. */
export const CustomerCityField = z.preprocess((raw: unknown) => {
  if (raw === null || raw === undefined || raw === '') return null;
  return String(raw).trim() || null;
}, z.union([z.string().max(120, 'Informe até 120 caracteres na cidade.'), z.null()]));

/** UF: uppercase; null / vazio vira null. */
export const CustomerStateField = z.preprocess((raw: unknown) => {
  if (raw === null || raw === undefined || raw === '') return null;
  return String(raw).trim().toUpperCase();
}, BrazilUf.nullable());
