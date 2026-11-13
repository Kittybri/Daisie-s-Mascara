# Collective defense implementation plan

This plan turns the [architecture](architecture.md) into a testable prototype. Only the local browser extension exists today. The network components, index integration, contribution credits, and improvement automation below are proposed work. Each milestone depends on the preceding acceptance evidence; dates and performance gains are not yet established.

The [network protocol](network-protocol.md) defines the proposed records and lifecycle. The [example pilot policy](pilot-policy.example.json) makes the initial constraints explicit; it is a design example, not active runtime configuration.

## First build boundary

Use the repository's Node.js 22+ conventions and built-in modules for the initial research prototype. Keep the new coordinator, worker, evaluator, and index publisher outside `extension/`, under a proposed `research/` directory. Their code and research artifacts must not enter the extension ZIP.

The demonstration runs one localhost coordinator and three explicitly started worker processes. Its two task types, `summarize_features_v1` and `evaluate_detector_v1`, summarize approved features and evaluate fixed numerical detector candidates. Tasks use approved local artifacts with no network access during execution. It does not claim distributed LLM inference, independent organizations, a live blockchain, or automatic recursive improvement. Atomically written local records are sufficient for this experiment; production storage is a later decision.

The existing extension continues to scan locally. Its current network restrictions remain in place until a separately reviewed index-delivery change is ready. No milestone authorizes collecting browsing history, page content, password values, or other form values.

## Milestone 1: reproducible contracts and corpus

**Deliverable:** versioned records for enrollment, corpus manifests, jobs, results, evidence, and index checkpoints. Fixed task handlers accept validated parameters rather than arbitrary executable content. A corpus manifest binds every job to its data and extractor version.

**Acceptance:** invalid fields, unknown task types, missing artifacts, and changed digests fail before execution. Repeating a deterministic job with the same inputs reproduces its expected result. Test fixtures contain no live private data. Raw research records stay outside distributable files.

## Milestone 2: cooperative job execution

**Deliverable:** a coordinator leases jobs to the three local workers. Participants control contribution independently from browser protection. Workers expose their current job, limits, and stop state. A disconnected worker's lease expires before reassignment.

**Acceptance:** pause stops new work and cancels running work at a bounded checkpoint. Resource ceilings and deadlines take effect. Credit is unique to the stable `networkId + jobId + workUnitId`, so a retried lease cannot earn it twice. Retry and cancellation leave a traceable terminal state. A deliberately incorrect result is rejected by the evaluator. Three local processes remain a simulation of cooperation, not proof of independent verification.

## Milestone 3: evidence index and research console

**Deliverable:** an evaluator accepts or disputes completed work, and a publisher creates a signed snapshot from accepted evidence. A localhost console shows jobs, verification outcomes, contribution credits, and index history. Credits represent accepted work and carry no promised monetary value.

**Acceptance:** unverified worker output cannot directly change the accepted index. Evidence retains its scope, source, review time, expiry, and conflicts. Invalid signatures, changed artifacts, and unsupported snapshot versions fail verification. Every accepted result can be traced to its job and evaluator. A rejected candidate remains visible as a rejected experiment.

## Milestone 4: local browser index integration

**Deliverable:** a browser adapter consults a bundled or explicitly imported signed fixture snapshot and displays index evidence separately from current page findings. Scheduled remote refresh is a later reviewed change; it must use predetermined downloads, never a request selected by the current page.

**Acceptance:** familiar or reviewed entries never suppress new local findings. Unknown, expired, disputed, and unavailable evidence have distinct states. A failed import retains the last verified snapshot. Offline checks continue. Existing automatic/manual scan behavior and privacy tests pass. Reviewed-only access enforcement, if introduced, gets its own explicit policy and implementation review; it is not implied by a warning label.

## Milestone 5: real participants and code improvement

**Deliverable:** an opt-in pilot with named, independently controlled evaluators and measured operating costs. Agents can propose bounded experiments and GitHub pull requests. A reviewed commit produces the signed candidate release. Changes to experiment selection form a separate meta-improvement lane.

**Acceptance:** evaluator independence is established outside wallet counts. Candidate results bind the exact code and artifact; new commits require reevaluation. The proposer cannot access final holdout labels or alter its acceptance rules. A staged release and authorized rollback succeed. Browser code ships through packaged extension releases. Federated index operators and optional on-chain settlement follow only after these controls work.

## Ownership and user journeys

| Role or surface | Responsibility |
| --- | --- |
| Participant and worker panel | Approve job types and budgets; inspect activity; pause or leave without losing browser protection. |
| Research operator and console | Admit approved corpora, schedule bounded jobs, and show complete experiment history. |
| Independent evaluator | Reproduce results and decide acceptance under the fixed evaluation policy. |
| Release maintainer | Review code, preserve release authority, and publish or revoke a versioned artifact. |
| Browser popup | Show local findings, evidence scope, index age, and uncertainty without uploading the current page. |

The minimum console journey is **job submitted → running → awaiting verification → accepted or rejected**. The minimum participant journey is **contribution off → informed enrollment → running within limits → paused or left**. The browser journey is **local scan → index evidence or unknown state → explainable user decision**.

## Measurement and completion

Record queue delay, job completion and retry rates, verification discrepancies, accepted work per resource budget, snapshot size and age, and local scan latency/memory. Detection evaluation reports recall and false alerts on domain-separated data, with duplicate URL control and an untouched final test. Compare learning-process revisions under equal budgets and retain failed trials.

Targets for acceptable latency, false alerts, and cost require pilot measurements and an explicit policy decision. This plan supplies acceptance behaviors, not invented performance results. Full implementation is complete only when the agreed milestone evidence exists; a screenshot, signed receipt, or passing local simulation alone does not establish production readiness.
