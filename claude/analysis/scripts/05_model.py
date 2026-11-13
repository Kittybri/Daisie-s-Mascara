"""Models, honest validation, hard-slice evaluation, attacker stress test, SHAP.

Positive class = phishing (label 1) everywhere.
Usage: python -I 05_model.py <parquet> <out_dir>
"""
import json
import sys
import time
import warnings
from pathlib import Path

import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, roc_auc_score, roc_curve
from sklearn.model_selection import StratifiedGroupKFold, StratifiedKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import FunctionTransformer, StandardScaler
from sklearn.tree import DecisionTreeClassifier, export_text

warnings.filterwarnings("ignore")
t0 = time.time()
df = pd.read_parquet(sys.argv[1])
out = Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
y = df["Phishing"].astype(int).to_numpy()
groups = df["Domain_ID"].to_numpy()
N = len(df)

URL = [
    "URLLength", "DomainLength", "IsDomainIP", "TLDLegitimateProb", "TLDLength", "NoOfSubDomain",
    "CharContinuationRate", "URLCharProb", "HasObfuscation", "NoOfObfuscatedChar", "ObfuscationRatio",
    "NoOfLettersInURL", "LetterRatioInURL", "NoOfDegitsInURL", "DegitRatioInURL", "NoOfEqualsInURL",
    "NoOfQMarkInURL", "NoOfAmpersandInURL", "NoOfOtherSpecialCharsInURL", "SpacialCharRatioInURL", "IsHTTPS",
]
PAGE = [
    "LineOfCode", "LargestLineLength", "HasTitle", "DomainTitleMatchScore", "URLTitleMatchScore", "HasFavicon",
    "Robots", "IsResponsive", "NoOfURLRedirect", "NoOfSelfRedirect", "HasDescription", "NoOfPopup", "NoOfiFrame",
    "HasExternalFormSubmit", "HasSocialNet", "HasSubmitButton", "HasHiddenFields", "HasPasswordField", "Bank",
    "Pay", "Crypto", "HasCopyrightInfo", "NoOfImage", "NoOfCSS", "NoOfJS", "NoOfSelfRef", "NoOfEmptyRef",
    "NoOfExternalRef",
]
LEAK = ["URLSimilarityIndex"]
SETS = {"url": URL, "page": PAGE, "combined": URL + PAGE, "combined_plus_usi": URL + PAGE + LEAK}
print(f"rows={N} phishing={y.sum()} legit={(1 - y).sum()} | URL feats={len(URL)} PAGE feats={len(PAGE)}")

# slices -----------------------------------------------------------------------------
u = df["URL_Anonymized"].astype(str)
rest = u.str.replace(r"^[a-zA-Z]+://", "", regex=True)
path = rest.str.split("/", n=1).str[1]
bare = (path.fillna("").str.len() == 0).to_numpy()
https_str = u.str.startswith("https://").to_numpy()
df["title_match"] = (df.DomainTitleMatchScore >= 50).astype(int)
M9 = ["HasSocialNet", "HasCopyrightInfo", "HasDescription", "HasFavicon", "HasSubmitButton", "IsResponsive", "Robots", "HasHiddenFields", "title_match"]
M5 = ["HasSocialNet", "HasCopyrightInfo", "HasDescription", "HasFavicon", "title_match"]
tm9 = df[M9].sum(axis=1).to_numpy()
tm5 = df[M5].sum(axis=1).to_numpy()
P = y == 1
L = y == 0
slices = {
    "all phishing": P,
    "look-alike URL (https, no path)": P & https_str & bare,
    "login page (password field)": P & (df.HasPasswordField == 1).to_numpy(),
    "polished page (>=3 of 5 trust markers)": P & (tm5 >= 3),
    "passes allow-list (USI=100)": P & (df.URLSimilarityIndex == 100).to_numpy(),
}
for k, m in slices.items():
    print(f"slice {k!r}: n_phishing={int(m.sum())}")


