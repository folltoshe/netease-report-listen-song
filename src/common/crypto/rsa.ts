/** Public modulus N (256-bit) embedded in libbilog.so. */
const RSA_N = 0xfd90bd466ff9bc8a3fec2fbcf263b90d5c564879fa5d7aab89b31c1d5cb4139dn
/** Public exponent e. */
const RSA_E = 65537n
/** Factor p of N (via FactorDB). */
const RSA_P = 337838269511367116547262517807543394287n
/** Factor q of N (via FactorDB). */
const RSA_Q = 339484579896250424463517790785600633139n

const modInverse = (a: bigint, m: bigint): bigint => {
  let [old_r, r] = [a % m, m]
  let [old_s, s] = [1n, 0n]
  while (r !== 0n) {
    const quotient = old_r / r
    ;[old_r, r] = [r, old_r - quotient * r]
    ;[old_s, s] = [s, old_s - quotient * s]
  }
  return ((old_s % m) + m) % m
}

const modPow = (base: bigint, exp: bigint, mod: bigint): bigint => {
  let result = 1n
  base %= mod
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod
    base = (base * base) % mod
    exp >>= 1n
  }
  return result
}

const beToBig = (buf: Buffer): bigint => {
  let n = 0n
  for (const b of buf) n = (n << 8n) | BigInt(b)
  return n
}

const bigToBe = (n: bigint, len: number): Buffer => {
  const out = Buffer.alloc(len)
  for (let i = len - 1; i >= 0; i--) {
    out[i] = Number(n & 0xffn)
    n >>= 8n
  }
  return out
}

const RSA_D = modInverse(RSA_E, (RSA_P - 1n) * (RSA_Q - 1n))

/**
 * Wrap a 32-byte record key (KEY_A) into KEY_B = KEY_A^e mod N (raw RSA, big-endian).
 * KEY_A must be < N; callers should clamp its first byte to <= 0xA2.
 */
export const rsaWrap = (keyA: Buffer): Buffer => {
  return bigToBe(modPow(beToBig(keyA), RSA_E, RSA_N), 32)
}

/**
 * Recover the 32-byte record key (KEY_A) from the wrapped KEY_B = KEY_A^d mod N.
 */
export const rsaUnWrap = (keyB: Buffer): Buffer => {
  return bigToBe(modPow(beToBig(keyB), RSA_D, RSA_N), 32)
}
