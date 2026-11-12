import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRelease } from "../src/github.js";
import { validateConfig } from "../src/config.js";
import { createCampaign } from "../src/generator.js";
import { generateAiSuggestions } from "../src/ai.js";

const release = normalizeRelease({
  tag_name: "v1",
  name: "Version 1",
  body: "## Changes\n- Added API request retry controls\n- Fixed the webhook timeout handling",
  html_url: "https://github.com/acme/app/releases/tag/v1"
}, "acme/app");

test("draft contains evidence register and cannot publish", () => {
  const { files, evidence } = createCampaign(release, validateConfig({ project: { name: "Acme" } }));
  const manifest = JSON.parse(files["manifest.json"]);
  assert.equal(manifest.published, false);
  assert.equal(manifest.approvalRequired, true);
  assert.match(files["brief.md"], /E1/);
  assert.match(files["content/blog.md"], /Added API request retry controls/);
  assert.equal(evidence.length, 2);
  assert.ok(files["content/bluesky.md"].length <= 301);
});

test("handles release notes without highlights without fabricating claims", () => {
  const item = normalizeRelease({ tag_name: "v3", body: "Details coming soon." });
  const output = createCampaign(item, validateConfig());
  assert.match(output.files["brief.md"], /No specific release-note bullets found/);
  assert.equal(output.evidence.length, 0);
});

test("AI suggestions stay separate from the verified draft", async () => {
  const config = validateConfig({ ai: { provider: "ollama", model: "local" } });
  const result = await generateAiSuggestions(release, [{ id: "E1", text: "A change" }], config, {
    fetchImpl: async () => ({ ok: true, json: async () => ({ response: "A suggested hook" }) })
  });
  assert.match(result, /UNVERIFIED/);
  assert.match(result, /A suggested hook/);
});
