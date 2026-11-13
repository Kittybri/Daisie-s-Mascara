# Component design and trust boundaries

**Status: proposed system design.** The repository currently implements the local Chrome extension. The distributed worker network, signed index delivery, contribution accounting, and recursive improvement services below are not deployed features. This document expands the [architecture overview](architecture.md) and [detailed architecture](detailed-architecture.md) into component responsibilities and failure contracts. The [network protocol](network-protocol.md) defines wire records; the [implementation plan](implementation-plan.md) defines the sequence for building them.

## 1. Components, ownership, and interfaces

Each service owns a different decision. A worker produces an observation; an evaluator accepts a result; a publisher checkpoints evidence; a release maintainer authorizes executable code. Combining these roles would make one compromised participant able to turn its own claim into everyone else's protection policy.

| Component | Owns | Input → output contract |
| --- | --- | --- |
| Browser protection | Local findings, settings, last verified snapshot | Current page inspected locally + imported snapshot → explained findings and evidence state. No browsing upload. |
| Corpus admission service | Source approvals, sharing restrictions, collection policy | Approved public/synthetic source request → authorized collection task or rejection. |
| Isolated collector | Bounded captures and extraction receipts | Authorized source + collection policy → quarantined artifact, provenance, extractor version. |
| Artifact registry | Immutable objects and manifests | Validated bytes → digest-addressed object; `CorpusManifest` binds schema, provenance, sizes, and permitted uses. |
| Enrollment and scheduler | `NodeGrant`, queue, leases, cancellation | Worker capability and consent → bounded `JobLease`; completed attempt → verification queue. |
| Worker runtime | Local resource guard, execution state | Verified lease + pinned artifacts → signed `WorkResult`; never self-acceptance. |
| Evaluator and adjudicator | Acceptance attestations, disputes | Result + fixed verification policy → accepted, rejected, or disputed decision. |
| Evidence resolver and publisher | Scoped records, policy versions, checkpoints | Accepted `EvidenceRecord` objects → reproducible snapshot and signed `IndexCheckpoint`. |
| Receipt and credit service | Settlement journal and contribution status | Accepted work receipt + elapsed dispute period → one eligible credit entry. |
| Website and research console | Derived views, submitted proposals | Public approved records → searchable explanations, job history, contribution and release status. |
| Improvement and release services | Candidate lineage, evaluation runs, release manifests | Approved failures → proposal → independent evaluation → reviewed, packaged release. |

## 2. Separate private protection from public research

The browser evaluates page structure on the device without reading password or other form values. Page URLs, DOM text, messages, and index strings remain untrusted data. Render them through safe text APIs. A familiar-domain preference is not verification, and a heuristic score is not a calibrated phishing probability.

Research inputs come from a separately governed public/synthetic corpus. Installing protection does not enroll a worker. Participants explicitly choose contribution limits; pausing contribution leaves protection active. The public network never receives live browser pages, private prompts, browser profiles, or browsing histories.

Snapshot refreshes use a predetermined schedule and subscription, independent of the current page. Neither a URL-hash query nor choosing a download shard from the visited host satisfies this privacy boundary. The current extension's network restriction stays unchanged until index delivery receives a separate implementation review.

## 3. Admit evidence before distributing computation

Corpus admission records who approved a source, its redistribution permission, allowed collection scope, retention policy, and approved extraction method. Possession of the competition workbook does not establish permission to publish it. An anonymized `Domain_ID` groups research observations; it cannot become a real domain blocklist entry.

A dedicated, isolated collector retrieves only approved public sources. Its policy bounds destinations, redirects, request rate, bytes, and runtime. It has no participant browser session or personal credentials. Public content can contain hostile instructions; extraction treats those instructions as text. Collected material first enters quarantine, then schema, provenance, and publication checks. Volunteer machines initially process admitted artifacts rather than fetch arbitrary sites.

The registry stores immutable bytes under content digests. Replacing a capture creates another object and manifest; it never silently changes an existing experiment's inputs. Manifests reference extractor, feature schema, split definitions, and licenses. Revocation makes an object ineligible for new jobs and removes public availability where required, while retaining an appropriate audit reference. Sealed evaluation labels remain in a separate access-controlled store.

## 4. Schedule bounded work on heterogeneous devices

A node advertises capabilities such as supported task versions, CPU architecture, available memory, and optional GPU/model capacity. The scheduler intersects those capabilities with the participant's `NodeGrant` and the job's requirements. Advertised capacity is a routing hint, not proof of honest work.

V1 permits only `summarize_features_v1` and `evaluate_detector_v1`. A lease pins every input, configuration, model, and output schema by digest. Inputs download and verify before execution; execution has no network access. The initial worker does not accept remotely supplied scripts or arbitrary plugins.