def gbm():
    return lgb.LGBMClassifier(
        n_estimators=300, learning_rate=0.08, num_leaves=31, min_child_samples=40, subsample=0.8,
        subsample_freq=1, colsample_bytree=0.8, reg_lambda=1.0, n_jobs=10, random_state=42, verbose=-1,
    )


def thr_at_fpr(yt, p, fpr_target):
    """Lowest threshold whose false-positive rate on legit is <= target."""
    fpr, tpr, thr = roc_curve(yt, p)
    ok = np.where(fpr <= fpr_target)[0]
    i = ok[-1]
    return float(thr[i]), float(tpr[i]), float(fpr[i])


def metrics(yt, p, thr=0.5):
    pred = p >= thr
    tp = int((pred & (yt == 1)).sum()); fp = int((pred & (yt == 0)).sum())
    fn = int((~pred & (yt == 1)).sum()); tn = int((~pred & (yt == 0)).sum())
    d = dict(
        auc=roc_auc_score(yt, p), pr_auc=average_precision_score(yt, p), thr=thr, tp=tp, fp=fp, fn=fn, tn=tn,
        accuracy=(tp + tn) / len(yt), recall=tp / max(tp + fn, 1), precision=tp / max(tp + fp, 1),
        fpr=fp / max(fp + tn, 1),
    )
    d["f1"] = 2 * d["precision"] * d["recall"] / max(d["precision"] + d["recall"], 1e-12)
    for tgt in (0.001, 0.01):
        t, r, f = thr_at_fpr(yt, p, tgt)
        d[f"recall_at_fpr_{tgt}"] = r
        d[f"thr_at_fpr_{tgt}"] = t
    return d


def show(name, d):
    print(
        f"{name:34s} AUC={d['auc']:.5f} PR-AUC={d['pr_auc']:.5f} | @0.5: acc={d['accuracy']:.4%} recall={d['recall']:.4%} "
        f"precision={d['precision']:.4%} FP={d['fp']} FN={d['fn']} | recall@0.1%FPR={d['recall_at_fpr_0.001']:.4%} recall@1%FPR={d['recall_at_fpr_0.01']:.4%}"
    )


# ---- grouped 5-fold CV --------------------------------------------------------------
sgkf = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)
folds = list(sgkf.split(df, y, groups))
fold_id = np.zeros(N, dtype=int)
for k, (_, te) in enumerate(folds):
    fold_id[te] = k
    tr_dom = set(groups[np.setdiff1d(np.arange(N), te)])
    assert not (set(groups[te]) & tr_dom), "domain leaked across folds"
print("fold sizes:", np.bincount(fold_id).tolist(), "| phishing share per fold:", [round(float(y[fold_id == k].mean()), 4) for k in range(5)])

oof = {}
models = {}
results = {}
for name, cols in SETS.items():
    p = np.zeros(N)
    models[name] = []
    for k, (tr, te) in enumerate(folds):
        m = gbm().fit(df.iloc[tr][cols], y[tr])
        p[te] = m.predict_proba(df.iloc[te][cols])[:, 1]
        models[name].append(m)
    oof[name] = p
    results[f"gbm_{name}"] = metrics(y, p)
    show(f"GBM [{name}] grouped-CV", results[f"gbm_{name}"])
print(f"  ({time.time() - t0:.0f}s)")

# random (non-grouped) CV for the combined model: does domain leakage inflate results?
p = np.zeros(N)
for tr, te in StratifiedKFold(n_splits=5, shuffle=True, random_state=42).split(df, y):
    p[te] = gbm().fit(df.iloc[tr][URL + PAGE], y[tr]).predict_proba(df.iloc[te][URL + PAGE])[:, 1]
results["gbm_combined_randomcv"] = metrics(y, p)
show("GBM [combined] RANDOM-CV", results["gbm_combined_randomcv"])
p = np.zeros(N)
for tr, te in StratifiedKFold(n_splits=5, shuffle=True, random_state=42).split(df, y):
    p[te] = gbm().fit(df.iloc[tr][URL], y[tr]).predict_proba(df.iloc[te][URL])[:, 1]
