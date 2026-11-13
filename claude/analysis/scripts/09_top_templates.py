"""Add the most-copied page templates to facts.json. Usage: python -I 09_top_templates.py <parquet> <facts.json>"""
import json, sys
import pandas as pd
df = pd.read_parquet(sys.argv[1]); F = json.load(open(sys.argv[2]))
STRUCT = ["LineOfCode", "LargestLineLength", "HasTitle", "HasFavicon", "Robots", "IsResponsive", "NoOfURLRedirect", "NoOfSelfRedirect", "HasDescription", "NoOfPopup", "NoOfiFrame",
          "HasExternalFormSubmit", "HasSocialNet", "HasSubmitButton", "HasHiddenFields", "HasPasswordField", "Bank", "Pay", "Crypto", "HasCopyrightInfo", "NoOfImage", "NoOfCSS", "NoOfJS", "NoOfSelfRef", "NoOfEmptyRef", "NoOfExternalRef"]
assert len(STRUCT) == F["templates"]["n_struct_features"]
df["fp"] = pd.util.hash_pandas_object(df[STRUCT], index=False).to_numpy()
g = df.groupby("fp").agg(pages=("Phishing", "size"), phish=("Phishing", "mean"), hosts=("Domain_ID", "nunique"), tlds=("TLD_Group", "nunique"), loc=("LineOfCode", "first"), longest=("LargestLineLength", "first"),
                         title=("HasTitle", "first"), images=("NoOfImage", "first"), scripts=("NoOfJS", "first"), ext=("NoOfExternalRef", "first"), pw=("HasPasswordField", "first")).sort_values("hosts", ascending=False)
top = g.head(8).reset_index(drop=True)
F["templates"]["top"] = top.to_dict("records")
F["templates"]["n_fingerprints"] = int(len(g)); F["templates"]["n_shared_fingerprints"] = int((g.hosts >= 2).sum()); F["templates"]["mixed_label_fingerprints"] = int(((g.phish > 0) & (g.phish < 1)).sum())
json.dump(F, open(sys.argv[2], "w"), indent=1, default=float)
print(top.to_string())
