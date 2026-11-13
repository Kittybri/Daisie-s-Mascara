# Domain recurrence in the supplied dataset

The full anonymized workbook contains 215,795 records, 215,440 distinct URL IDs, and 201,833 distinct domain IDs. A domain ID represents a recorded domain or hostname, which can include subdomains. Anonymization prevents reliable reconstruction of original registered base domains or operator identities.

## Record labels

| Label | Records | Share |
| --- | ---: | ---: |
| Phishing | 92,300 | 42.77% |
| Legitimate | 123,495 | 57.23% |
| Total | 215,795 | 100% |

The local encoding is `Phishing = 1` and `Legitimate = 0`. The `Classification` text agrees with the numeric target in every row. These are labels in the supplied data, not present-day verification or web-wide prevalence.

## Unique domains

| Domain category | Distinct domain IDs |
| --- | ---: |
| Phishing records only | 78,338 |
| Legitimate records only | 123,452 |
| Both labels | 43 |
| Total | 201,833 |

There are 78,381 domains with at least one phishing record. The 43 mixed-label domains are included in that count and also in the 123,495 domains with at least one legitimate record; those overlapping counts must not be added together.

## Recurrence and duplicate URLs

| Measure | Count |
| --- | ---: |
| Domains appearing once | 197,001 |
| Domains appearing in at least two records | 4,832 |
| Domains with at least two phishing records | 4,792 |
| Domains with at least two distinct phishing URLs | 4,554 |
| Recurring domains that only repeat the same URL | 238 |
| Unique phishing URL IDs | 91,945 |
| Unique legitimate URL IDs | 123,495 |
| Phishing URL IDs appearing twice | 355 |

The difference between records and distinct domains is 13,962 excess records beyond one per domain. It is not the number of recurring domains. Recurring domains contain 18,751 phishing records and 43 legitimate records.

## Interpretation

The recurrence motivates testing reuse of verified evidence. Mixed labels motivate page-level checks instead of permanent domain-wide trust. Repeated domains do not establish common attackers or campaigns. Model evaluation should keep each domain ID in a single partition and control duplicate URL IDs. The anonymized addresses cannot form a live threat index.

Source: `Phishing Dataset_Anonymized.xlsx`, `Sheet1`, columns `URL_ID`, `Domain_ID`, `Phishing`, and `Classification`. Full local aggregation on November 13, 2026. The source workbook is intentionally excluded from the repository.