results["gbm_url_randomcv"] = metrics(y, p)
show("GBM [url] RANDOM-CV", results["gbm_url_randomcv"])

# ---- simple / interpretable models --------------------------------------------------
logt = FunctionTransformer(lambda a: np.log1p(np.abs(a)) * np.sign(a))
for name in ("url", "page", "combined"):
    cols = SETS[name]
    p = np.zeros(N)
    for tr, te in folds:
        lr = make_pipeline(logt, StandardScaler(), LogisticRegression(max_iter=2000, C=1.0))
        p[te] = lr.fit(df.iloc[tr][cols], y[tr]).predict_proba(df.iloc[te][cols])[:, 1]
    oof[f"logit_{name}"] = p
    results[f"logit_{name}"] = metrics(y, p)
    show(f"Logistic [{name}] grouped-CV", results[f"logit_{name}"])

for depth in (2, 3, 4):
    p = np.zeros(N)
    for tr, te in folds:
        dt = DecisionTreeClassifier(max_depth=depth, min_samples_leaf=200, random_state=0)
        p[te] = dt.fit(df.iloc[tr][URL + PAGE], y[tr]).predict_proba(df.iloc[te][URL + PAGE])[:, 1]
    results[f"tree_d{depth}_combined"] = metrics(y, p)
    show(f"DecisionTree depth{depth} [combined]", results[f"tree_d{depth}_combined"])
    if depth == 3:
        oof["tree3_combined"] = p
dt = DecisionTreeClassifier(max_depth=3, min_samples_leaf=200, random_state=0).fit(df[PAGE], y)
print("\nDepth-3 tree on PAGE features (fit on all rows, for display):\n" + export_text(dt, feature_names=PAGE, decimals=1))
p = np.zeros(N)
for tr, te in folds:
    p[te] = DecisionTreeClassifier(max_depth=3, min_samples_leaf=200, random_state=0).fit(df.iloc[tr][PAGE], y[tr]).predict_proba(df.iloc[te][PAGE])[:, 1]
results["tree_d3_page"] = metrics(y, p)
show("DecisionTree depth3 [page]", results["tree_d3_page"])

# scorecards (no training): fewer trust markers = more suspicious
for nm, tm, k in (("scorecard5", tm5, 5), ("scorecard9", tm9, 9)):
    s = 1 - tm / k
    results[nm] = dict(auc=roc_auc_score(y, s), pr_auc=average_precision_score(y, s))
    for cut in range(0, 4):
        pred = tm <= cut
        tp = int((pred & P).sum()); fp = int((pred & L).sum()); fn = int((~pred & P).sum()); tn = int((~pred & L).sum())
        results[nm][f"le{cut}"] = dict(tp=tp, fp=fp, fn=fn, tn=tn, recall=tp / (tp + fn), precision=tp / (tp + fp), accuracy=(tp + tn) / N, fpr=fp / (fp + tn))
        print(f"{nm}: flag if <= {cut} markers -> recall={tp / (tp + fn):.4%} precision={tp / (tp + fp):.4%} acc={(tp + tn) / N:.4%} FP={fp} FN={fn}")
    print(f"{nm}: AUC={results[nm]['auc']:.5f}")
    oof[nm] = s

# ---- hard slices --------------------------------------------------------------------
print("\n=== HARD SLICES: phishing subset vs ALL legit; threshold fixed at <=0.1% legit false-positive rate ===")
slice_res = {}
for name in ("url", "page", "combined", "logit_combined", "scorecard5"):
    p = oof[name]
    t, r, f = thr_at_fpr(y, p, 0.001)
    slice_res[name] = {"threshold": t, "fpr": f}
    for sname, m in slices.items():
        keep = m | L
        rec = float((p[m] >= t).mean())
        a = roc_auc_score(y[keep], p[keep])
        slice_res[name][sname] = dict(n=int(m.sum()), recall=rec, auc=a, missed=int((p[m] < t).sum()))
        print(f"{name:16s} thr={t:.4f} (FPR={f:.4%}) | {sname:40s} n={int(m.sum()):6d} recall={rec:.4%} missed={int((p[m] < t).sum()):6d} AUC={a:.5f}")
