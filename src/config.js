import { readFile } from "node:fs/promises";

const CHANNELS = new Set(["blog", "linkedin", "bluesky", "newsletter"]);

export function validateConfig(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Configuration must be a JSON object.");
  }
  const project = input.project ?? {};
  const ai = input.ai ?? {};
  if (typeof project !== "object" || project === null || Array.isArray(project)) {
    throw new Error("project must be an object.");
  }
  if (typeof ai !== "object" || ai === null || Array.isArray(ai)) {
    throw new Error("ai must be an object.");
  }
  const name = project.name ?? "Open Source Project";
  const website = project.website ?? "";
  const audience = project.audience ?? ["developers"];
  const channels = input.channels ?? ["blog", "linkedin", "bluesky", "newsletter"];
  if (typeof name !== "string" || name.trim().length === 0) {
    throw new Error("project.name must be a non-empty string.");
  }
  if (typeof website !== "string" || (website && !/^https?:\/\//i.test(website))) {
    throw new Error("project.website must be an http(s) URL or empty.");
  }
  if (!Array.isArray(audience) || !audience.length || audience.some((a) => typeof a !== "string" || !a.trim())) {
    throw new Error("project.audience must contain non-empty strings.");
  }
  if (!Array.isArray(channels) || !channels.length || channels.some((c) => !CHANNELS.has(c))) {
    throw new Error("channels must contain at least one of: blog, linkedin, bluesky, newsletter.");
  }
  const provider = ai.provider ?? "none";
  if (!["none", "ollama"].includes(provider)) {
    throw new Error("Supported ai.provider values: none, ollama.");
  }
  const model = ai.model ?? "";
  const endpoint = ai.endpoint ?? "http://127.0.0.1:11434/api/generate";
  if (typeof model !== "string" || typeof endpoint !== "string") {
    throw new Error("ai.model and ai.endpoint must be strings.");
  }
  if (provider === "ollama" && (!model || !/^https?:\/\//i.test(endpoint))) {
    throw new Error("Ollama requires ai.model and an http(s) ai.endpoint.");
  }
  if (input.approvalRequired === false || input.autoPublish === true) {
    throw new Error("MVP is approval-only; auto-publishing cannot be enabled.");
  }
  return {
    project: { name: name.trim(), website, audience, voice: String(project.voice ?? "clear, technical, factual") },
    channels: [...new Set(channels)],
    ai: { provider, model, endpoint },
    approvalRequired: true,
    autoPublish: false
  };
}

export async function loadConfig(configPath) {
  if (!configPath) return validateConfig();
  let parsed;
  try {
    parsed = JSON.parse(await readFile(configPath, "utf8"));
  } catch (error) {
    throw new Error("Cannot load config " + configPath + ": " + error.message);
  }
  return validateConfig(parsed);
}
