#!/usr/bin/env node
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, join, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { fetchRelease, normalizeRelease } from "./github.js";
import { createCampaign } from "./generator.js";
import { generateAiSuggestions } from "./ai.js";

const HELP = [
  "Launch OS v0.1 - generate reviewable launch campaigns from release notes",
  "",
  "Usage:",
  "  launchos generate --release-file fixtures/example-release.json [--config launchos.config.json] [--out .tmp/demo]",
  "  launchos generate --repo owner/name [--tag v1.0.0] [--config launchos.config.json] [--out launch-output]",
  "",
  "Options:",
  "  --release-file  Path to GitHub-style release JSON (offline mode)",
  "  --repo          GitHub repository owner/name",
  "  --tag           Release tag; omit to use latest GitHub release",
  "  --config        JSON configuration file; optional",
  "  --out           Output directory (default: launch-output)",
  "  --dry-run       Show planned output without writing files",
  "  --help          Print this help",
  "",
  "No content is published. Generated files require human approval."
].join("\n");

function parseArgs(argv) {
  const [command, ...rest] = argv;
  if (command === "--help" || command === "-h" || !command) return { help: true };
  if (command !== "generate") throw new Error("Unknown command: " + command);
  const flags = {};
  const permitted = new Set(["release-file", "repo", "tag", "config", "out", "dry-run", "help"]);
  for (let i = 0; i < rest.length; i++) {
    const item = rest[i];
    if (!item.startsWith("--") || !permitted.has(item.slice(2))) throw new Error("Unknown option: " + item);
    const key = item.slice(2);
    if (["help", "dry-run"].includes(key)) { flags[key] = true; continue; }
    const value = rest[++i];
    if (!value || value.startsWith("--")) throw new Error("Option --" + key + " needs a value.");
    flags[key] = value;
  }
  return { flags, help: flags.help };
}

async function saveFiles(files, output) {
  const root = resolve(output);
  for (const [relative, content] of Object.entries(files)) {
    const destination = resolve(root, relative);
    if (!destination.startsWith(root + sep)) throw new Error("Unsafe output filename: " + relative);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, content, { encoding: "utf8" });
  }
}

export async function run(argv = process.argv.slice(2)) {
  const parsed = parseArgs(argv);
  if (parsed.help) { console.log(HELP); return; }
  const flags = parsed.flags;
  if (!flags["release-file"] && !flags.repo) throw new Error("Provide --release-file or --repo.");
  if (flags["release-file"] && flags.tag) throw new Error("--tag is only valid with --repo and without --release-file.");
  const config = await loadConfig(flags.config);
  let release;
  if (flags["release-file"]) {
    const raw = JSON.parse(await readFile(flags["release-file"], "utf8"));
    release = normalizeRelease(raw, flags.repo || "");
  } else {
    release = await fetchRelease(flags.repo, flags.tag);
  }
  const campaign = createCampaign(release, config);
  const aiSuggestions = await generateAiSuggestions(release, campaign.evidence, config);
  if (aiSuggestions) {
    campaign.files["content/ai-suggestions.md"] = aiSuggestions;
    const manifest = JSON.parse(campaign.files["manifest.json"]);
    manifest.generatedFiles.push("content/ai-suggestions.md");
    campaign.files["manifest.json"] = JSON.stringify(manifest, null, 2) + "\n";
  }
  const output = flags.out || "launch-output";
  if (!flags["dry-run"]) await saveFiles(campaign.files, output);
  console.log((flags["dry-run"] ? "DRY RUN: " : "Generated ") +
    Object.keys(campaign.files).length + " draft files for " + release.tag +
    (flags["dry-run"] ? "" : " in " + resolve(output)));
  for (const file of Object.keys(campaign.files)) console.log(" - " + file);
  console.log("Approval required. Nothing has been published.");
}

const isEntrypoint = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  run().catch((error) => {
    console.error("Launch OS error: " + error.message);
    process.exitCode = 1;
  });
}
