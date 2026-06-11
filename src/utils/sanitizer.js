export function sanitizeForAI(text) {
  return text
    .replace(/[\d,]+(\.\d+)?/g, '')
    .replace(/₹|rs\.?\s*|inr|\$|€|£|¥/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}
