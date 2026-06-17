"""
Analyze decrypted samples: group log records by logType (_log_thoroughfare)
and find which field values are constant within and shared across logTypes.
"""
import glob
import json
import os
import struct
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Reuse the decryptor primitives from single.py (without running its CLI).
_src = open(os.path.join(ROOT, "script", "single.py")).read().split("def main")[0]
_ns = {}
exec(_src, _ns)
extract_ncbl_parts = _ns["extract_ncbl_parts"]
parse_header = _ns["parse_header"]
recover_record_key = _ns["recover_record_key"]
decrypt_records = _ns["decrypt_records"]


def iter_records():
    """
    Yield (logType, action, time, json_obj) for every record across all samples.
    """
    for path in sorted(glob.glob(os.path.join(ROOT, "sample", "ori", "*"))):
        if not os.path.isfile(path):
            continue
        body = open(path, "rb").read()
        for p in extract_ncbl_parts(body):
            hdr = parse_header(p)
            key_a = recover_record_key(hdr["key_b"])
            logs = decrypt_records(p, hdr, key_a)
            for line in logs.split(b"\n"):
                if not line.strip():
                    continue
                fields = line.split(b"\x01", 2)
                if len(fields) != 3:
                    continue
                t = fields[0].decode("utf-8", "replace")
                action = fields[1].decode("utf-8", "replace")
                try:
                    obj = json.loads(fields[2].decode("utf-8"))
                except Exception:
                    obj = {}
                lt = obj.get("_log_thoroughfare", "?")
                yield lt, action, t, obj


# Collect per-logType key -> set of distinct json-serialized values.
by_type = defaultdict(lambda: defaultdict(set))
actions = defaultdict(set)
counts = defaultdict(int)
for lt, action, t, obj in iter_records():
    counts[lt] += 1
    actions[lt].add(action)
    for k, v in obj.items():
        by_type[lt][k].add(json.dumps(v, ensure_ascii=False, sort_keys=True))

types = sorted(by_type)
print("=== logType overview ===")
for lt in types:
    print(f"  {lt:16} records={counts[lt]:4}  fields={len(by_type[lt]):3}  actions={sorted(actions[lt])}")

# Fields that are constant (single value) within each logType.
const_in = {lt: {k: next(iter(vs)) for k, vs in by_type[lt].items() if len(vs) == 1} for lt in types}

# Fields present (as a key) in every logType.
common_keys = set.intersection(*[set(by_type[lt]) for lt in types]) if types else set()

print("\n=== fields present in ALL logTypes ===")
print(" ", sorted(common_keys))

print("\n=== values CONSTANT within each logType AND identical across ALL logTypes ===")
shared = []
for k in sorted(common_keys):
    vals = {const_in[lt].get(k) for lt in types}
    if len(vals) == 1 and None not in vals:
        shared.append(k)
        v = next(iter(vals))
        sv = v if len(v) <= 80 else v[:77] + "..."
        print(f"  {k:24} = {sv}")

print("\n=== keys constant-in-each-type but value DIFFERS by logType ===")
for k in sorted(common_keys):
    if k in shared:
        continue
    if all(k in const_in[lt] for lt in types):
        per = {lt: (const_in[lt][k] if len(const_in[lt][k]) <= 40 else const_in[lt][k][:37] + "...") for lt in types}
        print(f"  {k:24} {per}")

# ---- extended analysis ----
print("\n=== GLOBAL constant fields (same value in EVERY record that has the key) ===")
all_vals = defaultdict(set)
key_recordcount = defaultdict(int)
total = 0
for lt, action, t, obj in iter_records():
    total += 1
    for k, v in obj.items():
        all_vals[k].add(json.dumps(v, ensure_ascii=False, sort_keys=True))
        key_recordcount[k] += 1
for k in sorted(all_vals):
    if len(all_vals[k]) == 1:
        cov = key_recordcount[k]
        v = next(iter(all_vals[k]))
        sv = v if len(v) <= 70 else v[:67] + "..."
        print(f"  {k:26} cov={cov:4}/{total}  = {sv}")

print("\n=== high-coverage common keys with few distinct values (candidate session vars) ===")
for k in sorted(all_vals):
    nd = len(all_vals[k])
    cov = key_recordcount[k]
    if cov >= total * 0.5 and 1 < nd <= 5:
        vs = [s if len(s) <= 50 else s[:47] + '...' for s in sorted(all_vals[k])]
        print(f"  {k:26} cov={cov:4}/{total} distinct={nd} -> {vs}")

# meta block consistency
print("\n=== meta block across samples ===")
metas = set()
for path in sorted(glob.glob(os.path.join(ROOT, 'sample', 'ori', '*'))):
    if not os.path.isfile(path):
        continue
    body = open(path, 'rb').read()
    for p in extract_ncbl_parts(body):
        hdr = parse_header(p)
        key_a = recover_record_key(hdr['key_b'])
        meta = _ns['decrypt_metadata'](p, hdr)
        metas.add(meta.decode('utf-8', 'replace'))
print(f"  distinct meta blocks: {len(metas)}")
for m in list(metas)[:2]:
    obj = json.loads(m)
    print("   keys:", list(obj), "| appver:", obj.get('appver'), "buildver:", obj.get('buildver'))
