#!/usr/bin/env python3
"""Profile the supplied anonymized workbook without visiting any URL.

Run with Python that has openpyxl installed. Output contains descriptive,
in-sample associations, not a trained detector or deployment evaluation.
"""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import time

from openpyxl import load_workbook


FEATURES = (
    "IsHTTPS", "HasPasswordField", "HasExternalFormSubmit", "HasObfuscation",
    "IsDomainIP",
)
IDENTIFIERS = ("URL_ID", "Domain_ID", "Title_ID")
RULES = {
    "not_https": {"IsHTTPS": 0},
    "domain_is_ip": {"IsDomainIP": 1},
    "url_obfuscation": {"HasObfuscation": 1},
    "password_field": {"HasPasswordField": 1},
    "external_form_submit": {"HasExternalFormSubmit": 1},
    "password_and_external_form": {"HasPasswordField": 1, "HasExternalFormSubmit": 1},
    "password_and_not_https": {"HasPasswordField": 1, "IsHTTPS": 0},
    "password_and_obfuscation": {"HasPasswordField": 1, "HasObfuscation": 1},
}


def ratio(numerator: int, denominator: int):
    return numerator / denominator if denominator else None


def wilson_interval(successes: int, total: int):
    """95% binomial interval; sampling uncertainty only, not dataset bias."""
    if not total:
        return None
    z = 1.959963984540054
    p = successes / total
    center = (p + z * z / (2 * total)) / (1 + z * z / total)
    half = z * math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / (1 + z * z / total)
    return [max(0.0, center - half), min(1.0, center + half)]


def decision_metrics(tp: int, fp: int, fn: int, tn: int):
    return {
        "true_positive": tp, "false_positive": fp,
        "false_negative": fn, "true_negative": tn,
        "matched_rows": tp + fp,
        "eligible_rows": tp + fp + fn + tn,
        "phishing_share_among_matches": ratio(tp, tp + fp),
        "phishing_share_95pct_wilson_interval": wilson_interval(tp, tp + fp),
        "phishing_recall": ratio(tp, tp + fn),
        "legitimate_false_positive_rate": ratio(fp, fp + tn),
        "specificity": ratio(tn, tn + fp),
        "accuracy": ratio(tp + tn, tp + fp + fn + tn),
    }


def phi_from_counts(tp: int, fp: int, fn: int, tn: int):
    denominator = (tp + fp) * (tp + fn) * (tn + fp) * (tn + fn)
    return (tp * tn - fp * fn) / math.sqrt(denominator) if denominator else None


def is_missing(value):
    return value is None or (isinstance(value, str) and not value.strip())


def canonical_binary(value):
    if value in (0, 1, "0", "1"):
        return int(value)
    return None


