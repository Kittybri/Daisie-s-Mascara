# Dataset evidence and product choices

Source: the user-supplied `Phishing Dataset_Anonymized.xlsx`, `Sheet1`. Reproduce the profile with `scripts/profile_dataset.py`; full aggregates and source digest are in `data/validation.json`. Raw source addresses are not bundled or contacted.

The workbook has 215,795 records and 60 columns. `Phishing=1` means phishing, confirmed against `Classification` in every row. There are 92,300 phishing and 123,495 legitimate records, with no blank cells or label/text mismatches. There are 355 repeated URL_ID occurrences, 13,962 repeated Domain_ID occurrences, and 34,355 repeated Title_ID occurrences beyond the first.

| Condition in the supplied data | Matching records | Phishing records | Phishing share among matches |
| --- | ---: | ---: | ---: |
| All records | 215,795 | 92,300 | 42.77% |
| Not HTTPS | 46,857 | 46,857 | 100.00% |
| IP-address domain | 574 | 574 | 100.00% |
| Password field present | 22,073 | 4,981 | 22.57% |
| External form submission | 9,496 | 400 | 4.21% |

These are associations in this workbook, not estimates of performance on the web. In particular, 45,443 phishing records use HTTPS. Password fields and external forms alone have lower phishing shares than the dataset's base rate and cannot justify claiming a page is phishing.

Daisie Mascara therefore treats form destinations as reasons to review how information will be sent, explains legitimate alternatives, and never treats a password field alone as suspicious. It does not present the workbook's perfect precision for selected conditions as real-world accuracy. The first release uses explicit, inspectable checks rather than a model with unverified feature compatibility.

Collection dates and a full feature-extraction specification are absent. The source's address anonymization and repeated identifiers also make a naive random train/test split unsuitable evidence for generalization. Production model evaluation would need provenance, aligned browser extraction, duplicate/domain-aware holdouts, and prospective false-positive/missed-phishing measurement.
