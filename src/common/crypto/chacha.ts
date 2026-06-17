const SIGMA = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]

const rotl = (x: number, n: number): number => ((x << n) | (x >>> (32 - n))) >>> 0

const quarterRound = (s: Uint32Array, a: number, b: number, c: number, d: number): void => {
  s[a] = (s[a] + s[b]) >>> 0
  s[d] ^= s[a]
  s[d] = rotl(s[d], 16)
  s[c] = (s[c] + s[d]) >>> 0
  s[b] ^= s[c]
  s[b] = rotl(s[b], 12)
  s[a] = (s[a] + s[b]) >>> 0
  s[d] ^= s[a]
  s[d] = rotl(s[d], 8)
  s[c] = (s[c] + s[d]) >>> 0
  s[b] ^= s[c]
  s[b] = rotl(s[b], 7)
}

const block = (key: Buffer, counter: number, nonce: Buffer): Buffer => {
  const state = new Uint32Array(16)
  state[0] = SIGMA[0]
  state[1] = SIGMA[1]
  state[2] = SIGMA[2]
  state[3] = SIGMA[3]
  for (let i = 0; i < 8; i++) state[4 + i] = key.readUInt32LE(i * 4)
  state[12] = counter >>> 0
  state[13] = nonce.readUInt32LE(0)
  state[14] = nonce.readUInt32LE(4)
  state[15] = nonce.readUInt32LE(8)

  const work = state.slice()
  for (let i = 0; i < 10; i++) {
    quarterRound(work, 0, 4, 8, 12)
    quarterRound(work, 1, 5, 9, 13)
    quarterRound(work, 2, 6, 10, 14)
    quarterRound(work, 3, 7, 11, 15)
    quarterRound(work, 0, 5, 10, 15)
    quarterRound(work, 1, 6, 11, 12)
    quarterRound(work, 2, 7, 8, 13)
    quarterRound(work, 3, 4, 9, 14)
  }

  const out = Buffer.allocUnsafe(64)
  for (let i = 0; i < 16; i++) out.writeUInt32LE((work[i] + state[i]) >>> 0, i * 4)
  return out
}

export const chacha20 = (key: Buffer, counter: number, nonce: Buffer, data: Buffer): Buffer => {
  const out = Buffer.allocUnsafe(data.length)
  for (let off = 0; off < data.length; off += 64) {
    const ks = block(key, (counter + (off >>> 6)) >>> 0, nonce)
    const end = Math.min(off + 64, data.length)
    for (let i = off; i < end; i++) out[i] = data[i] ^ ks[i - off]
  }
  return out
}
