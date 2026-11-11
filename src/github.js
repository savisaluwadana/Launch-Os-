export function parseRepo(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value) || value.includes("..")) {
    throw new Error("Repository must be in owner/name format.");
  }
  return value;
}

export function normalizeRelease(input, repository = "") {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Release data must be an object.");
  }
  const tag = input.tag_name ?? input.tag;
  const name = input.name ?? tag;
  const body = input.body ?? "";
  if (typeof tag !== "string" || !tag.trim() || typeof name !== "string" || typeof body !== "string") {
    throw new Error("Release requires tag_name (or tag), name and text body.");
  }
  const repo = repository || input.repository || "";
  if (repo) parseRepo(repo);
  const url = input.html_url || input.url || (repo ? "https://github.com/" + repo + "/releases/tag/" + encodeURIComponent(tag) : "");
  if (url && (typeof url !== "string" || !/^https?:\/\//i.test(url))) {
    throw new Error("Release URL must be an http(s) URL.");
  }
  return { tag: tag.trim(), name: name.trim() || tag.trim(), body: body.slice(0, 70000), url, repository: repo, publishedAt: input.published_at ?? "" };
}

export async function fetchRelease(repository, tag, options = {}) {
  const repo = parseRepo(repository);
  const endpoint = "https://api.github.com/repos/" + repo + "/releases/" +
    (tag ? "tags/" + encodeURIComponent(tag) : "latest");
  const token = options.token ?? process.env.GITHUB_TOKEN ?? "";
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(endpoint, {
    headers: {
      "Accept": "application/vnd.github+json",
      "User-Agent": "LaunchOS/0.1",
      ...(token ? { "Authorization": "Bearer " + token } : {})
    },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) {
    throw new Error("GitHub release fetch failed (HTTP " + response.status + "). Check the repository, tag and token.");
  }
  return normalizeRelease(await response.json(), repo);
}

export function extractEvidence(release, limit = 15) {
  const lines = release.body.split(/\r?\n/);
  const seen = new Set();
  const evidence = [];
  for (const line of lines) {
    const match = line.trim().match(/^(?:[-*+]|\d+[.)])\s+(.+)$/);
    if (!match) continue;
    const detail = match[1].trim().replace(/\s+/g, " ").slice(0, 350);
    if (detail.length < 8 || /^full changelog\b/i.test(detail)) continue;
    if (seen.has(detail.toLowerCase())) continue;
    seen.add(detail.toLowerCase());
    evidence.push({ id: "E" + (evidence.length + 1), text: detail, source: release.url || "provided release notes" });
    if (evidence.length >= limit) break;
  }
  return evidence;
}