results["slices"] = slice_res

# login pages, both classes restricted to pages with a password field
lg = (df.HasPasswordField == 1).to_numpy()
for name in ("url", "page", "combined"):
    d = metrics(y[lg], oof[name][lg])
    results[f"login_only_{name}"] = d
    show(f"LOGIN PAGES ONLY [{name}] n={int(lg.sum())}", d)

# ---- attacker stress test ------------------------------------------------------------
print("\n=== STRESS TEST: phishing rows in each held-out fold are 'upgraded', models are NOT retrained ===")
chk = (df["LetterRatioInURL"] - (df["NoOfLettersInURL"] / df["URLLength"])).abs().max()
chk2 = (df["SpacialCharRatioInURL"] - (df["NoOfOtherSpecialCharsInURL"] / df["URLLength"])).abs().max()
print(f"ratio-formula check: max|LetterRatio - letters/URLLength|={chk:.4f}  max|SpecialRatio - specials/URLLength|={chk2:.4f}")
FREE = ["HasTitle", "HasDescription", "HasFavicon", "HasCopyrightInfo", "HasSocialNet"]
TITLE = ["DomainTitleMatchScore", "URLTitleMatchScore"]
levels = [
    "L0 today (as observed)",
    "L1 + HTTPS (free certificate)",
    "L2 + trust badges (title, favicon, description, copyright, social)",
    "L3 full page clone (title still mismatched)",
    "L4 full page clone + matching title",
]


def add_https(X):
    """http -> https: one more character ('s'), ratios recomputed, flag set."""
    X = X.copy()
    flip = (X["IsHTTPS"] == 0).to_numpy()
    old_len = X.loc[flip, "URLLength"]
    # ratios are count / URLLength: rescale them for the longer URL (formula-agnostic for digits / specials)
    X.loc[flip, "LetterRatioInURL"] = ((X.loc[flip, "NoOfLettersInURL"] + 1) / (old_len + 1)).round(3)
    X.loc[flip, "DegitRatioInURL"] = (X.loc[flip, "DegitRatioInURL"] * old_len / (old_len + 1)).round(3)
    X.loc[flip, "SpacialCharRatioInURL"] = (X.loc[flip, "SpacialCharRatioInURL"] * old_len / (old_len + 1)).round(3)
    X.loc[flip, "NoOfLettersInURL"] = X.loc[flip, "NoOfLettersInURL"] + 1
    X.loc[flip, "URLLength"] = old_len + 1
    X["IsHTTPS"] = 1.0
    return X


rng = np.random.default_rng(7)
stress_p = {name: {lv: np.full(N, np.nan) for lv in levels} for name in ("url", "page", "combined")}
for k, (tr, te) in enumerate(folds):
    te_ph = te[y[te] == 1]
    te_lg = te[y[te] == 0]
    base = df.iloc[te_ph][URL + PAGE].copy()
    donors = df.iloc[rng.choice(te_lg, size=len(te_ph), replace=True)][PAGE].to_numpy()
    v1 = add_https(base)
    v2 = v1.copy()
    for c in FREE:
        v2[c] = 1.0
    v4 = v1.copy(); v4[PAGE] = donors
    v3 = v4.copy(); v3[TITLE] = base[TITLE].to_numpy()  # impersonated brand's title does not match the attacker's domain
    variants = dict(zip(levels, [base, v1, v2, v3, v4]))
    for name in ("url", "page", "combined"):
        for lv, X in variants.items():
            stress_p[name][lv][te_ph] = models[name][k].predict_proba(X[SETS[name]])[:, 1]

stress_res = {}
for name in ("url", "page", "combined"):
    t, r, f = thr_at_fpr(y, oof[name], 0.001)
    stress_res[name] = {"threshold": t, "fpr": f}
    for lv in levels:
        sp = stress_p[name][lv]
        row = {sname: float((sp[m] >= t).mean()) for sname, m in slices.items()}
        row["recall_at_0.5"] = float((sp[P] >= 0.5).mean())
        stress_res[name][lv] = row
        print(f"{name:9s} | {lv:68s} caught(all)={row['all phishing']:.4%} | look-alike URL={row['look-alike URL (https, no path)']:.4%} | login={row['login page (password field)']:.4%} | @0.5={row['recall_at_0.5']:.4%}")
