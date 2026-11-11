import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

test("offline demo generates draft assets on disk", async () => {
  const folder = await mkdtemp(join(tmpdir(), "launchos-test-"));
  try {
    const output = join(folder, "draft");
    const result = spawnSync(process.execPath, [
      resolve("src/cli.js"), "generate",
      "--release-file", resolve("fixtures/example-release.json"),
      "--config", resolve("launchos.config.json"),
      "--out", output
    ], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const manifest = JSON.parse(await readFile(join(output, "manifest.json"), "utf8"));
    assert.equal(manifest.status, "draft");
    assert.equal(manifest.published, false);
    assert.match(await readFile(join(output, "content/blog.md"), "utf8"), /E1/);
    assert.match(result.stdout, /Nothing has been published/);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test("unknown CLI options fail clearly", () => {
  const result = spawnSync(process.execPath, [resolve("src/cli.js"), "generate", "--publish"], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown option/);
});
