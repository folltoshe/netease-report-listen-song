#!/usr/bin/env python3
"""
NCBL log decryptor for NetEase Cloud Music bilog (libbilog.so).

Reverses the on-disk / upload-body crypto:
  - ChaCha20 (RFC 8439) stream cipher.
  - Raw 256-bit RSA wrapping of the record key (factorable, key recovered below).
  - ZSTD compression of the concatenated log-record payload.

Usage:
  python 1.py [glob ...]   # default: sample/*
"""

import glob
import math
import struct
import sys
from compression import zstd

# --- Embedded RSA public key from libbilog.so @0xac830 (DER: N=256-bit, e=65537). ---
# N is only 256-bit, so it is trivially factorable (factors via FactorDB).
RSA_N = 0xFD90BD466FF9BC8A3FEC2FBCF263B90D5C564879FA5D7AAB89B31C1D5CB4139D
RSA_E = 65537
RSA_P = 337838269511367116547262517807543394287
RSA_Q = 339484579896250424463517790785600633139
RSA_D = pow(RSA_E, -1, (RSA_P - 1) * (RSA_Q - 1))

NCBL_MAGIC = b"NCBL"
ZSTD_MAGIC = b"\x28\xb5\x2f\xfd"
META_BLOCK_TYPE = 0x4343  # 'CC' metadata block inside the header.


def _rotl(x, n):
    """
    Rotate a 32-bit word left by n bits.
    """
    return ((x << n) | (x >> (32 - n))) & 0xFFFFFFFF


def _quarter_round(s, a, b, c, d):
    """
    Apply one ChaCha20 quarter-round in place on state list s.
    """
    s[a] = (s[a] + s[b]) & 0xFFFFFFFF; s[d] ^= s[a]; s[d] = _rotl(s[d], 16)
    s[c] = (s[c] + s[d]) & 0xFFFFFFFF; s[b] ^= s[c]; s[b] = _rotl(s[b], 12)
    s[a] = (s[a] + s[b]) & 0xFFFFFFFF; s[d] ^= s[a]; s[d] = _rotl(s[d], 8)
    s[c] = (s[c] + s[d]) & 0xFFFFFFFF; s[b] ^= s[c]; s[b] = _rotl(s[b], 7)


def _chacha_block(key, counter, nonce):
    """
    Produce one 64-byte ChaCha20 keystream block.
    """
    state = [0x61707865, 0x3320646E, 0x79622D32, 0x6B206574]
    state += list(struct.unpack("<8I", key))
    state += [counter]
    state += list(struct.unpack("<3I", nonce))
    work = state[:]
    for _ in range(10):
        _quarter_round(work, 0, 4, 8, 12)
        _quarter_round(work, 1, 5, 9, 13)
        _quarter_round(work, 2, 6, 10, 14)
        _quarter_round(work, 3, 7, 11, 15)
        _quarter_round(work, 0, 5, 10, 15)
        _quarter_round(work, 1, 6, 11, 12)
        _quarter_round(work, 2, 7, 8, 13)
        _quarter_round(work, 3, 4, 9, 14)
    return struct.pack("<16I", *[(work[i] + state[i]) & 0xFFFFFFFF for i in range(16)])


def chacha20(key, counter, nonce, data):
    """
    XOR data with the ChaCha20 keystream (encrypt == decrypt).
    """
    out = bytearray()
    for off in range(0, len(data), 64):
        ks = _chacha_block(key, counter, nonce)
        counter = (counter + 1) & 0xFFFFFFFF
        chunk = data[off:off + 64]
        out += bytes(a ^ b for a, b in zip(chunk, ks))
    return bytes(out)


def recover_record_key(key_b):
    """
    Recover the raw ChaCha20 record key (KEY_A) from the header-stored
    RSA-wrapped key (KEY_B) using the factored private exponent.
    """
    c = int.from_bytes(key_b, "big")
    m = pow(c, RSA_D, RSA_N)
    return m.to_bytes(32, "big")


def extract_ncbl_parts(body):
    """
    Pull every NCBL file payload out of a multipart/form-data request body.
    A single body may carry several file parts; returns a list of payloads.
    """
    if body.startswith(NCBL_MAGIC):
        return [body]
    nl = body.find(b"\r\n")
    if nl == -1 or not body.startswith(b"--"):
        return [body]
    boundary = body[:nl]
    parts = []
    for seg in body.split(boundary):
        head_end = seg.find(b"\r\n\r\n")
        if head_end == -1:
            continue
        content = seg[head_end + 4:]
        if content.endswith(b"\r\n"):
            content = content[:-2]
        if content.startswith(NCBL_MAGIC):
            parts.append(content)
    return parts


