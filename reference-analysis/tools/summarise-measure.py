"""Print a compact, human-readable tree of a capture-component measure file.

    python reference-analysis/tools/summarise-measure.py <measure.json> [maxDepth]
"""
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")
path = sys.argv[1]
max_depth = int(sys.argv[2]) if len(sys.argv) > 2 else 99
d = json.load(open(path, encoding="utf-8"))
r = d["root"]
print("root", r["tag"], r["cls"][:60], r["rect"], "pad", r["box"]["paddingTop"], r["box"]["paddingLeft"], "bg", r["box"]["backgroundColor"])
SKIP = (None, "none", "0px", "normal", "rgba(0, 0, 0, 0)", "block", "0px 0px 0px 0px", "auto", "static", "visible", "1")
KEYS = ["backgroundColor", "borderRadius", "borderTopWidth", "borderTopColor", "boxShadow", "paddingTop", "paddingLeft", "gap", "gridTemplateColumns", "display", "opacity", "transform", "maxWidth"]
for n in d["nodes"]:
    if n["depth"] > max_depth:
        continue
    b = n["box"]
    t = n.get("typo") or {}
    keep = [k for k in KEYS if b.get(k) not in SKIP]
    bs = " ".join(f"{k}={str(b[k])[:38]}" for k in keep)
    ts = f" | {t.get('fontFamily','')[:16]} {t.get('fontSize')} {t.get('fontWeight')} lh={t.get('lineHeight')} ls={t.get('letterSpacing')} {t.get('color')} {t.get('textTransform')}" if t else ""
    m = n["motion"]
    ms = f" | tr={m['transitionProperty'][:30]} {m['transitionDuration']} {m['transitionTimingFunction'][:34]}" if m["transitionDuration"] not in ("0s",) else ""
    an = f" | anim={m['animationName']} {m['animationDuration']} {m['animationIterationCount']}" if m["animationName"] not in ("none",) else ""
    txt = f' "{n["text"][:44]}"' if n.get("text") else ""
    svg = f" svg viewBox={n['svg']['viewBox']} paths={n['svg']['paths']}" if n.get("svg") else ""
    print(f"{'  ' * n['depth']}[{n['path']}] {n['tag']}.{n['cls'][:30]} {n['rel']}{txt} {bs}{ts}{ms}{an}{svg}")
print("keyframes:", [k["name"] for k in d["keyframes"]])
print("fonts:", d["fonts"])
