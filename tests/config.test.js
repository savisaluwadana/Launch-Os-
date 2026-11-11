import test from "node:test";
import assert from "node:assert/strict";
import { validateConfig, loadConfig } from "../src/config.js";

test("defaults are approval-first and use no model", () => {
  const config = validateConfig();
  assert.equal(config.approvalRequired, true);
  assert.equal(config.autoPublish, false);
  assert.equal(config.ai.provider, "none");
  assert.ok(config.channels.includes("bluesky"));
});

test("rejects auto publishing and unsupported channels", () => {
  assert.throws(() => validateConfig({ autoPublish: true }), /approval-only/);
  assert.throws(() => validateConfig({ approvalRequired: false }), /approval-only/);
  assert.throws(() => validateConfig({ channels: ["unknown"] }), /channels/);
});

test("requires a model for local AI suggestions", () => {
  assert.throws(() => validateConfig({ ai: { provider: "ollama" } }), /requires ai.model/);
  assert.equal(validateConfig({ ai: { provider: "ollama", model: "llama3.2" } }).ai.provider, "ollama");
});

test("reads repository config", async () => {
  const config = await loadConfig("launchos.config.json");
  assert.equal(config.project.name, "Launch OS");
});
