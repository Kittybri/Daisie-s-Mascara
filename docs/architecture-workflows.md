# Daisie Mascara execution and improvement workflows

**Design status:** these are proposed network workflows. The current repository implements a local Chrome extension; it does not operate a volunteer compute network, shared live index, token economy, or autonomous release service. The [component design](architecture-components.md) defines ownership, and the [v1 protocol](network-protocol.md) defines signed records and endpoints. V1 has one coordinator. Additional machines increase capacity; independent operators and explicit trust policies are needed for federation.

## 1. From approved evidence to a local decision

An intake steward approves a public or synthetic corpus for its stated use. Approval covers provenance, redistribution rights, permitted transformations, retention, and publication scope. Public availability alone is insufficient. A separately isolated collector may acquire approved public material, then normalization produces immutable artifacts and a `CorpusManifest`. This collector is a future service; v1 starts from admitted, precomputed research artifacts. Neither collects extension users' browsing.

The scheduler decomposes a research job into stable work units. A worker requests work using its `NodeGrant`; the scheduler returns a `JobLease` only when the task and budget fit that grant. V1 operations are `summarize_features_v1` and `evaluate_detector_v1`. The worker verifies input digests and sizes before running the built-in operation without network access. It submits a signed `WorkResult` referencing an immutable output artifact. Queue acceptance acknowledges receipt, not correctness. The local demonstration uses a local artifact-store adapter; authenticated, size-bounded output upload needs its own endpoint contract before remote workers ship.

```mermaid
sequenceDiagram
    participant A as Corpus admission
    participant O as Immutable object store
    participant Q as Scheduler
    participant W as Enrolled worker
    participant V as Independent verifier
    participant E as Evidence resolver
    participant P as Snapshot publisher
    participant B as Local browser
    A->>O: Approved artifacts + CorpusManifest
    A->>Q: Job with fixed inputs and policy
    W->>Q: Request compatible lease
    Q-->>W: JobLease + artifact digests
    W->>O: Fetch approved bounded inputs
    W->>W: Verify, run built-in task, obey local limits
    W->>O: Store output artifact using local-demo adapter
    W->>Q: Signed WorkResult
    Q->>Q: Check lease and nonce; mark Submitted
    Q->>V: Submitted result and exact input references
    V->>O: Retrieve exact inputs and outputs
    V->>V: Reproduce and evaluate
    alt Accepted evidence
        V->>E: Attested EvidenceRecord
        E->>P: Resolved records + policy version
        P->>O: Snapshot + signed IndexCheckpoint
        B->>O: Scheduled subscription download
        B->>B: Verify then atomically activate snapshot
    else Disputed or rejected
        V->>E: Retained dispute or rejection record
    end
    B->>B: Inspect current page locally and explain findings
```

Verification checks provenance, assignment identity, schema, deterministic reproduction where applicable, and the job's evaluation policy. Model outputs require task-specific quality evaluation; matching two stochastic outputs is not a general correctness test. A separate adjudicator handles material disagreement. A rejection does not silently disappear, and a worker cannot approve its own assertion.

Accepted `EvidenceRecord` objects preserve exact scope, observation time, expiry, method, and supporting digests. The resolver applies a versioned policy to produce `unknown`, `reviewed`, `phishing_evidence`, `disputed`, or `expired`. An exact-URL observation never expands automatically to its entire host. The snapshot publisher signs the resolver's output; its signature proves authorized publication, not that every website remains trustworthy.

Clients download complete snapshots or predetermined subscription bundles on a schedule unrelated to the current page. They verify signatures, digests, continuity, limits, and expiry before replacing the active snapshot. Page-derived information stays on the device. Current local findings and historical evidence remain separate: a favorable record cannot suppress a fresh local concern. Reviewed-browsing policy and open-browsing policy can act differently on unknown or stale entries without relabeling unknown as malicious.

## 2. From verified work to contribution credit

Computation and settlement are separate state machines. A job reserves a fixed credit budget before scheduling; it specifies eligible work, verification policy, dispute period, and expiry. Retries use new attempt identifiers but preserve the work-unit identity. Resource measurements and LLM token counts supplied by a worker remain claims until the relevant checks accept them.

