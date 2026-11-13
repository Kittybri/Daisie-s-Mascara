"""How does the recommended layered design hold up under each attacker upgrade?

Layer 1: URL-only score above the strict block threshold (<=0.01% of legit flagged)
Layer 2: 'seen-before page' fingerprint (assumed to match nothing once a page is cloned from a unique real page)
Layer 3: URL+page model >= 0.5
Usage: python -I 08_layered_stress.py <model_out_dir> <facts.json>
"""
import json, sys
from pathlib import Path
import numpy as np, pandas as pd

mdir = Path(sys.argv[1]); F = json.load(open(sys.argv[2]))
oof = pd.read_parquet(mdir / "oof.parquet"); sp = pd.read_parquet(mdir / "stress_preds.parquet")
res = json.load(open(mdir / "results.json"))
y = oof["y"].to_numpy(); P = y == 1; L = y == 0
t_block = F["layers"]["t_block"]; levels = res["stress_levels"]
t_comb_001 = res["stress"]["combined"]["threshold"]; t_url_001 = res["stress"]["url"]["threshold"]
out = {}
print(f"thresholds: layer-1 URL block > {t_block:.4f} | layer-3 URL+page >= 0.5 | single best model >= {t_comb_001:.4f} (<=0.1% false alarms)")
print(f"legit flagged by layers 1+3 today: {int((((oof.p_url > t_block) | (oof.p_combined >= 0.5)) & L).sum())} of {int(L.sum())}")
for lv in levels:
    u = sp[f"url|{lv}"].to_numpy()[P]; c = sp[f"combined|{lv}"].to_numpy()[P]
    l1 = u > t_block; l13 = l1 | (c >= 0.5); single = c >= t_comb_001
    out[lv] = dict(layer1=float(l1.mean()), layers13=float(l13.mean()), single_best=float(single.mean()), single_best_at_half=float((c >= 0.5).mean()), url_at_001=float((u >= t_url_001).mean()))
    print(f"{lv:68s} layer 1 alone {l1.mean():.2%} | layers 1+3 {l13.mean():.2%} | single best model {single.mean():.2%} (at 0.5: {(c >= 0.5).mean():.2%}) | URL-only model at <=0.1% FA {(u >= t_url_001).mean():.2%}")
F["layered_stress"] = out
json.dump(F, open(sys.argv[2], "w"), indent=1, default=float)