The local resource guard independently enforces memory, elapsed time, allowed hours, idle state, and battery policy. Local pause overrides the coordinator, stops new work, and cancels execution at a bounded checkpoint. The example policy proposes a two-second checkpoint bound; that limit needs measurement before any operational promise. A remote lease cannot expand local consent.

Future approved task types can route feature work to CPUs and bounded inference to suitable GPUs. Shared-model inference would require pinned model weights, tokenizer, partition topology, context limits, and separately consented networking. Independent generations are separate experiments; concatenating unrelated output tokens does not produce one valid model response. LLM tokens measure inference; contribution credits measure accepted work. Neither establishes improvement by itself.

## 5. Verify before index mutation or reward

The scheduler maintains a stable job/work-unit identity and a different identity for every attempt. Lease expiration requeues unfinished work with a new nonce. Duplicate submissions of the same attempt return its recorded status; a late submission cannot finish the replacement attempt. Network retries must not create new payable units.

Evaluators verify authorization, input digests, output schema, and the assigned computation. Deterministic operations use reproducible outputs or a versioned numerical tolerance. Stochastic experiments bind seeds, repetition policy, uncertainty reporting, and resource budget. A correctly executed experiment that finds a regression can earn evaluation credit even though its candidate is rejected.

Disagreements enter an explicit dispute queue. A separately controlled adjudicator reproduces the contested computation; wallet count and stake do not decide scientific correctness. The pilot must establish evaluator independence outside the software. Multiple processes controlled by one operator demonstrate interfaces, not independent trust.

Accepted evidence preserves observation time, exact scope, method, supporting digests, attestations, expiry, and supersession. V1 supports `exact_url` and `host`; URL evidence never automatically expands to the host. Pattern and registered-domain matching require later definitions. Resolver output is `unknown`, `reviewed`, `phishing_evidence`, `disputed`, or `expired`. A missing entry remains unknown; an old favorable review cannot suppress a new local warning.

## 6. Publish consistent views, not permanent safety claims

The publisher resolves a bounded evidence set under one policy version, writes an immutable snapshot, then signs its checkpoint. Clients verify signer authority, size, digest, expiry, and monotonic continuity before atomically activating it. A partial download never replaces the active snapshot. Failed updates retain the last verified version with visible age and explicit stale-evidence behavior.

The website reads approved public records and derived indexes. It shows evidence scope, freshness, conflicting findings, job outcomes, and releases. A correction request becomes a reviewed proposal; changing a website row cannot mutate accepted evidence directly. Public search is a deliberate user action, separate from background browser checks. Private evaluation material and participant browsing never appear in the console.

## 7. Cryptographic accounting and authority

Most artifacts and computation stay off-chain. An optional ledger anchors receipt digests, budgets, settlement status, and published checkpoints. A credit transaction consumes an accepted receipt after its dispute period using the stable key `networkId + jobId + workUnitId`. Atomic uniqueness on that key prevents retries or multiple attestations from paying twice. Minting credits for raw token volume or threat-claim counts would reward activity without proving usefulness.

The initial demonstration uses nontransferable credits with no promised monetary value. Any later blockchain integration needs a defined budget, settlement finality policy, and correction procedure. Immutable accounting does not make an incorrect label correct. Federation replicates signed assertions; clients still choose trusted publishers and resolution policies.

Separate credentials authorize enrollment, evaluation, index publication, settlement, and executable release. Workers hold none of the latter authorities. Key rotation, revocation, recovery, and any proposed multi-signature release threshold require an explicit trust policy before deployment. A paid receipt cannot authorize code, and an index-publishing key cannot sign an extension package. Rollback is a separately authorized decision bound to an earlier artifact, not permission to accept any older version.

## 8. Failure contracts and implementation order

| Failure | Required durable behavior |
| --- | --- |
| Worker disappears | Lease expires; retain attempt history; retry the work unit without duplicate credit. |
| Artifact changes or disappears | Reject a digest mismatch; mark unavailable inputs; never silently substitute bytes. |
| Evaluators conflict | Preserve both attestations and disputed state; withhold acceptance/credit until adjudication. |
| Publisher or mirror fails | Continue local scanning with verified cached evidence; display its age. |
| Candidate fails or is withdrawn | Retain its lineage and results; keep the accepted release active. |

Build a local coordinator, bounded workers, evaluator, registry, and console first. Add signed fixture import to the browser next. Real independent operators, scheduled distribution, approved inference, federation, and optional token settlement are later gates, as detailed in the [implementation plan](implementation-plan.md).

Recursive improvement follows the same separation: agents propose detector, indexer, application, or experiment-selection changes; independent tests compare them with their predecessor under equal budgets. GitHub preserves exact commit lineage. Candidates cannot change acceptance policy, hidden labels, permissions, or signing keys. New commits invalidate prior code evaluations. Executable browser changes ship in reviewed extension packages; evidence updates remain data. This creates a measurable improvement loop without granting the loop authority to declare its own success.
