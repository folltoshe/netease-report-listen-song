import { randomBytes } from 'node:crypto'
import { zstdCompressSync, zstdDecompressSync } from 'node:zlib'

import { chacha20 } from './chacha'
import { rsaUnWrap, rsaWrap } from './rsa'

const MAGIC = Buffer.from('NCBL', 'ascii')

const VERSION = 3

const HEADER_FIXED_LEN = 70

const META_BLOCK_TYPE = 0x4343

// keep each frame payload within the u16 length field
const DEFAULT_MAX_FRAME = 0x8000

export interface NcblParts {
  /** Device / auth metadata block plaintext (caller-built JSON). */
  meta: Buffer | string
  /** Log record body plaintext (caller-built via buildRecords). */
  body: Buffer | string
}

export interface EncryptOptions {
  /** 32-byte record key; default random with first byte clamped to <= 0xA2. */
  keyA?: Buffer
  /** 16-byte uuid used for nonce/counter; default random UUIDv4-style. */
  uuid?: Buffer
  /** First record sequence number; default random. */
  baseSeq?: number
  /** Max bytes of compressed body per record frame; default 0x8000. */
  maxFrame?: number
}

export interface DecryptResult {
  meta: Buffer
  body: Buffer
  extra: {
    version: number
    headerLen: number
    uuid: Buffer
    nonce: Buffer
    counter: number
    keyB: Buffer
    keyA: Buffer
    firstSeq: number
    lastSeq: number
  }
}

const deriveNonceCounter = (data: Buffer): { nonce: Buffer; counter: number } => ({
  nonce: data.subarray(0, 12),
  counter: data.readUInt32LE(12) >>> 2,
})

/**
 * Encode NCBL bytes from caller-supplied metadata and log body.
 */
export const encrypt = (parts: NcblParts, options: EncryptOptions = {}): Buffer => {
  const meta = Buffer.isBuffer(parts.meta) ? parts.meta : Buffer.from(parts.meta, 'utf-8')
  const body = Buffer.isBuffer(parts.body) ? parts.body : Buffer.from(parts.body, 'utf-8')
  const maxFrame = options.maxFrame ?? DEFAULT_MAX_FRAME

  const keyA = options.keyA ?? randomBytes(32)
  if (keyA[0] >= 0xa3) {
    // ensure KEY_A < N for raw RSA
    keyA[0] = 0xa2
  }

  const keyB = rsaWrap(keyA)

  const uuid = options.uuid ?? randomBytes(16)
  if (!options.uuid) {
    uuid[6] = (uuid[6] & 0x0f) | 0x40 // version 4
    uuid[8] = (uuid[8] & 0x3f) | 0x80 // variant
  }
  const { nonce, counter } = deriveNonceCounter(uuid)
  const baseSeq = options.baseSeq ?? randomBytes(2).readUInt16LE(0)

  // Metadata block (type 0x4343), encrypted with KEY_B.
  const metaCipher = chacha20(keyB, counter, nonce, meta)
  const metaBlock = Buffer.concat([
    (() => {
      const h = Buffer.allocUnsafe(4)
      h.writeUInt16LE(META_BLOCK_TYPE, 0)
      h.writeUInt16LE(metaCipher.length, 2)
      return h
    })(),
    metaCipher,
  ])
  const headerLen = HEADER_FIXED_LEN + metaBlock.length

  // Record frames: one ZSTD stream split into <= maxFrame slices, each encrypted with KEY_A.
  const compressed = zstdCompressSync(body)

  const frames: Buffer[] = []
  let seq = baseSeq
  for (let off = 0; off < compressed.length || off === 0; off += maxFrame) {
    const slice = compressed.subarray(off, off + maxFrame)
    const cipher = chacha20(keyA, counter, nonce, slice)
    const head = Buffer.allocUnsafe(6)
    head.writeUInt16LE(cipher.length, 0)
    head.writeUInt32LE(seq >>> 0, 2)
    frames.push(head, cipher)
    seq++
    if (compressed.length === 0) {
      break
    }
  }

  const trailing = Buffer.concat(frames)
  const frameCount = seq - baseSeq

  const header = Buffer.alloc(HEADER_FIXED_LEN)
  MAGIC.copy(header, 0)
  header.writeUInt32LE(VERSION, 4)
  header.writeUInt16LE(headerLen, 8)
  uuid.copy(header, 10)
  keyB.copy(header, 26)
  header.writeUInt32LE(baseSeq >>> 0, 58) // first record seq
  header.writeUInt32LE((baseSeq + frameCount - 1) >>> 0, 62) // last record seq
  header.writeUInt32LE(trailing.length, 66) // trailing region length

  return Buffer.concat([header, metaBlock, trailing])
}

/**
 * Decode an NCBL payload into its metadata and log body.
 */
export const decrypt = (payload: Buffer): DecryptResult => {
  if (!payload.subarray(0, 4).equals(MAGIC)) {
    throw new Error('not an NCBL payload')
  }

  const version = payload.readUInt32LE(4)
  const headerLen = payload.readUInt16LE(8)
  const uuid = payload.subarray(10, 26)
  const keyB = payload.subarray(26, 58)
  const firstSeq = payload.readUInt32LE(58)
  const lastSeq = payload.readUInt32LE(62)

  const keyA = rsaUnWrap(keyB)
  const { nonce, counter } = deriveNonceCounter(uuid)

  // Header metadata blocks (type 0x4343) -> KEY_B.
  const metaChunks: Buffer[] = []
  let pos = HEADER_FIXED_LEN
  while (pos + 4 <= headerLen) {
    const type = payload.readUInt16LE(pos)
    const len = payload.readUInt16LE(pos + 2)
    const data = payload.subarray(pos + 4, pos + 4 + len)
    if (type === META_BLOCK_TYPE) metaChunks.push(chacha20(keyB, counter, nonce, data))
    pos += 4 + len
  }

  // Trailing record frames -> KEY_A; concatenated plaintext is one ZSTD stream.
  const trailing = payload.subarray(headerLen)
  const recordChunks: Buffer[] = []
  pos = 0
  while (pos + 6 <= trailing.length) {
    const len = trailing.readUInt16LE(pos)
    const data = trailing.subarray(pos + 6, pos + 6 + len)
    recordChunks.push(chacha20(keyA, counter, nonce, data))
    pos += 6 + len
  }

  const compressed = Buffer.concat(recordChunks)
  const body = compressed.length ? zstdDecompressSync(compressed) : Buffer.alloc(0)

  return {
    meta: Buffer.concat(metaChunks),
    body,
    extra: {
      version,
      headerLen,
      uuid: Buffer.from(uuid),
      nonce: Buffer.from(nonce),
      counter,
      keyB: Buffer.from(keyB),
      keyA,
      firstSeq,
      lastSeq,
    },
  }
}