# 'either model flags' ensemble: URL model OR combined model, each at half the false-alarm budget
tu = thr_at_fpr(y, oof["url"], 0.0005)[0]
tc = thr_at_fpr(y, oof["combined"], 0.0005)[0]
either_fpr = float(((oof["url"][L] >= tu) | (oof["combined"][L] >= tc)).mean())
stress_res["either"] = {"fpr": either_fpr, "thr_url": tu, "thr_combined": tc}
for lv in levels:
    hit = (stress_p["url"][lv] >= tu) | (stress_p["combined"][lv] >= tc)
    row = {sname: float(hit[m].mean()) for sname, m in slices.items()}
    stress_res["either"][lv] = row
    print(f"either    | {lv:68s} caught(all)={row['all phishing']:.4%} | look-alike URL={row['look-alike URL (https, no path)']:.4%} | login={row['login page (password field)']:.4%}  (legit FPR={either_fpr:.4%})")
results["stress"] = stress_res
results["stress_levels"] = levels

# ---- base rates: what the same error rates mean at realistic prevalence ----------------
print("\n=== BASE RATES: per 1,000,000 URLs, threshold at <=0.1% legit false-positive rate ===")
base_res = {}
for name in ("url", "page", "combined"):
    t, tpr, fpr = thr_at_fpr(y, oof[name], 0.001)
    base_res[name] = {"tpr": tpr, "fpr": fpr, "thr": t, "by_prev": {}}
    for prev in (float(y.mean()), 0.05, 0.01, 0.001):
        tp = tpr * prev * 1e6; fn = (1 - tpr) * prev * 1e6; fp = fpr * (1 - prev) * 1e6
        prec = tp / (tp + fp)
        base_res[name]["by_prev"][f"{prev:.4f}"] = dict(precision=prec, missed=fn, false_alarms=fp, caught=tp)
        print(f"{name:9s} prevalence={prev:7.2%}: caught={tp:10,.0f} missed={fn:8,.1f} false alarms={fp:8,.1f} precision={prec:.3%} (false alarms per real catch={fp / tp:.3f})")
results["base_rates"] = base_res

# ---- triage funnel: decide before the click when the URL is enough ---------------------
print("\n=== TRIAGE FUNNEL (stage 1 = URL-only score, stage 2 = URL+page score for the grey zone) ===")
funnel_res = {}
p1, p2 = oof["url"], oof["combined"]
for fp_budget, miss_budget in ((0.0, 0.001), (0.0001, 0.001), (0.0001, 0.0005), (0.001, 0.001)):
    t_block = float(np.quantile(p1[L], 1 - fp_budget)) if fp_budget > 0 else float(p1[L].max())
    t_allow = float(np.quantile(p1[P], miss_budget))
    block = p1 > t_block; allow = (p1 < t_allow) & ~block; grey = ~block & ~allow
    g2 = grey & (p2 >= 0.5)
    d = dict(
        t_block=t_block, t_allow=t_allow, share_block=float(block.mean()), share_allow=float(allow.mean()), share_grey=float(grey.mean()),
        block_legit=int((block & L).sum()), block_phish=int((block & P).sum()), allow_legit=int((allow & L).sum()), allow_phish=int((allow & P).sum()),
        grey_legit=int((grey & L).sum()), grey_phish=int((grey & P).sum()),
        stage2_block_phish=int((g2 & P).sum()), stage2_block_legit=int((g2 & L).sum()), stage2_allow_phish=int((grey & ~g2 & P).sum()), stage2_allow_legit=int((grey & ~g2 & L).sum()),
    )
    funnel_res[f"fp{fp_budget}_miss{miss_budget}"] = d
    print(f"budgets: block-zone legit<= {fp_budget:.2%}, allow-zone phishing<= {miss_budget:.2%} -> thresholds allow<{t_allow:.4f} block>{t_block:.4f}")
    print(f"   stage1: BLOCK {d['share_block']:.2%} of URLs (phish {d['block_phish']}, legit {d['block_legit']}) | ALLOW {d['share_allow']:.2%} (legit {d['allow_legit']}, phish {d['allow_phish']}) | GREY {d['share_grey']:.2%} (legit {d['grey_legit']}, phish {d['grey_phish']})")
    print(f"   stage2 on grey: blocked phish {d['stage2_block_phish']}, blocked legit {d['stage2_block_legit']}, allowed phish {d['stage2_allow_phish']}, allowed legit {d['stage2_allow_legit']}")
    tot_fn = d["allow_phish"] + d["stage2_allow_phish"]; tot_fp = d["block_legit"] + d["stage2_block_legit"]
    print(f"   END-TO-END: missed phishing {tot_fn} ({tot_fn / P.sum():.4%}), legit blocked {tot_fp} ({tot_fp / L.sum():.4%}); pages that needed fetching: {d['share_grey']:.2%}")