```mermaid
sequenceDiagram
    participant J as Job budget registry
    participant V as Authorized verifier
    participant D as Dispute adjudicator
    participant S as Settlement ledger
    participant C as Contributor
    J->>J: Reserve budget and policy digest
    V->>J: Signed accepted-work receipt
    J->>J: Check job, artifact, authority and eligibility
    alt Challenge within dispute period
        D->>J: Signed resolution tied to receipt
    end
    J->>S: Eligible receipt + stable settlement key
    S->>S: Verify signatures, budget and unused key
    S-->>C: Record one contribution credit
    C->>S: Duplicate submission or retry receipt
    S-->>C: Existing outcome; no additional credit
```

The stable replay key is `networkId + jobId + workUnitId`, not the lease, nonce, or attempt. Settlement atomically checks that key and debits the remaining budget. Duplicate requests return the recorded result. Expired, cancelled, rejected, or unresolved disputed work is ineligible. A result arriving after its lease expires cannot overwrite a replacement attempt. If the work is later found faulty after final settlement, preserve history and apply a separately defined correction policy; do not imply the original transaction can simply be erased.

A pilot can use a signed, nonmonetary credit ledger. An optional blockchain later records job commitments, authorized verification receipts, replay-protected settlement, and release checkpoints. Large artifacts, evaluation execution, and source code remain off-chain. Validators check the receipt policy; they cannot infer website truth from an artifact hash. Ledger consensus cannot replace independent evaluation.

LLM tokens measure model input or generated output. Contribution credits account for accepted useful work. Generating more model tokens does not automatically earn more credit, improve a detector, or prove recursive improvement. Correct evaluation of a failed candidate can deserve credit because the completed research task was useful. Receiving credit grants no index-signing or software-release authority.

## 3. From failure case to reviewed improvement

The research backlog uses approved failure cases, public research evidence, and aggregate measurements. It excludes users' page contents, form values, and browsing history. A proposal records its parent version, target component, hypothesis, permitted inputs, resource ceiling, and success criteria before experiments begin. V1 proposal generation is an operator-controlled process outside volunteer task execution. Later agent-assisted generation or shared-model inference requires a new explicitly approved task type and participant consent.

```mermaid
sequenceDiagram
    participant R as Research planner
    participant X as Experiment workers
    participant H as Independent evaluator
    participant G as GitHub and isolated CI
    participant M as Review and release maintainers
    participant U as Update clients
    R->>R: Bind hypothesis to parent and budget
    R->>X: Approved experiments with fixed inputs
    X-->>H: Candidate artifacts and complete run history
    H->>H: Equal-budget comparison and regression checks
    alt Candidate eligible for review
        H-->>G: Attestation bound to exact commit and artifacts
        R->>G: Pull request with evidence and limitations
        G->>G: Isolated tests without release credentials
        G->>M: Exact tested commit and build digest
        M->>M: Independent review and release authorization
        M-->>U: Packaged software or signed bounded data
        U->>U: Verify, stage rollout and retain rollback target
    else Failure or inconclusive result
        H-->>R: Retain result; revise next hypothesis
    end
```

Three change lanes have different authority. Bounded parameter search stays inside a preapproved space. Code changes to the detector, indexer, worker, or application require a reviewed GitHub commit. Changes to experiment selection or training strategy require an equal-budget comparison with the previous process. None may rewrite hidden labels, acceptance rules, participant grants, or release keys.

Index publication distributes bounded data under the index key policy. Software publication distributes a packaged, reviewed build under the release key policy. Index entries cannot carry executable scripts. A new commit invalidates an earlier commit-bound evaluation. A staged rollout checks predefined regression and resource metrics; an authorized rollback references the affected release and known-good target while preserving the history.

## Failure and recovery contract

| Event | Required transition and preserved invariant |
| --- | --- |
| Participant pauses or revokes consent | Stop locally at a bounded checkpoint; refuse new leases. Browser protection continues. |
| Worker disconnects | Expire the attempt and requeue the work unit; retain one settlement identity. |
| Duplicate or malformed result | Return the existing receipt state or reject schema; never execute submitted content. |
| Conflicting evidence | Preserve assertions and enter dispute; do not resolve through wallet count. |
| Snapshot corruption or rollback attempt | Reject activation; retain the last verified snapshot and expose its age. |
| Ledger outage | Queue eligible receipts; local protection and verified research records remain usable. |
| Candidate fails or rollout regresses | Keep the prior version or issue an authorized rollback; retain failed experiments. |

The pilot should demonstrate each transition before expansion. Measure false alerts, missed phishing, stale-evidence behavior, verified work per compute-hour, and duplicate-payment prevention separately. Use held-out domain groups and a sealed final evaluation set. The [implementation plan](implementation-plan.md) sequences these tests; none of the proposed gains should be presented as measured results yet.