def parse_header(p):
    """
    Parse the fixed NCBL header and return its fields.
    """
    if p[:4] != NCBL_MAGIC:
        raise ValueError("not an NCBL payload")
    version = struct.unpack("<I", p[4:8])[0]
    header_len = struct.unpack("<H", p[8:10])[0]
    uuid = p[10:26]
    key_b = p[26:58]
    nonce = uuid[:12]
    counter = struct.unpack("<I", uuid[12:16])[0] >> 2
    return {
        "version": version,
        "header_len": header_len,
        "uuid": uuid,
        "key_b": key_b,
        "nonce": nonce,
        "counter": counter,
    }


def decrypt_metadata(p, hdr):
    """
    Decrypt header metadata blocks (type 0x4343) with KEY_B; returns joined bytes.
    Header blocks are framed [u16 type][u16 len][data].
    """
    out = []
    pos = 70
    while pos + 4 <= hdr["header_len"]:
        btype = struct.unpack("<H", p[pos:pos + 2])[0]
        blen = struct.unpack("<H", p[pos + 2:pos + 4])[0]
        data = p[pos + 4:pos + 4 + blen]
        if btype == META_BLOCK_TYPE:
            out.append(chacha20(hdr["key_b"], hdr["counter"], hdr["nonce"], data))
        pos += 4 + blen
    return b"".join(out)


def decrypt_records(p, hdr, key_a):
    """
    Decrypt the trailing log-record region with KEY_A, concatenate every frame
    plaintext and ZSTD-decompress it into the raw log text.
    Records are framed [u16 len][u32 type][data]; the counter resets per frame.
    """
    trailing = p[hdr["header_len"]:]
    chunks = []
    pos = 0
    while pos + 6 <= len(trailing):
        ln = struct.unpack("<H", trailing[pos:pos + 2])[0]
        data = trailing[pos + 6:pos + 6 + ln]
        chunks.append(chacha20(key_a, hdr["counter"], hdr["nonce"], data))
        pos += 6 + ln
    blob = b"".join(chunks)
    if blob[:4] == ZSTD_MAGIC:
        return zstd.ZstdDecompressor().decompress(blob)
    return blob


def decrypt_payload(p):
    """
    Decrypt one NCBL payload; returns (hdr, key_a, metadata_bytes, log_bytes).
    """
    hdr = parse_header(p)
    key_a = recover_record_key(hdr["key_b"])
    meta = decrypt_metadata(p, hdr)
    logs = decrypt_records(p, hdr, key_a)
    return hdr, key_a, meta, logs


def decrypt_file(path):
    """
    Decrypt a sample file, returning a list of per-NCBL-part results.
    """
    body = open(path, "rb").read()
    results = []
    for p in extract_ncbl_parts(body):
        hdr, key_a, meta, logs = decrypt_payload(p)
        results.append((hdr, key_a, meta, logs))
    return results


def main(argv):
    """
    Decrypt each matching sample and print a short summary plus log preview.
    """
    patterns = argv[1:] or ["sample/*"]
    paths = []
    for pat in patterns:
        paths.extend(sorted(glob.glob(pat)))
    if not paths:
        print("no files matched", file=sys.stderr)
        return 1

    for path in paths:
        name = path.rsplit("/", 1)[-1].rsplit("\\", 1)[-1]
        try:
            results = decrypt_file(path)
        except Exception as exc:  # noqa: BLE001 - report and continue
            print(f"[FAIL] {name}: {exc}")
            continue
        for i, (hdr, _key_a, meta, logs) in enumerate(results):
            tag = f"{name}#{i}" if len(results) > 1 else name
            print(f"[OK] {tag}  ver={hdr['version']} hlen={hdr['header_len']} "
                  f"meta={len(meta)}B logs={len(logs)}B")
            if meta:
                print("  meta:", meta[:120].decode("utf-8", "replace"))
            if logs:
                print("  logs:", logs[:200].decode("utf-8", "replace").replace("\x01", "|"))
        print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
