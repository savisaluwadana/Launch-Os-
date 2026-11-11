import test from "node:test";
import assert from "node:assert/strict";
import { parseRepo, normalizeRelease, fetchRelease, extractEvidence } from "../src/github.js";

test("validates owner/repo", () => {
  assert.equal(parseRepo("owner/repo"), "owner/repo");
  assert.throws(() => parseRepo("../bad"), /owner\/name/);
  assert.throws(() => parseRepo("https://github.com/o/r"), /owner\/name/);
});

test("fetches GitHub release using injected transport", async () => {
  let endpoint = "";
  const release = await fetchRelease("acme/sample", "v1.0", {
    fetchImpl: async (url) => {
      endpoint = url;
      return { ok: true, json: async () => ({ tag_name: "v1.0", name: "First", body: "- Shipped tests", html_url: "https://github.com/acme/sample/releases/tag/v1.0" }) };
    }
  });
  assert.match(endpoint, /releases\/tags\/v1.0$/);
  assert.equal(release.repository, "acme/sample");
});

test("does not expose token when GitHub API fails", async () => {
  await assert.rejects(
    fetchRelease("acme/sample", undefined, { token: "private", fetchImpl: async () => ({ ok: false, status: 403 }) }),
    (error) => error.message.includes("403") && !error.message.includes("private")
  );
});

test("extracts attributed bullet statements only", () => {
  const release = normalizeRelease({
    tag_name: "v2", body: "## Changes\n- Adds preview links\n- Fixes duplicate notifications\n- Fixes duplicate notifications\nFooter",
    html_url: "https://github.com/acme/app/releases/tag/v2"
  }, "acme/app");
  const evidence = extractEvidence(release);
  assert.equal(evidence.length, 2);
  assert.equal(evidence[0].id, "E1");
  assert.equal(evidence[0].source, release.url);
});