results["funnel"] = funnel_res

# ---- SHAP (LightGBM native TreeSHAP) on held-out fold 0 -------------------------------
tr, te = folds[0]
m = models["combined"][0]
samp = np.random.default_rng(0).choice(te, size=min(20000, len(te)), replace=False)
contrib = m.predict(df.iloc[samp][URL + PAGE], pred_contrib=True)
sv = contrib[:, :-1]
imp = pd.DataFrame({"feature": URL + PAGE, "mean_abs_shap": np.abs(sv).mean(axis=0)})
imp["tier"] = np.where(imp.feature.isin(URL), "URL", "PAGE")
# direction: correlation between feature value and its SHAP value
Xs = df.iloc[samp][URL + PAGE].to_numpy()
imp["corr_value_shap"] = [float(np.corrcoef(Xs[:, j], sv[:, j])[0, 1]) if Xs[:, j].std() > 0 and sv[:, j].std() > 0 else 0.0 for j in range(sv.shape[1])]
imp = imp.sort_values("mean_abs_shap", ascending=False).reset_index(drop=True)
imp["share"] = imp.mean_abs_shap / imp.mean_abs_shap.sum()
print("\n=== SHAP (combined GBM, fold-0 hold-out, 20k rows): mean |SHAP| in log-odds ===")
print(imp.head(25).to_string(index=False))
print("share of total |SHAP| by tier:\n", imp.groupby("tier")["share"].sum())
imp.to_csv(out / "shap_importance.csv", index=False)
np.save(out / "shap_values.npy", sv.astype(np.float32))
df.iloc[samp][URL + PAGE].to_parquet(out / "shap_sample.parquet", index=False)
for nm in ("url", "page"):
    mm = models[nm][0]
    c = mm.predict(df.iloc[samp][SETS[nm]], pred_contrib=True)[:, :-1]
    im = pd.DataFrame({"feature": SETS[nm], "mean_abs_shap": np.abs(c).mean(axis=0)}).sort_values("mean_abs_shap", ascending=False)
    im["share"] = im.mean_abs_shap / im.mean_abs_shap.sum()
    im.to_csv(out / f"shap_importance_{nm}.csv", index=False)
    print(f"\nSHAP top-10 for [{nm}] model:\n", im.head(10).to_string(index=False))

# ---- save ------------------------------------------------------------------------------
pd.DataFrame({"y": y, "fold": fold_id, "bare": bare, "https": https_str, "tm5": tm5, "tm9": tm9, **{f"p_{k}": v for k, v in oof.items()}}).to_parquet(out / "oof.parquet", index=False)
sp = pd.DataFrame({f"{n}|{lv}": stress_p[n][lv] for n in stress_p for lv in levels})
sp.to_parquet(out / "stress_preds.parquet", index=False)
json.dump(results, open(out / "results.json", "w"), indent=1, default=float)
print(f"\nDONE in {time.time() - t0:.0f}s")
