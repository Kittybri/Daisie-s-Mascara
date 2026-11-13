# Dataset columns

Source: Phishing Dataset_Anonymized.xlsx, Sheet1. Full workbook profile generated November 13, 2026.

All 60 names below preserve the worksheet spelling and original column order. Groups are inferred from the names for navigation only. The supplied files do not provide feature-extraction definitions; these group labels do not establish how any feature was calculated.

| No. | Exact column name | Inferred group | Missing values |
| ---: | --- | --- | ---: |
| 1 | `URL_Anonymized` | Anonymized identifiers | 0 |
| 2 | `URL_ID` | Anonymized identifiers | 0 |
| 3 | `URLLength` | URL structure | 0 |
| 4 | `Domain_Anonymized` | Anonymized identifiers | 0 |
| 5 | `Domain_ID` | Anonymized identifiers | 0 |
| 6 | `DomainLength` | Domain structure | 0 |
| 7 | `IsDomainIP` | Domain structure | 0 |
| 8 | `TLD_Anonymized` | Anonymized identifiers | 0 |
| 9 | `TLD_Group` | Anonymized identifiers | 0 |
| 10 | `URLSimilarityIndex` | Derived scores | 0 |
| 11 | `CharContinuationRate` | URL composition | 0 |
| 12 | `TLDLegitimateProb` | Derived scores | 0 |
| 13 | `URLCharProb` | Derived scores | 0 |
| 14 | `TLDLength` | Domain structure | 0 |
| 15 | `NoOfSubDomain` | Domain structure | 0 |
| 16 | `HasObfuscation` | URL composition | 0 |
| 17 | `NoOfObfuscatedChar` | URL composition | 0 |
| 18 | `ObfuscationRatio` | URL composition | 0 |
| 19 | `NoOfLettersInURL` | URL composition | 0 |
| 20 | `LetterRatioInURL` | URL composition | 0 |
| 21 | `NoOfDegitsInURL` | URL composition | 0 |
| 22 | `DegitRatioInURL` | URL composition | 0 |
| 23 | `NoOfEqualsInURL` | URL composition | 0 |
| 24 | `NoOfQMarkInURL` | URL composition | 0 |
| 25 | `NoOfAmpersandInURL` | URL composition | 0 |
| 26 | `NoOfOtherSpecialCharsInURL` | URL composition | 0 |
| 27 | `SpacialCharRatioInURL` | URL composition | 0 |
| 28 | `IsHTTPS` | Connection | 0 |
| 29 | `LineOfCode` | Page structure | 0 |
| 30 | `LargestLineLength` | Page structure | 0 |
| 31 | `HasTitle` | Page structure | 0 |
| 32 | `Title_Anonymized` | Anonymized identifiers | 0 |
| 33 | `Title_ID` | Anonymized identifiers | 0 |
| 34 | `DomainTitleMatchScore` | Derived scores | 0 |
| 35 | `URLTitleMatchScore` | Derived scores | 0 |
| 36 | `HasFavicon` | Page structure | 0 |
| 37 | `Robots` | Page structure | 0 |
| 38 | `IsResponsive` | Page structure | 0 |
| 39 | `NoOfURLRedirect` | Navigation | 0 |
| 40 | `NoOfSelfRedirect` | Navigation | 0 |
| 41 | `HasDescription` | Page structure | 0 |
| 42 | `NoOfPopup` | Page structure | 0 |
| 43 | `NoOfiFrame` | Page structure | 0 |
| 44 | `HasExternalFormSubmit` | Forms | 0 |
| 45 | `HasSocialNet` | Page structure | 0 |
| 46 | `HasSubmitButton` | Forms | 0 |
| 47 | `HasHiddenFields` | Forms | 0 |
| 48 | `HasPasswordField` | Forms | 0 |
| 49 | `Bank` | Content indicators | 0 |
| 50 | `Pay` | Content indicators | 0 |
| 51 | `Crypto` | Content indicators | 0 |
| 52 | `HasCopyrightInfo` | Page structure | 0 |
| 53 | `NoOfImage` | Resources and links | 0 |
| 54 | `NoOfCSS` | Resources and links | 0 |
| 55 | `NoOfJS` | Resources and links | 0 |
| 56 | `NoOfSelfRef` | Resources and links | 0 |
| 57 | `NoOfEmptyRef` | Resources and links | 0 |
| 58 | `NoOfExternalRef` | Resources and links | 0 |
| 59 | `Phishing` | Labels | 0 |
| 60 | `Classification` | Labels | 0 |

## Profile

- 215,795 nonempty data rows; the header is excluded.
- 92,300 phishing rows (Phishing = 1); 123,495 legitimate rows (Phishing = 0). The Classification text agrees on every row.
- No missing cells detected. Empty strings and None values were counted as missing.
- Duplicate occurrences after the first: URL_ID 355; Domain_ID 13,962; Title_ID 34,355. These are repeated identifiers, not a count of exact duplicate rows.
- No collection-date column is present.

## Interpretation

The extension's Dataset analysis page bundles only schema and aggregate statistics derived from data/validation.json. It does not contain raw dataset records, test the current page against the workbook, or run a classifier trained on this dataset.

Counts are descriptive results for the complete supplied workbook, without a training/holdout split. A feature's observed phishing share is not a live phishing probability. Anonymization, repeated identifiers, absent collection dates, and unavailable feature-extraction definitions limit generalization.

Reproduce the profile with scripts/profile_dataset.py using Python with openpyxl installed. The source workbook is read-only and its URL values are never visited.

Source SHA-256: 320a257a1df6dafa10f97da1be1fe018389de91fa7aad7844dc57d5ef21ff34f
