/** Extracts digits only (max `maxDigits`). */
export function extractPhoneDigits(value: string, maxDigits = 11): string {
  return value.replace(/\D/g, '').slice(0, maxDigits)
}

/**
 * Mobile: (XX) XXXXX-XXXX — rest starts with 9 (Brazil mobile).
 * Landline (10 digits): (XX) XXXX-XXXX.
 */
export function maskBrazilPhoneDigits(digits: string): string {
  const d = digits.slice(0, 11)
  if (d.length === 0) return ''

  if (d.length <= 2) {
    return `(${d}`
  }

  const ddd = d.slice(0, 2)
  const rest = d.slice(2)
  const mobileStyle = rest[0] === '9'

  if (mobileStyle || d.length === 11) {
    if (rest.length <= 5) {
      return `(${ddd}) ${rest}`
    }
    return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`
  }

  if (d.length === 10) {
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4, 8)}`
  }

  if (rest.length <= 4) {
    return `(${ddd}) ${rest}`
  }
  return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
}

/** Applies mask while typing (digits only → formatted). */
export function formatBrazilPhoneInput(raw: string): string {
  return maskBrazilPhoneDigits(extractPhoneDigits(raw, 11))
}

/**Digits for API; `null` when empty. */
export function phoneDigitsToApi(formattedOrRaw: string): string | null {
  const digits = extractPhoneDigits(formattedOrRaw, 11)
  return digits.length > 0 ? digits : null
}

/** Table / read-only display. */
export function displayBrazilPhone(value: string | null | undefined): string {
  if (value == null || value.trim() === '') return '—'
  const digits = extractPhoneDigits(value, 11)
  if (digits.length === 0) return '—'
  return maskBrazilPhoneDigits(digits)
}
