# Daisie Mascara

A Chrome Manifest V3 extension that automatically checks webpages for phishing warning signs, entirely on your device. Results explain the observed clues and never certify a website as safe. A built-in dataset view presents the supplied workbook's analysis and all 60 original column names.

## Presentation

[**Open the presentation in Canva**](https://canva.link/h31ufynec0q7l70)

[![Daisie Mascara presentation cover — open the team presentation in Canva](presentations/slide-1.png)](https://canva.link/h31ufynec0q7l70)

[Download the five-slide PowerPoint](presentations/daisie-mascara-digital-immune-system.pptx) · [View all five slide previews](presentations/README.md) · [Explore the full architecture](docs/detailed-architecture.md)

## Project materials

- [Current extension ZIP](downloads/tidecheck-0.2.0.zip)
- [Collective defense architecture](docs/architecture.md) and [detailed system design](docs/detailed-architecture.md)
- [Component contracts](docs/architecture-components.md) and [execution / RSI workflows](docs/architecture-workflows.md)
- [Compute, blockchain, and token flow](docs/compute-and-token-flow.md)
- [Dataset findings](docs/data-findings.md) and [column guide](docs/columns.md)
- [Unique domains and recurring phishing](docs/domain-analysis.md)
- [Team Datathon Google Doc](https://docs.google.com/document/d/17n__8UvPw7o6kC3np_9pIFKLs4UQWcSU7tEv2OW6HPE/edit?usp=sharing)

The opt-in compute network, community index, and recursive improvement loop are proposed extensions to the current local scanner. The architecture and presentation distinguish the proposal from implemented features. The raw workbook and private validation logs are not distributed here.

## Try it locally

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**, choose **Load unpacked**, and select this project's `extension` folder.
3. Open a normal HTTP or HTTPS website. Daisie Mascara checks it after loading; select Daisie Mascara in the extension menu to see the result. **Scan again** refreshes it.
4. Open **Settings and privacy** to disable automatic checks or manage familiar-domain markers. **Dataset analysis** opens the supplied data summary and column list.

Chrome restricts scans of browser settings, Chrome Web Store pages, local files, and some other special pages. Automatic scans are a snapshot after page load or tab activation, with limits explained in settings. The extension does not block navigation or continuously inspect later page changes.

## What it checks

- HTTP connections and unencrypted password-form destinations.
- Password forms that submit to a different origin or a non-web destination.
- IP addresses, internationalized domain names, and user information embedded in URLs.
- Links whose displayed web-address hostname differs from their destination.
- Long addresses and deeply nested hostnames as weak clues.

Legitimate sites can trigger these checks. The concern level is a transparent rule score, not a trained-model probability. HTTPS does not prove that a site is legitimate.

Saved data consists of familiar-domain choices and the automatic-check setting. Familiar markers never suppress findings. Scan results and a temporary full-URL cache key remain in the extension service worker's memory and are cleared on navigation or worker restart. No form values, cookies, or browsing history are read, and no scan data leaves the device.

## SynthID

Daisie Mascara does not detect SynthID watermarks. It shows **Not checked** and provides a link to Google's official detector at `https://synthid.com/`. Opening the link sends no page media; the user chooses any uploads. No public, universal browser-local detector is integrated, and the absence of a detection must never be treated as proof of human authorship.

## Development and packaging

Use Node.js 22 or newer. There are no runtime or npm package dependencies.

```sh
npm test
npm run lint
npm run build
```

The package is `dist/tidecheck-0.2.0.zip`. A shared, explicit allowlist controls which extension files can enter the ZIP; unexpected files and symlinks stop the build. File order and archive metadata are normalized so identical source files produce identical ZIP bytes. A SHA-256 file is written beside the package. The raw dataset is never bundled; the schema and aggregate summary are included.

[Project checks](https://github.com/Kittybri/Daisie-s-Mascara/actions/workflows/checks.yml) run lint, regression tests, and the package build on Node.js 22 and 24. The workflow does not deploy or submit the extension to a store.

`npm run test:browser` runs the integration checks with Playwright from the Codex bundled runtime. Outside that environment, set `PLAYWRIGHT_MODULE_PATH` to an installed Playwright `index.mjs` and install its Chromium browser. Tests use the shipping permissions in a disposable profile with intercepted reserved test-domain fixtures. Automatic checks require HTTP and HTTPS website access, declared in the manifest.

After the browser tests, `node scripts/store-assets.mjs` renders the store images from actual UI screenshots into `dist/store-assets/`.

`npm run release:check` requires a clean Git commit, runs tests/static checks/browser checks/build, checks release documentation and ZIP contents, and records the exact source commit and artifact digest in `dist/release-evidence.json`. It prepares a release; it does not submit it to Google.

## Dataset context

The supplied datathon workbook contains 215,795 rows, including 92,300 labeled phishing and 123,495 legitimate. Its anonymized addresses, repeated identifiers, unknown collection dates, and unspecified feature-extraction methods limit direct deployment of a model trained on it. `scripts/profile_dataset.py` reproduces the local analysis and writes `data/validation.json`; `docs/data-findings.md` explains the resulting product choices. These findings do not measure the extension's live detection performance.

To reproduce the aggregate profile with Python and `openpyxl`, supply your own local workbook path:

```sh
python3 scripts/profile_dataset.py /path/to/Phishing_Dataset_Anonymized.xlsx
```

## Store release state

Version 0.2.0 is an unpublished release candidate and can receive fixes before submission. Public release still needs a Chrome Web Store developer account, public publisher/support details, a hosted public privacy policy, and Google's review. See `docs/store-listing.md`, `docs/release-review.md`, and `.pushlive/deploy.md` for the prepared listing and release workflow. No live store listing is claimed.
