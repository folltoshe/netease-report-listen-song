#!/usr/bin/env python3
"""
Batch-decrypt every sample under sample/ into dist/<id>/.

For each sample the folder name is the number inside [] in the filename.
Each folder gets:
  header.txt  - decrypted metadata block (device / auth JSON)
  body.txt    - decrypted log records (the actual log text)
  meta.txt    - analysis info: lengths, recovered keys, uuid, nonce, counter

A request body may contain several NCBL parts; extra parts are suffixed
(header.1.txt, body.1.txt, ...).
"""

import glob
import json
import os
import re
import sys

# Reuse the decryptor implemented in 1.py.
import importlib.util

_spec = importlib.util.spec_from_file_location(
    "ncbl", os.path.join(os.path.dirname(os.path.abspath(__file__)), "single.py")
)
ncbl = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ncbl)

SAMPLE_DIR = "sample/ori"
DIST_DIR = "sample/dst"


def sample_id(name):
    """
    Extract the leading [number] id from a sample filename, else use the name.
    """
    m = re.match(r"\[(\d+)\]", name)
    return m.group(1) if m else os.path.splitext(name)[0]


def build_meta(name, idx, total, hdr, key_a, meta, logs):
    """
    Render the meta.txt content describing keys and sizes for one NCBL part.
    """
    lines = [
        f"source        : {name}",
        f"part          : {idx + 1}/{total}",
        f"magic/version : NCBL / {hdr['version']}",
        f"header_len    : {hdr['header_len']}",
        f"uuid          : {hdr['uuid'].hex()}",
        f"nonce         : {hdr['nonce'].hex()}",
        f"counter       : {hdr['counter']}",
        f"key_b_wrapped : {hdr['key_b'].hex()}",
        f"key_a_record  : {key_a.hex()}",
        f"header_len_dec: {len(meta)} bytes",
        f"body_len_dec  : {len(logs)} bytes",
    ]
    return "\n".join(lines) + "\n"


def iter_records(text):
    """
    Yield (time, action, obj) for every record in the decrypted log text.
    Records are packed back-to-back as `<time>\x01<action>\x01<json>` with no
    separator between them, so each json object is consumed with raw_decode and
    its end offset marks the start of the next record.
    """
    decoder = json.JSONDecoder()
    pos = 0
    length = len(text)
    while pos < length:
        sep1 = text.find("\x01", pos)
        sep2 = text.find("\x01", sep1 + 1) if sep1 != -1 else -1
        if sep1 == -1 or sep2 == -1:
            break
        time_s = text[pos:sep1]
        action = text[sep1 + 1:sep2]
        obj, end = decoder.raw_decode(text, sep2 + 1)
        yield time_s, action, obj
        pos = end


def split_body_to_json(out_dir, logs):
    """
    Split decrypted log records and dump each as <time>_<action>.json.
    Returns the number of json files written.
    """
    events_dir = os.path.join(out_dir, "events")
    os.makedirs(events_dir, exist_ok=True)
    seen = {}
    written = 0
    text = logs.decode("utf-8", "replace")
    for time_s, action, obj in iter_records(text):
        base = re.sub(r"[^0-9A-Za-z_.-]", "_", f"{time_s}_{action}")
        seen[base] = seen.get(base, 0) + 1
        fname = base if seen[base] == 1 else f"{base}_{seen[base]}"
        body = json.dumps(obj, ensure_ascii=False, indent=2)
        with open(os.path.join(events_dir, f"{fname}.json"), "w", encoding="utf-8") as f:
            f.write(body)
        written += 1
    return written


def write_part(out_dir, idx, total, name, hdr, key_a, meta, logs):
    """
    Write header/body/meta txt files and per-record json for one NCBL part.
    """
    suffix = "" if total == 1 else f".{idx}"
    with open(os.path.join(out_dir, f"header{suffix}.txt"), "wb") as f:
        f.write(meta)
    with open(os.path.join(out_dir, f"body{suffix}.txt"), "wb") as f:
        f.write(logs)
    with open(os.path.join(out_dir, f"meta{suffix}.txt"), "w", encoding="utf-8") as f:
        f.write(build_meta(name, idx, total, hdr, key_a, meta, logs))
    return split_body_to_json(out_dir, logs)


def main():
    """
    Walk all samples, decrypt each, and lay the results out under dist/.
    """
    paths = sorted(glob.glob(os.path.join(SAMPLE_DIR, "*")))
    if not paths:
        print(f"no samples under {SAMPLE_DIR}/", file=sys.stderr)
        return 1

    ok = fail = 0
    for path in paths:
        name = os.path.basename(path)
        sid = sample_id(name)
        out_dir = os.path.join(DIST_DIR, sid)
        try:
            results = ncbl.decrypt_file(path)
            if not results:
                raise ValueError("no NCBL part found")
            os.makedirs(out_dir, exist_ok=True)
            total = len(results)
            events = 0
            for idx, (hdr, key_a, meta, logs) in enumerate(results):
                events += write_part(out_dir, idx, total, name, hdr, key_a, meta, logs)
            ok += 1
            print(f"[OK] {sid} <- {name} ({total} part{'s' if total > 1 else ''}, {events} events)")
        except Exception as exc:  # noqa: BLE001 - report and continue
            fail += 1
            print(f"[FAIL] {sid} <- {name}: {exc}")

    print(f"\ndone: {ok} ok, {fail} failed -> {DIST_DIR}/")
    return 0 if fail == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