def digest_file(path: Path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def profile(source: Path, sheet_name: str | None = None):
    started = time.monotonic()
    workbook = load_workbook(source, read_only=True, data_only=True)
    sheet = workbook[sheet_name] if sheet_name else workbook[workbook.sheetnames[0]]
    rows = sheet.iter_rows(values_only=True)
    columns = list(next(rows))
    if len(set(columns)) != len(columns):
        raise ValueError("Duplicate column names prevent unambiguous profiling")
    required = {"Phishing", "Classification", *FEATURES, *IDENTIFIERS}
    absent = required.difference(columns)
    if absent:
        raise ValueError(f"Required columns missing: {sorted(absent)}")
    index = {name: i for i, name in enumerate(columns)}
    missing = Counter({name: 0 for name in columns})
    class_counts = Counter()
    classification_counts = Counter()
    label_classification = Counter()
    invalid_binary = defaultdict(Counter)
    feature_counts = {name: Counter() for name in FEATURES}
    rule_counts = {name: Counter() for name in RULES}
    id_seen = {name: set() for name in IDENTIFIERS}
    id_duplicates = Counter({name: 0 for name in IDENTIFIERS})
    id_missing = Counter({name: 0 for name in IDENTIFIERS})
    total = invalid_labels = blank_rows = rows_with_missing = mismatches = 0
    first_last_labels = []

    for row in rows:
        if all(is_missing(value) for value in row):
            blank_rows += 1
            continue
        total += 1
        has_missing = False
        for name, value in zip(columns, row):
            if is_missing(value):
                missing[name] += 1
                has_missing = True
        rows_with_missing += int(has_missing)
        for name in IDENTIFIERS:
            value = row[index[name]]
            if is_missing(value):
                id_missing[name] += 1
            elif value in id_seen[name]:
                id_duplicates[name] += 1
            else:
                id_seen[name].add(value)

        raw_label = row[index["Phishing"]]
        label = canonical_binary(raw_label)
        classification = row[index["Classification"]]
        classification_counts[str(classification)] += 1
        label_classification[(str(raw_label), str(classification))] += 1
        if label is None:
            invalid_labels += 1
            continue
        class_counts[label] += 1
        expected = "Phishing" if label == 1 else "Legitimate"
        mismatches += int(str(classification).strip().casefold() != expected.casefold())
        if total <= 3 or total > (sheet.max_row or 0) - 4:
            first_last_labels.append({"worksheet_row": total + 1, "Phishing": label, "Classification": classification})

        values = {}
        for name in FEATURES:
            raw = row[index[name]]
            value = canonical_binary(raw)
            values[name] = value
            if value is None:
                invalid_binary[name][str(raw)] += 1
            else:
                feature_counts[name][(value, label)] += 1
        for name, conditions in RULES.items():
            if any(values[feature] is None for feature in conditions):
                continue
            matched = int(all(values[feature] == expected for feature, expected in conditions.items()))
            rule_counts[name][(matched, label)] += 1
        if total % 50000 == 0:
            print(f"Read {total:,} rows", flush=True)

    observed_features = {}
    for name, counts in feature_counts.items():
        tp, fp, fn, tn = counts[(1, 1)], counts[(1, 0)], counts[(0, 1)], counts[(0, 0)]
        observed_features[name] = {
            "value_1": decision_metrics(tp, fp, fn, tn),
            "value_0": decision_metrics(fn, tn, tp, fp),
            "phi_correlation_with_phishing": phi_from_counts(tp, fp, fn, tn),
            "missing_or_invalid_values_on_valid_label_rows": dict(invalid_binary[name]),
        }
    observed_rules = {}
    for name, counts in rule_counts.items():
        observed_rules[name] = {
            "conditions": RULES[name],
            **decision_metrics(counts[(1, 1)], counts[(1, 0)], counts[(0, 1)], counts[(0, 0)]),
        }
    output = {
        "schema_version": 1,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "source": {
            "file_name": source.name,
            "sha256": digest_file(source), "bytes": source.stat().st_size,
            "sheet": sheet.title, "all_sheets": workbook.sheetnames,
            "declared_rows_including_header": sheet.max_row,
            "declared_columns": sheet.max_column,
            "observed_nonempty_data_rows": total,
            "blank_data_rows": blank_rows, "columns": columns,
        },
        "label_mapping": {
            "target_column": "Phishing", "phishing_value": 1, "legitimate_value": 0,
            "evidence": "Challenge PDF page 2 explicitly defines the coding; Classification text was cross-checked row by row.",
            "classification_counts": dict(classification_counts),
            "cross_tab": [{"Phishing": label, "Classification": classification, "count": count} for (label, classification), count in sorted(label_classification.items())],
            "mismatched_classification_rows": mismatches,
            "invalid_target_rows": invalid_labels,
        },
        "class_counts": {"phishing": class_counts[1], "legitimate": class_counts[0]},
        "dataset_phishing_share": ratio(class_counts[1], class_counts[1] + class_counts[0]),
        "missingness": {"rows_with_any_missing_value": rows_with_missing, "by_column": dict(missing)},
        "identifier_checks": {
            name: {"unique_nonmissing_values": len(id_seen[name]), "duplicate_occurrences_after_first": id_duplicates[name], "missing_values": id_missing[name]}
            for name in IDENTIFIERS
        },
        "browser_observable_feature_associations": observed_features,
        "prespecified_rule_associations": observed_rules,
        "method": {
            "analysis_type": "Descriptive full-dataset contingency counts. No model training, holdout set, tuning, or network access.",
            "positive_class": "Phishing=1",
            "missing_values": "Blank/None values counted in source missingness. Missing or nonbinary features are excluded from that feature/rule denominator, never treated as zero.",
            "metrics": "Rules predict positive when their stated conditions match. Precision is phishing share among matches; recall is matched phishing / eligible phishing; false-positive rate is matched legitimate / eligible legitimate.",
            "intervals": "Wilson 95% binomial intervals quantify finite-sample uncertainty in observed matched-row phishing share; they do not account for selection bias or deployment shift.",
            "collection_dates_present": any("date" in str(name).casefold() or "time" in str(name).casefold() for name in columns),
        },
        "limitations": [
            "These are associations in the supplied dataset, not browser-extension accuracy or live threat probabilities.",
            "The workbook is anonymized. It cannot validate real domains, brands, exact URL patterns, domain reputation, or live page behavior.",
            "There are no collection-date columns in this workbook; temporal generalization and current threat coverage cannot be assessed.",
            "Dataset class balance need not match a user's browsing. Precision can differ substantially in deployment.",
            "Spreadsheet feature extraction definitions are not supplied; extension approximations of similarly named signals may differ.",
            "No single listed feature proves phishing. Legitimate login pages can request passwords or submit forms externally, and phishing can use HTTPS.",
            "Related webpages or repeated domain IDs can make row-level independence assumptions optimistic. No train/test separation was attempted.",
        ],
        "runtime_seconds": round(time.monotonic() - started, 3),
    }
    workbook.close()
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Path to the supplied anonymized workbook")
    parser.add_argument("--sheet")
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "data" / "validation.json")
    args = parser.parse_args()
    result = profile(args.source, args.sheet)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True, allow_nan=False) + "\n")
    print(json.dumps({"output": str(args.output), "rows": result["source"]["observed_nonempty_data_rows"], "class_counts": result["class_counts"], "classification_mismatches": result["label_mapping"]["mismatched_classification_rows"], "runtime_seconds": result["runtime_seconds"]}, indent=2))


if __name__ == "__main__":
    main()
