# Launch OS architecture

## Intent

Launch OS is a local-first automation layer between software releases and technical marketing. It is not a social engagement bot or a replacement for human product judgment.

## MVP data flow

1. A source adapter loads a GitHub release or JSON fixture.
2. The normalizer validates the release and caps input size.
3. Evidence extraction records attributed release-note bullet points with source URLs.
4. The deterministic generator produces a launch brief, channel drafts, and a machine-readable manifest.
5. Optionally, an Ollama model provides separate, explicitly unverified suggestions.
6. The CLI writes drafts to disk. A host workflow may submit them as a PR for human review.

## Trust and permissions

- Every artifact has draft status and approvalRequired=true.
- There is deliberately no publishing code in v0.1.
- Evidence references show where a claim appeared, not that it was independently verified.
- The tool may read a GitHub release with an optional read-only token.
- No social access tokens, background daemon, database or managed cloud are necessary.

## Planned extension seams

Sources: GitHub releases, PR comparisons, GitLab, changelog files.
Generators: per-channel templates, technical tutorials, demo scripts, SEO suggestions.
Model adapters: Ollama, other local models, optional hosted providers.
Publishers: approved outbound queues and authorized integrations with audit logs.
Feedback: opt-in website events, attribution and install/activation measurements.

A future publisher should consume an approved, immutable campaign revision with an idempotency key, not raw agent output.
