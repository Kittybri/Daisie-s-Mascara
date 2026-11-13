// Aggregate statistics and schema only. No raw workbook records or local file paths.
export const datasetSummary = {
  "schemaVersion": 1,
  "source": {
    "fileName": "Phishing Dataset_Anonymized.xlsx",
    "sheet": "Sheet1",
    "profileDate": "November 13, 2026",
    "sha256": "320a257a1df6dafa10f97da1be1fe018389de91fa7aad7844dc57d5ef21ff34f"
  },
  "recordCount": 215795,
  "classCounts": {
    "legitimate": 123495,
    "phishing": 92300
  },
  "rowsWithMissingValues": 0,
  "labelMismatches": 0,
  "identifiers": {
    "Domain_ID": {
      "uniqueValues": 201833,
      "duplicateOccurrencesAfterFirst": 13962
    },
    "Title_ID": {
      "uniqueValues": 181440,
      "duplicateOccurrencesAfterFirst": 34355
    },
    "URL_ID": {
      "uniqueValues": 215440,
      "duplicateOccurrencesAfterFirst": 355
    }
  },
  "phishingWithHttps": 45443,
  "conditions": [
    {
      "key": "not_https",
      "name": "Does not use HTTPS",
      "expression": "IsHTTPS = 0",
      "matchingRecords": 46857,
      "phishingRecords": 46857,
      "phishingShare": 1.0,
      "phishingCoverage": 0.5076598049837486
    },
    {
      "key": "domain_is_ip",
      "name": "IP-address domain",
      "expression": "IsDomainIP = 1",
      "matchingRecords": 574,
      "phishingRecords": 574,
      "phishingShare": 1.0,
      "phishingCoverage": 0.006218851570964247
    },
    {
      "key": "url_obfuscation",
      "name": "URL obfuscation recorded",
      "expression": "HasObfuscation = 1",
      "matchingRecords": 444,
      "phishingRecords": 444,
      "phishingShare": 1.0,
      "phishingCoverage": 0.004810400866738895
    },
    {
      "key": "password_field",
      "name": "Password field recorded",
      "expression": "HasPasswordField = 1",
      "matchingRecords": 22073,
      "phishingRecords": 4981,
      "phishingShare": 0.22566030897476555,
      "phishingCoverage": 0.05396533044420369
    },
    {
      "key": "external_form_submit",
      "name": "External form submission recorded",
      "expression": "HasExternalFormSubmit = 1",
      "matchingRecords": 9496,
      "phishingRecords": 400,
      "phishingShare": 0.04212299915754002,
      "phishingCoverage": 0.004333694474539545
    }
  ],
  "columns": [
    {
      "position": 1,
      "name": "URL_Anonymized",
      "group": "Anonymized identifiers",
      "missingValues": 0
    },
    {
      "position": 2,
      "name": "URL_ID",
      "group": "Anonymized identifiers",
      "missingValues": 0
    },
    {
      "position": 3,
      "name": "URLLength",
      "group": "URL structure",
      "missingValues": 0
    },
    {
      "position": 4,
      "name": "Domain_Anonymized",
      "group": "Anonymized identifiers",
      "missingValues": 0
    },
    {
      "position": 5,
      "name": "Domain_ID",
      "group": "Anonymized identifiers",
      "missingValues": 0
    },
    {
      "position": 6,
      "name": "DomainLength",
      "group": "Domain structure",
      "missingValues": 0
    },
    {
      "position": 7,
      "name": "IsDomainIP",
      "group": "Domain structure",
      "missingValues": 0
    },
    {
      "position": 8,
      "name": "TLD_Anonymized",
      "group": "Anonymized identifiers",
      "missingValues": 0
    },
    {
      "position": 9,
      "name": "TLD_Group",
      "group": "Anonymized identifiers",
      "missingValues": 0
    },
    {
      "position": 10,
      "name": "URLSimilarityIndex",
      "group": "Derived scores",
      "missingValues": 0
    },
    {
      "position": 11,
      "name": "CharContinuationRate",
      "group": "URL composition",
      "missingValues": 0
    },
    {
      "position": 12,
      "name": "TLDLegitimateProb",
      "group": "Derived scores",
      "missingValues": 0
    },
    {
      "position": 13,
      "name": "URLCharProb",
      "group": "Derived scores",
      "missingValues": 0
    },
    {
      "position": 14,
      "name": "TLDLength",
      "group": "Domain structure",
      "missingValues": 0
    },
    {
      "position": 15,
      "name": "NoOfSubDomain",
      "group": "Domain structure",
      "missingValues": 0
    },
    {
      "position": 16,
      "name": "HasObfuscation",
      "group": "URL composition",
      "missingValues": 0
    },
    {
      "position": 17,
      "name": "NoOfObfuscatedChar",
      "group": "URL composition",
      "missingValues": 0
    },
    {
      "position": 18,
      "name": "ObfuscationRatio",
      "group": "URL composition",
      "missingValues": 0
    },
    {
      "position": 19,
      "name": "NoOfLettersInURL",
      "group": "URL composition",
      "missingValues": 0
    },
    {
      "position": 20,
      "name": "LetterRatioInURL",
      "group": "URL composition",
      "missingValues": 0
    },
    {
      "position": 21,
      "name": "NoOfDegitsInURL",
      "group": "URL composition",
      "missingValues": 0
    },
    {
      "position": 22,
      "name": "DegitRatioInURL",
      "group": "URL composition",
      "missingValues": 0
    },
    {
      "position": 23,
      "name": "NoOfEqualsInURL",
      "group": "URL composition",
      "missingValues": 0
    },
    {
      "position": 24,
      "name": "NoOfQMarkInURL",
      "group": "URL composition",
      "missingValues": 0
    },
    {
      "position": 25,
      "name": "NoOfAmpersandInURL",
      "group": "URL composition",
      "missingValues": 0
    },
    {
      "position": 26,
      "name": "NoOfOtherSpecialCharsInURL",
      "group": "URL composition",
      "missingValues": 0
    },
    {
      "position": 27,
      "name": "SpacialCharRatioInURL",
      "group": "URL composition",
      "missingValues": 0
    },
    {
      "position": 28,
      "name": "IsHTTPS",
      "group": "Connection",
      "missingValues": 0
    },
    {
      "position": 29,
      "name": "LineOfCode",
      "group": "Page structure",
      "missingValues": 0
    },
    {
      "position": 30,
      "name": "LargestLineLength",
      "group": "Page structure",
      "missingValues": 0
    },
    {
      "position": 31,
      "name": "HasTitle",
      "group": "Page structure",
      "missingValues": 0
    },
    {
      "position": 32,
      "name": "Title_Anonymized",
      "group": "Anonymized identifiers",
      "missingValues": 0
    },
    {
      "position": 33,
      "name": "Title_ID",
      "group": "Anonymized identifiers",
      "missingValues": 0
    },
    {
      "position": 34,
      "name": "DomainTitleMatchScore",
      "group": "Derived scores",
      "missingValues": 0
    },
    {
      "position": 35,
      "name": "URLTitleMatchScore",
      "group": "Derived scores",
      "missingValues": 0
    },
    {
      "position": 36,
      "name": "HasFavicon",
      "group": "Page structure",
      "missingValues": 0
    },
    {
      "position": 37,
      "name": "Robots",
      "group": "Page structure",
      "missingValues": 0
    },
    {
      "position": 38,
      "name": "IsResponsive",
      "group": "Page structure",
      "missingValues": 0
    },
    {
      "position": 39,
      "name": "NoOfURLRedirect",
      "group": "Navigation",
      "missingValues": 0
    },
    {
      "position": 40,
      "name": "NoOfSelfRedirect",
      "group": "Navigation",
      "missingValues": 0
    },
    {
      "position": 41,
      "name": "HasDescription",
      "group": "Page structure",
      "missingValues": 0
    },
    {
      "position": 42,
      "name": "NoOfPopup",
      "group": "Page structure",
      "missingValues": 0
    },
    {
      "position": 43,
      "name": "NoOfiFrame",
      "group": "Page structure",
      "missingValues": 0
    },
    {
      "position": 44,
      "name": "HasExternalFormSubmit",
      "group": "Forms",
      "missingValues": 0
    },
    {
      "position": 45,
      "name": "HasSocialNet",
      "group": "Page structure",
      "missingValues": 0
    },
    {
      "position": 46,
      "name": "HasSubmitButton",
      "group": "Forms",
      "missingValues": 0
    },
    {
      "position": 47,
      "name": "HasHiddenFields",
      "group": "Forms",
      "missingValues": 0
    },
    {
      "position": 48,
      "name": "HasPasswordField",
      "group": "Forms",
      "missingValues": 0
    },
    {
      "position": 49,
      "name": "Bank",
      "group": "Content indicators",
      "missingValues": 0
    },
    {
      "position": 50,
      "name": "Pay",
      "group": "Content indicators",
      "missingValues": 0
    },
    {
      "position": 51,
      "name": "Crypto",
      "group": "Content indicators",
      "missingValues": 0
    },
    {
      "position": 52,
      "name": "HasCopyrightInfo",
      "group": "Page structure",
      "missingValues": 0
    },
    {
      "position": 53,
      "name": "NoOfImage",
      "group": "Resources and links",
      "missingValues": 0
    },
    {
      "position": 54,
      "name": "NoOfCSS",
      "group": "Resources and links",
      "missingValues": 0
    },
    {
      "position": 55,
      "name": "NoOfJS",
      "group": "Resources and links",
      "missingValues": 0
    },
    {
      "position": 56,
      "name": "NoOfSelfRef",
      "group": "Resources and links",
      "missingValues": 0
    },
    {
      "position": 57,
      "name": "NoOfEmptyRef",
      "group": "Resources and links",
      "missingValues": 0
    },
    {
      "position": 58,
      "name": "NoOfExternalRef",
      "group": "Resources and links",
      "missingValues": 0
    },
    {
      "position": 59,
      "name": "Phishing",
      "group": "Labels",
      "missingValues": 0
    },
    {
      "position": 60,
      "name": "Classification",
      "group": "Labels",
      "missingValues": 0
    }
  ]
};
