# Daisie Mascara Chrome Web Store release contract

## Target and authorization

- Product: Daisie Mascara, a Chrome Manifest V3 extension.
- Intended target: an available signed-in Chrome Web Store developer account and public store listing, as authorized by the user.
- The user requested build and release. That request authorizes the relevant release once the required checks and account prerequisites are satisfied; do not ask for a second general publishing approval.
- Verify developer registration and record the available signed-in account used. Publisher name, support email, public privacy policy host, and store item ID still require real values; do not invent them.
- Current live version: none verified.
- Source repository: https://github.com/Kittybri/Daisie-s-Mascara. The checks workflow runs lint, tests, and builds on Node.js 22 and 24. Verify the exact candidate's workflow run before claiming remote CI passed. Branch protection has not been verified.

## Native version and candidate

`extension/manifest.json` is the native version source. The current candidate is `0.2.0`. Keep the store listing, release log, package name, and candidate receipt aligned with that version. Do not introduce a competing integer release registry.

The releasable artifact is `dist/tidecheck-0.2.0.zip`, produced from the validated extension files. Bind it to the committed candidate and a SHA-256 digest in the release evidence. Generated packages, upload acknowledgements, and draft listings do not establish a live release.

## Records and audiences

| Path | Audience | Purpose |
| --- | --- | --- |
| `docs/CHANGELOG.md` | Public | User-visible changes and truthful release state. |
| `docs/PRD.md` | Public | Current product flows, requirements, and limits. |
| `docs/BACKLOG.md` | Public | Accepted work and its status. |
| `docs/privacy-policy.md` | Public after publisher details are complete | Privacy-policy source. |
| `docs/store-listing.md` | Internal preparation; safe to share | Store copy, permission explanations, and missing fields. |
| `docs/release-review.md` | Internal preparation; sanitized | Candidate identity, review outcomes, validation, and deployment receipt. |

The repository is public. Keep all tracked records suitable for public exposure. Detailed security findings belong in protected local evidence outside the distributable package and must not be included in store assets or public logs.

## Required candidate checks

Run these checks on the same source candidate that will be packaged:

1. `npm run lint` - syntax and static package/security checks.
2. `npm test` - meaningful rule, scanner, message-handler, and failure-path tests.
3. `npm run build` - extension-only ZIP, excluding raw dataset records and private materials; aggregate dataset analysis and the 60-column schema are intentionally bundled. Verify its file inventory against the intended release files.
4. `npm run release:check` - verifies manifest/version consistency, required release records, the packaged file inventory, and candidate evidence.
5. `npm run test:browser` and native Chrome smoke review - use the production manifest and its HTTP/HTTPS host permissions. Verify automatic page checks, manual rescans, settings, unavailable states, dataset filtering, and the explicit SynthID **Not checked** state. Confirm no scan data is uploaded and that the user-triggered SynthID link opens only its fixed external URL. A test-only permission addition cannot establish production-permission behavior.
6. Review the final source, ZIP, and store screenshots for accidental private data and unsupported claims.

The release entrypoint must enforce the automated checks and obtain the release lock before producing publishable evidence. A check error, missing required evidence, or stale candidate is incomplete and blocks submission. If the actual implementation changes these commands, update this contract to match rather than claiming a nonexistent check ran.

The extension has no runtime dependencies if the package remains self-contained. Review any introduced dependencies and lockfile before packaging. A syntax check alone is not a comprehensive security audit.

Allow at most two repair attempts per established candidate for an automatically remediable failure, then stop and report an unresolved required gate. Do not weaken tests or remove checks to force a release.

## Coordination and submission

Use the lock implemented by `scripts/release-check.mjs` for release preparation and record the validated candidate/digest. Do not run overlapping submission attempts for the same store item. Before uploading, confirm that the source commit, package version, digest, and listing copy still match the reviewed candidate.

There is no configured automated store publisher. The supported publication route is the authenticated Chrome Web Store developer dashboard:

1. Complete and verify developer registration and publisher prerequisites for an available signed-in account authorized by the user.
2. Complete publisher/support fields and host the final privacy policy at an approved public URL.
3. Upload the validated ZIP and the genuine screenshots, then complete the store's listing and privacy fields using the reviewed copy.
4. Submit for store review. Record the item ID, submission time, version, and artifact digest. Mark the state **submitted**, not published.
5. When approved and public, verify the intended listing and install it from the store. Confirm the installed version is `0.2.0` and smoke-test automatic/manual checks, settings, and dataset access.

No CLI publish command, account access, approved listing, or privacy host has been established. Record those prerequisites honestly instead of attempting an unrelated deployment route.

## Receipt and rollback

The live receipt must contain the public store URL/item ID, publisher identity, verified date/time, installed version, intended candidate/digest, and results of the scan/settings smoke check. Update the changelog and backlog only after the corresponding state is established.

If store review rejects the candidate, retain its submission history and prepare a corrected higher version when required by the store. If a published version must be withdrawn, use the intended item's store controls; record the observed result. Do not assume deleting a local ZIP unpublishes the extension or that a prior version can be restored through an unverified command.
