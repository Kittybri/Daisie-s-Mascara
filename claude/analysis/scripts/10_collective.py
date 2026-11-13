"""Collective defense: what is a shared 'seen-before' memory worth, pooled versus isolated?

A fingerprint = the exact combination of 26 page-structure signals (same definition as 06_templates.py).
A sighting    = one host observed serving one fingerprint, together with its label.
The rule      = block a page if its fingerprint was already seen on >= m other phishing hosts and on no legitimate host.

A. Hold-out view   : a defender's knowledge base holds a random share f of all hosts; tested on the hosts outside it.
B. Ceiling         : everything pooled (leave-one-host-out).
C. Arrival view    : hosts arrive in random order; the same stream of sightings is pooled in one list
                     or split at random among N isolated lists that never talk to each other.
D. Known-site list : URLSimilarityIndex = 100, crossed with the pooled memory.

Usage: python -I 10_collective.py <parquet> <out_dir>
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

SEED = 20261113
R = 30  # random repetitions per setting
MS = (1, 2, 3)  # sightings needed before a fingerprint is listed
SHARES = (0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 0.80)
NS = (1, 2, 5, 10, 20, 50, 100, 200, 500, 1000)

df = pd.read_parquet(sys.argv[1])
out = Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
y = df["Phishing"].astype(int).to_numpy()
P, L = y == 1, y == 0
PAGE = [
    "LineOfCode", "LargestLineLength", "HasTitle", "DomainTitleMatchScore", "URLTitleMatchScore", "HasFavicon",
    "Robots", "IsResponsive", "NoOfURLRedirect", "NoOfSelfRedirect", "HasDescription", "NoOfPopup", "NoOfiFrame",
    "HasExternalFormSubmit", "HasSocialNet", "HasSubmitButton", "HasHiddenFields", "HasPasswordField", "Bank",
    "Pay", "Crypto", "HasCopyrightInfo", "NoOfImage", "NoOfCSS", "NoOfJS", "NoOfSelfRef", "NoOfEmptyRef",
    "NoOfExternalRef",
]
STRUCT = [c for c in PAGE if c not in ("DomainTitleMatchScore", "URLTitleMatchScore")]
fp = pd.factorize(pd.util.hash_pandas_object(df[STRUCT], index=False).to_numpy())[0].astype(np.int64)
host = pd.factorize(df["Domain_ID"])[0].astype(np.int64)
nF, nH = int(fp.max()) + 1, int(host.max()) + 1
n_ph, n_lg = int(P.sum()), int(L.sum())
sub = df["LineOfCode"].to_numpy() > 20  # 'substantive' pages, as in 06_templates.py
mixed_hosts = int((pd.Series(y).groupby(host).nunique() > 1).sum())
print(f"rows {len(df):,} | phishing {n_ph:,} | legitimate {n_lg:,} | hosts {nH:,} | fingerprints {nF:,} | structure signals {len(STRUCT)}")
print(f"hosts carrying both labels: {mixed_hosts} | legitimate rows per legitimate host: max {int(pd.Series(host[L]).value_counts().max())}")

# sightings: unique (fingerprint, host) pairs per label, with the number of pages (rows) behind each
pairs = pd.DataFrame({"fp": fp, "host": host, "y": y, "sub": sub.astype(int)}).groupby(["fp", "host", "y"], as_index=False).agg(rows=("sub", "size"), sub_rows=("sub", "sum"))
pp, lp = pairs[pairs.y == 1], pairs[pairs.y == 0]
ph_fp, ph_host, ph_rows, ph_sub = (pp[c].to_numpy().astype(np.int64) for c in ("fp", "host", "rows", "sub_rows"))
lg_fp, lg_host, lg_rows = (lp[c].to_numpy().astype(np.int64) for c in ("fp", "host", "rows"))
print(f"phishing sightings (host x fingerprint): {len(pp):,} | legitimate sightings: {len(lp):,}")
assert ph_rows.sum() == n_ph and lg_rows.sum() == n_lg

rng = np.random.default_rng(SEED)
res = {"seed": SEED, "reps": R, "n_phish": n_ph, "n_legit": n_lg, "n_hosts": nH, "n_struct": len(STRUCT), "mixed_hosts": mixed_hosts}


def kth_smallest(group, value, n_groups, k):
    """k-th smallest value (1-based) within each group id; inf where the group has fewer than k values."""
    order = np.lexsort((value, group))
    g, v = group[order], value[order]
    start = np.r_[0, np.flatnonzero(g[1:] != g[:-1]) + 1]
    pos = np.arange(len(g)) - np.repeat(start, np.diff(np.r_[start, len(g)]))
    res_ = np.full(n_groups, np.inf)
    sel = pos == k - 1
    res_[g[sel]] = v[sel]
    return res_


def summ(a):
    a = np.asarray(a, dtype=float)
    return dict(mean=float(a.mean()), min=float(a.min()), max=float(a.max()))


# ---------------------------------------------------------------- A. hold-out view
print("\n=== A. HOLD-OUT VIEW: a knowledge base holding a random share of all hosts, tested on the hosts outside it ===")
print(f"({R} random draws per setting; 'caught' = share of held-out phishing pages whose structure is on the list; mean [min-max])")
accA = {m: {f: [] for f in SHARES} for m in MS}
for _ in range(R):
    rank = rng.random(nH)
    first_legit = np.full(nF, np.inf)
    np.minimum.at(first_legit, lg_fp, rank[lg_host])
    rrow, u_row = rank[host], first_legit[fp]
    for m in MS:
        t_row = kth_smallest(ph_fp, rank[ph_host], nF, m)[fp]
        for f in SHARES:
            test = rrow >= f
            hit = test & (t_row < f) & (u_row >= f)
            accA[m][f].append((hit[P].sum() / (test & P).sum(), hit[L].sum(), (test & L).sum()))
res["holdout"] = {}
for m in MS:
    print(f"\n  listed after {m} sighting(s) on phishing hosts:")
    res["holdout"][m] = {}
    for f in SHARES:
        a = np.array(accA[m][f], dtype=float)
        rc, fa, nl = summ(a[:, 0]), summ(a[:, 1]), a[:, 2].mean()
        res["holdout"][m][f"{f:g}"] = dict(recall=rc, false_alarms=fa, legit_tested=float(nl), fa_rate=float(fa["mean"] / nl))
        print(f"    share of hosts known {f:7.1%} | caught {rc['mean']:7.2%} [{rc['min']:6.2%}-{rc['max']:6.2%}] | false alarms {fa['mean']:5.2f} avg, {int(fa['max'])} max, of {nl:,.0f} legitimate pages tested")

# ---------------------------------------------------------------- B. ceiling
print("\n=== B. CEILING: everything pooled (leave-one-host-out) ===")
n_ph_hosts = np.bincount(ph_fp, minlength=nF)
n_lg_hosts = np.bincount(lg_fp, minlength=nF)
res["ceiling"], res["list_size"] = {}, {}
for m in MS:
    ok = (n_ph_hosts[fp] - 1 >= m) & (n_lg_hosts[fp] == 0)
    listed = (n_ph_hosts >= m + 1) & (n_lg_hosts == 0)
    res["ceiling"][m] = float(ok[P].mean())
    res["list_size"][m] = int(listed.sum())
    print(f"  structure seen on >= {m} OTHER phishing hosts and on no legitimate host: {ok[P].mean():.3%} of phishing pages ({int(ok[P].sum()):,}) | fingerprints that qualify: {int(listed.sum()):,}")
all_ph = (n_ph_hosts >= 1) & (n_lg_hosts == 0)
print(f"  all-phishing fingerprints: {int(all_ph.sum()):,} | seen on >= 3 hosts: {int(((n_ph_hosts >= 3) & (n_lg_hosts == 0)).sum()):,} | fingerprints seen on both a phishing and a legitimate host: {int(((n_ph_hosts >= 1) & (n_lg_hosts >= 1)).sum())}")
res["n_all_phish_fp"] = int(all_ph.sum())
res["n_fp_3plus"] = int(((n_ph_hosts >= 3) & (n_lg_hosts == 0)).sum())

# ---------------------------------------------------------------- C. arrival view
print("\n=== C. ARRIVAL VIEW: the same stream of sightings, pooled in one list or split among N isolated lists ===")
print("(hosts arrive in random order and are assigned at random to one of N equal defenders; a page is 'recognized' on arrival if its")
print(f" structure was already seen on >= m earlier phishing hosts in the same list and on no earlier legitimate host; {R} random draws; mean [min-max];")
print(f" 'not recognized' is out of {n_ph:,} phishing pages; false alarms are out of {n_lg:,} legitimate pages)")
BIG = np.iinfo(np.int64).max
accC = {m: {N: [] for N in NS} for m in MS}
for _ in range(R):
    arrival = rng.permutation(nH).astype(np.int64)
    for N in NS:
        silo = rng.integers(0, N, nH) if N > 1 else np.zeros(nH, dtype=np.int64)
        kp, ap = silo[ph_host] * nF + ph_fp, arrival[ph_host]
        order = np.lexsort((ap, kp))
        ks, as_ = kp[order], ap[order]
        start = np.r_[0, np.flatnonzero(ks[1:] != ks[:-1]) + 1]
        pos = np.empty(len(ks), dtype=np.int64)
        pos[order] = np.arange(len(ks)) - np.repeat(start, np.diff(np.r_[start, len(ks)]))  # earlier phishing hosts, same list, same structure
        kl, al = silo[lg_host] * nF + lg_fp, arrival[lg_host]
        keep = np.isin(kl, ks)
        fl = pd.Series(al[keep]).groupby(kl[keep]).min()  # first legitimate sighting of a structure that phishing also uses
        fl_p = np.full(len(kp), BIG)
        if len(fl):
            idx = pd.Index(fl.index).get_indexer(kp)
            fl_p[idx >= 0] = fl.to_numpy()[idx[idx >= 0]]
        for m in MS:
            blocked = (pos >= m) & (fl_p > ap)
            fa = 0
            for k, a in fl.items():  # a legitimate page is wrongly blocked if >= m phishing hosts with its structure came first
                lo, hi = np.searchsorted(ks, k, "left"), np.searchsorted(ks, k, "right")
                fa += int(np.searchsorted(as_[lo:hi], a, "left") >= m)
            accC[m][N].append((ph_rows[blocked].sum() / n_ph, ph_sub[blocked].sum() / ph_sub.sum(), fa))
res["arrival"] = {}
for m in MS:
    print(f"\n  listed after {m} sighting(s) on phishing hosts:")
    res["arrival"][m] = {}
    for N in NS:
        a = np.array(accC[m][N], dtype=float)
        rc, rs, fa = summ(a[:, 0]), summ(a[:, 1]), summ(a[:, 2])
        res["arrival"][m][str(N)] = dict(recall=rc, recall_substantive=rs, false_alarms=fa, let_through=float((1 - rc["mean"]) * n_ph))
        who = "one pooled list          " if N == 1 else f"split among {N:5,d} lists "
        print(f"    {who}| recognized {rc['mean']:7.2%} [{rc['min']:6.2%}-{rc['max']:6.2%}] | pages >20 lines {rs['mean']:7.2%} | not recognized {(1 - rc['mean']) * n_ph:7,.0f} | false alarms {fa['mean']:4.2f} avg, {int(fa['max'])} max")
a1, a100 = res["arrival"][3]["1"]["recall"]["mean"], res["arrival"][3]["100"]["recall"]["mean"]
print(f"\n  headline (3 sightings): pooled {a1:.1%} vs 1-of-100 isolated {a100:.1%} = {a1 / a100:.1f}x | extra pages not recognized when isolated: {(a1 - a100) * n_ph:,.0f} of {n_ph:,}")
res["headline"] = dict(pooled=a1, iso100=a100, ratio=float(a1 / a100), extra_pages=float((a1 - a100) * n_ph), iso10=res["arrival"][3]["10"]["recall"]["mean"], iso1000=res["arrival"][3]["1000"]["recall"]["mean"])

# ---------------------------------------------------------------- D. known-site list x pooled memory
print("\n=== D. KNOWN-SITE LIST (URLSimilarityIndex = 100) crossed with pooled memory (leave-one-host-out, 3 sightings) ===")
known = df["URLSimilarityIndex"].to_numpy() == 100
seen = (n_ph_hosts[fp] - 1 >= 3) & (n_lg_hosts[fp] == 0)
res["states"] = {}
for nm, mask in (("known site", known), ("not a known site, structure seen before", ~known & seen), ("not a known site, structure not seen before", ~known & ~seen)):
    res["states"][nm] = dict(phish=int((mask & P).sum()), legit=int((mask & L).sum()))
    print(f"  {nm:45s} | phishing {int((mask & P).sum()):7,d} ({(mask & P).sum() / n_ph:7.3%} of phishing) | legitimate {int((mask & L).sum()):7,d} ({(mask & L).sum() / n_lg:8.3%} of legitimate)")
kp_ = known & P
res["known_phish"] = dict(n=int(kp_.sum()), seen=int((kp_ & seen).sum()), share_seen=float((kp_ & seen).sum() / max(kp_.sum(), 1)))
res["unknown_share_phish"] = float((~known & P).sum() / n_ph)
print(f"  of the {int(kp_.sum())} phishing pages that pass the known-site check, pooled memory recognizes {int((kp_ & seen).sum())} ({(kp_ & seen).sum() / max(kp_.sum(), 1):.1%})")
print(f"  share of phishing URLs that are not on the known-site list, whatever the page looks like: {(~known & P).sum() / n_ph:.2%}")
print(f"  legitimate pages whose structure no other host shares: {(( (n_ph_hosts + n_lg_hosts)[fp] == 1) & L).sum() / n_lg:.2%}")

json.dump(res, open(out / "collective.json", "w"), indent=1, default=float)
print("\nsaved collective.json")
