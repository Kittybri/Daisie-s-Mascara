# TideCheck product requirements

Version: 0.2.0 release candidate

State: implemented locally; final browser validation and publication pending.

## Purpose and audience

TideCheck helps Chrome users inspect the page they are visiting for understandable phishing warning signs before sharing sensitive information. The initial release turns a phishing-analysis project into a small browser utility. The datathon brief is reference material; its separate presentation deliverable is not part of this extension release request.

## Core user flow

1. With automatic checks enabled, TideCheck checks an HTTP or HTTPS page after it loads. It also checks open web tabs on installation and checks an activated tab when a current result is unavailable.
2. The user opens the popup to read the concern level and its explanations. **Scan again** refreshes the check after page content changes.
3. The user can disable automatic checks, run manual checks, mark a domain as familiar, and manage those preferences in settings.
4. **Dataset analysis** opens the bundled aggregate findings and searchable list of all 60 original columns. The optional SynthID button opens Google's external detector without sending page media.

## Release requirements

| ID | Requirement | Acceptance evidence |
| --- | --- | --- |
| TC-01 | Check supported page loads automatically by default, reuse current results, and allow disabling automatic checks while retaining manual rescans. | Automatic-load, activation, installation, cancellation, and manual-scan tests; browser smoke check. |
| TC-02 | Explain the local rule findings and show a concern level without claiming a safe website or a calibrated phishing probability. | Rule-engine tests and inspected popup. |
| TC-03 | Inspect page structure without reading password or form field values. | Scanner source review and fixture tests. |
| TC-04 | Keep page addresses, page content, and scan results on the device. Do not upload scan data or page media. | Package inspection and runtime network review. |
| TC-05 | Let users add and remove familiar-domain preferences in local extension storage. | Storage-handler tests and settings smoke check. |
| TC-06 | Show readable errors for unsupported pages and failed scans. | Error-path tests and popup inspection. |
| TC-07 | Package as a Manifest V3 extension with `scripting`, `storage`, and HTTP/HTTPS host access needed for automatic checks. | Manifest/package gate. |
| TC-08 | Provide accessible popup controls, settings, and privacy information without remote assets or inline code. | Keyboard/UI review and package gate. |
| TC-09 | Show aggregate dataset analysis and all 60 exact original column names without bundling raw records. | Dataset page, schema checks, and package inspection. |
| TC-10 | Label SynthID **Not checked** and open `https://synthid.com/` only on user request, without query parameters or automatic media upload. | Link and UI inspection; browser smoke check. |

Acceptance evidence is required before a requirement is marked verified in `docs/release-review.md`.

## Data and evaluation

The supplied anonymized dataset is a development reference. Only its aggregate analysis and column schema are bundled; raw records are excluded and the dataset is not queried during scans. The extension uses explainable rules; its concern levels are not trained-model scores.

The implemented checks cover HTTP pages, password forms with HTTP/cross-origin/non-web destinations, IP-address hosts, embedded URL user information, punycode hostnames, mismatched displayed link hosts, long addresses, and deeply nested hostnames. Form submission overrides are checked where they are accessible. The rules are implemented in `extension/engine.js`, with message handling and temporary results in `extension/background.js`.

Dataset statistics, if included in development records, must identify their denominators and limitations. Performance on an anonymized research dataset does not establish live-browser accuracy.

## Product limits

- A page with no strong warning signs may still be harmful.
- Automatic checks run after supported page loads and on activation when needed. They are snapshots, do not continuously inspect later DOM changes, and do not block navigation.
- Only the top-level page is checked. Embedded frames and shadow-root content are not traversed. Processing is bounded to 500 links, 200 password controls, and 100 submission overrides per inspected form.
- Browser-restricted pages cannot be inspected.
- Marking a domain as familiar records a user preference and does not verify ownership or legitimacy.
- The scanner does not use a remote reputation database or AI service. SynthID is an external link, not an integrated detector. The user chooses any media uploaded there, and TideCheck does not receive the result.
- Scan results shown to the user omit URL paths, queries, fragments, and embedded credentials. The original address is held temporarily in extension memory to detect a stale scan. Navigation clears the cached result and badge.

## Release status

The user authorizes an available signed-in account. Chrome Web Store account readiness, public publisher/support details, a public privacy URL, and live store verification remain pending. See `docs/release-review.md` for the candidate's actual validation and publication state.
