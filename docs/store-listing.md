# Daisie Mascara store listing

Status: prepared copy for version 0.2.0. Not submitted or published.

## Listing fields

**Name:** Daisie Mascara - Phishing Warning Signs

**Short description:** Automatically check webpages for phishing warning signs. Understand the clues and keep scan data on your device.

**Category:** Privacy & Security

**Language:** English

**Detailed description:**

Daisie Mascara automatically checks supported webpages for common phishing warning signs after they load. Open the extension to see the findings and choose **Scan again** to refresh the result after page content changes. Turn automatic checks off in settings whenever you prefer manual scanning.

Each result explains the clues behind it in plain language. A result can show **No strong warning signs**, **Review suggested**, or **High concern**. These are rule-based checks, not a probability that a page is phishing or a guarantee that a website is legitimate.

The checks look for unencrypted pages and password destinations, unusual hostnames, addresses with embedded user information, and links whose displayed web address names a different host. Long addresses and deeply nested hostnames are treated as weaker clues. Legitimate sites can produce warning signs too.

Daisie Mascara's scans run locally in your browser. The scanner does not send page addresses, page content, passwords, or scan results to a server. Automatic checks use HTTP and HTTPS site access. They run after page loads, on installation for open web tabs, and when an activated tab needs a current result.

You can mark a domain as familiar and remove that choice in settings. Marking a domain as familiar is your personal preference; it does not certify the website.

Daisie Mascara is an extra prompt for careful browsing. It cannot detect every phishing attempt, determine who operates a website, or replace Chrome's built-in protections. A page with no strong warning signs can still be harmful.

The check covers the top-level page at the time you scan it. Embedded frames, shadow-root content, and later page changes may not be covered. Daisie Mascara does not block navigation.

Explore the supplied research dataset through its aggregate analysis and all 60 original column names. Raw website records are not bundled, and these research statistics do not measure the extension's live accuracy.

The SynthID panel is explicitly **Not checked**. Its button opens Google's external SynthID detector. Daisie Mascara does not detect watermarks, upload page media, or read detector results; you choose any media you upload on Google's site.

## Single purpose

Help users inspect webpages for phishing warning signs through local automatic or manual checks and understandable explanations.

## Permission justifications

| Permission | Why it is needed |
| --- | --- |
| `scripting` | Runs the bundled scanner in supported pages to collect structural signals for local checks. |
| `storage` | Saves automatic-check and familiar-domain preferences on the user's device. |
| `http://*/*`, `https://*/*` host access | Lets Daisie Mascara inspect supported pages automatically after they load, without requiring a toolbar click on each page. The user can disable automatic checks in settings. |

No remote code is used. The extension's code and assets are included in its package.

## Privacy disclosures to verify in the developer dashboard

- The extension handles the current page address and limited page structure locally to perform its single purpose.
- It does not transmit user data to the publisher or third parties.
- It does not sell user data, use it for unrelated purposes, or use it for lending decisions.
- It does not read the contents of password fields or other form field values.
- Familiar-domain choices and the automatic-check setting are stored locally and can be managed in settings.
- The optional SynthID button opens `https://synthid.com/` with no URL parameters. Google handles any media the user elects to upload there under its own policies; Daisie Mascara does not perform that upload.
- The dashboard answers must agree with the final package and the published privacy policy. Local processing should not be described as a server-side collection service.

## Publisher details still required

| Field | Status |
| --- | --- |
| Publisher name | Awaiting the user's publisher identity. |
| Public support email | Awaiting the user's chosen address. |
| Developer account | The user authorizes an available signed-in account; developer registration and access still need verification. |
| Public privacy policy URL | Awaiting an approved public host and the publisher details. Source copy is in `docs/privacy-policy.md`. |
| Store item ID and public URL | Assigned by Chrome Web Store after item creation; not yet available. |

Store screenshots must show the packaged extension's real UI. Do not describe a local preview as a published listing.

Preparation references: [publishing an extension](https://developer.chrome.com/docs/webstore/publish), [privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy), and [store images](https://developer.chrome.com/docs/webstore/images).

SynthID reference: [Google's explanation of the external detector](https://blog.google/innovation-and-ai/models-and-research/google-deepmind/synth-id-ai-content/).
