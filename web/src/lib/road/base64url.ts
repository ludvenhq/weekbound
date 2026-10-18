// Base64url (RFC 4648 section 5) with no padding, written out by hand so the addon's Lua decoder
// can follow it line by line. Decoding is strict: one spelling per byte string, so the website
// and the addon accept exactly the same codes.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const VALUES = new Map([...ALPHABET].map((char, value) => [char, value]));

export function toBase64Url(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const group = (a << 16) | (b << 8) | c;
    const left = bytes.length - i;
    out += ALPHABET[(group >> 18) & 63];
    out += ALPHABET[(group >> 12) & 63];
    if (left > 1) out += ALPHABET[(group >> 6) & 63];
    if (left > 2) out += ALPHABET[group & 63];
  }
  return out;
}

// Null when the text is not canonical base64url: a character outside the alphabet (padding
// included), a length that leaves one character over, or set bits after the last whole byte.
export function fromBase64Url(text: string): Uint8Array | null {
  if (text.length % 4 === 1) return null;
  const out = new Uint8Array(Math.floor((text.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < text.length; i += 4) {
    const chunk = text.slice(i, i + 4);
    let group = 0;
    for (let k = 0; k < 4; k++) {
      const char = chunk[k];
      const value = char === undefined ? 0 : VALUES.get(char);
      if (value === undefined) return null;
      group = (group << 6) | value;
    }
    if (chunk.length === 2 && (group & 0xffff) !== 0) return null;
    if (chunk.length === 3 && (group & 0xff) !== 0) return null;
    out[o++] = (group >> 16) & 255;
    if (chunk.length > 2) out[o++] = (group >> 8) & 255;
    if (chunk.length > 3) out[o++] = group & 255;
  }
  return out;
}
