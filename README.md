# Launch OS

**Open-source release-to-launch automation, built for developers and maintainers.**

Launch OS turns GitHub releases into **reviewable, evidence-linked** launch material: a technical launch brief, blog draft, LinkedIn post, Bluesky post, and newsletter. It's a local-first CLI with an example GitHub Actions workflow. No subscription, server, paid AI API, or database is required.

> **Current status: v0.1 MVP on a feature branch.** This is draft generation, not autonomous publishing. Generated output always needs human review.

## Why this exists

Changelogs say what shipped. People still have to turn them into accurate technical explanations, announcements, and community updates. Launch OS connects those steps without pretending the AI has independently verified code or benchmarks.

Its evidence register links each extracted claim to its source release notes. Attribution does **not** mean the statement is independently verified. Maintainers must review security, performance, and compatibility claims.

## Quick start

Requires **Node.js 20+**. No npm dependencies for this first version.

    git clone https://github.com/savisaluwadana/Launch-Os-.git
    cd Launch-Os-
    npm test
    npm run demo

The demo writes a fictional campaign to **.tmp/demo/**. Inspect **brief.md**, **manifest.json**, and **content/**. The sample release is not a real tagged release.

Generate a draft from an actual public GitHub release:

    node src/cli.js generate --repo owner/repository --tag v1.0.0 --config launchos.config.json --out launch-output

Omit **--tag** to fetch the latest published release. For private repos or higher API rate limits, export **GITHUB_TOKEN** with read-only repository access. Do not commit access tokens.

To use the local CLI executable, run **npm link** and then **launchos --help**.

## Configuration

See **launchos.config.json** for an example. Current MVP configuration is JSON, not YAML. Supported channels: blog, linkedin, bluesky, newsletter.

    {
      "project": {
        "name": "Your Project",
        "website": "https://example.com",
        "audience": ["platform engineers"]
      },
      "channels": ["blog", "bluesky"],
      "ai": { "provider": "none" },
      "approvalRequired": true,
      "autoPublish": false
    }

Local AI assistance is optional. For Ollama, set **ai.provider** to **ollama** and **ai.model** to a locally installed model, then ensure Ollama is running. Model suggestions are written to a separate file marked **UNVERIFIED**; deterministic source-linked drafts remain unchanged.

    "ai": {
      "provider": "ollama",
      "model": "llama3.2",
      "endpoint": "http://127.0.0.1:11434/api/generate"
    }

## Automate launch PRs

The example in **examples/release-campaign.yml** shows a workflow triggered by a published GitHub release that generates draft assets and opens a pull request. Copy and adapt it in your own repository. It is intentionally **not installed as an active publishing workflow in this repo**.

GitHub Actions repository settings may need to allow PR creation by Actions. Pin third-party actions to trusted commit SHAs before deploying in a production organization. Always review generated changes and never expose social credentials to untrusted workflow code.

## What ships today

- GitHub release adapter and offline JSON fixture mode
- Source-linked evidence extraction from release-note bullets
- Deterministic blog, newsletter, LinkedIn and Bluesky draft generation
- JSON manifest with draft status and no publication capability
- Optional local Ollama writing suggestions in a separate review artifact
- CLI, tests, CI, GitHub Action example
- Apache License 2.0 and contributor/security guidance

## What does not ship yet

No social publishing, auto-commenting, outreach automation, self-hosted UI, analytics, PR-diff verification, plugin marketplace, or scheduled worker. These are future opportunities, not completed features.

See **docs/ARCHITECTURE.md** and **docs/ROADMAP.md**. Contributions welcome via issues and small pull requests.

## Principles

1. **Evidence-first:** technical claims must be sourced and reviewed.
2. **Approval-first:** no autonomous public posting or unsolicited engagement.
3. **Local-first:** no mandatory hosted control plane.
4. **Extensible:** source, generator and publisher adapters without vendor lock-in.
5. **Responsible automation:** respect platform APIs, credentials, user privacy and community norms.

Licensed under **Apache-2.0**. See **LICENSE**.
