# Daisie Mascara 0.2.0 release review

State: local release candidate. Not submitted and not published. Automated checks passed with the production manifest. Native Chrome showed the live scanner preview and dataset page, but regular-profile extension installation remains incomplete because the folder picker kept Select disabled. Publisher details and public policy hosting remain prerequisites to submission.

## Candidate identity

| Field | Value |
| --- | --- |
| Native version | `0.2.0`, verified against `extension/manifest.json` and `package.json`. |
| Baseline live release | None verified. |
| Candidate source commit | Captured automatically in `dist/release-evidence.json` by the clean-commit release gate. |
| Candidate ZIP | `dist/tidecheck-0.2.0.zip`; extension-only inventory and per-file bytes are checked by the release gate. |
| ZIP SHA-256 | Captured beside the ZIP and in `dist/release-evidence.json` after building the committed candidate. |
| Store item ID | Pending item creation; the user authorizes an available signed-in account. |

## Required record review

| Record | Audience | Outcome and evidence |
| --- | --- | --- |
| `docs/CHANGELOG.md` | Public | Updated for 0.2.0 automatic checks, settings, aggregate dataset/schema view, and external SynthID link. Retains the unpublished state. |
| `docs/PRD.md` | Public | Updated to match automatic-load/activation/install checks, disabling behavior, HTTP/HTTPS host access, dataset content, and the explicit absence of a local SynthID detector. |
| `docs/BACKLOG.md` | Public | Records implemented follow-up requests separately from pending store publication. No unapproved future features added. |

## Validation evidence

| Required check | Result | Evidence |
| --- | --- | --- |
| Static/lint checks | Passed locally; final rerun required | Syntax; expected `scripting`/`storage` and HTTP/HTTPS permissions; no remote code, scanner upload APIs, unsafe HTML sinks, or matched secret patterns. Final run and timestamp captured by release gate. |
| Automated tests | Passed locally; final rerun required | 28 tests, including automatic load/install/activation, disable/manual behavior, failure states, URL scrubbing, rule boundaries, stale scans, same-URL reload, and storage/navigation races. |
| Extension-only package build | Final candidate pending | Manifest at ZIP root; package must match the final source byte-for-byte. Raw dataset records are excluded; aggregate analysis and schema are intentional. Final digest captured by release gate. |
| Release-record gate | Implemented | Requires a clean commit, executes local gates under an exclusive lock, and records commit/digest. Does not assert store readiness. |
| Production-permission browser smoke | Passed | 15 browser scenarios in Chromium 151 using the release manifest unchanged, including automatic concern results, disable/manual behavior, 60 columns/search, failure handling and bounded scans. |
| Native Chrome installation/demo | Partially verified | Live scanner preview ran the actual engine and displayed High concern. Dataset view showed 60 columns; search for password found HasPasswordField and reset restored 60. The native unpacked-extension picker kept Select disabled, including for a local copy outside iCloud; regular-profile installation and popup verification remain open. |
| Runtime network review | Passed in tested flows | No unexpected network requests in automated scenarios. The optional user-triggered SynthID navigation is a fixed external link, not an in-extension detector or media upload. |
| Source, package, and store-assets review | Passed locally | Raw records remain excluded. Images show actual automatic-check and dataset UI. Claims do not assert detection accuracy, guaranteed safety, or local watermark decoding. |

## Publication prerequisites

- Developer account readiness: pending; the user authorizes an available signed-in account.
- Publisher name and support address: pending.
- Final public privacy policy URL: pending.
- Store screenshots: refresh/verify `dist/store-assets/` against the final 0.2.0 UI.
- Store listing copy: prepared; public contact and policy URL still need final values.

## Deployment receipt

Status: pending. A local package is not a live release.

Record a submission separately if one is made. Mark this receipt verified only after the public store listing is observed and its installed extension version and core flows are checked against the intended candidate. No verified publication time or public URL is available yet.
