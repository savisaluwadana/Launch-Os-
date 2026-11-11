import { extractEvidence } from "./github.js";

const sanitize = (value) => String(value).replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
const bullet = (entry) => "- " + sanitize(entry.text) + " [" + entry.id + "]";

function compact(text, max) {
  const clean = sanitize(text).replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
  return clean.length > max ? clean.slice(0, max - 1).trimEnd() + "…" : clean;
}

export function createCampaign(release, config) {
  const evidence = extractEvidence(release);
  const project = config.project.name;
  const tag = release.tag;
  const releaseLink = release.url || config.project.website || "[Add the release URL]";
  const audience = config.project.audience.join(", ");
  const changes = evidence.length
    ? evidence.map(bullet)
    : ["- No specific release-note bullets found. Maintainer must add and verify the highlights."];
  const sourceTable = evidence.length
    ? evidence.map((item) => "| " + item.id + " | " + sanitize(item.text).replace(/\|/g, "\\|") + " | " + item.source + " |")
    : ["| - | No evidence extracted | - |"];
  const title = project + " " + tag;
  const first = evidence[0]?.text ?? "";
  const blurb = first ? compact(first, 140) : "Review the release notes for what changed.";
  const brief = [
    "# Launch brief: " + title, "",
    "Status: DRAFT - approval required; nothing has been published.", "",
    "## Release", "- Name: " + release.name, "- Tag: " + tag, "- Source: " + releaseLink,
    "- Intended audience: " + audience, "", "## Claims from release notes", ...changes, "",
    "## Evidence register", "| ID | Claim as written in release notes | Source |",
    "| --- | --- | --- |", ...sourceTable, "",
    "## Verification required",
    "- Release-note bullets are attributed to the release author, NOT independently tested facts.",
    "- Verify all performance, security, compatibility and availability claims before publishing.",
    "- Confirm links, calls to action and distribution permissions.", ""
  ].join("\n");

  const files = { "brief.md": brief };
  if (config.channels.includes("blog")) {
    files["content/blog.md"] = [
      "# " + title + ": what changed", "",
      "This is a draft announcement for " + audience + ". Confirm the details before publishing.", "",
      "## Highlights", ...changes, "", "## How to get started",
      "Read the [release notes](" + releaseLink + ") and follow the project's installation documentation.",
      "", "## What to try next",
      "Choose one highlight, try it in a test environment, and share feedback with the maintainers.",
      "", "Editorial note: validate every numbered evidence reference against the release source.", ""
    ].join("\n");
  }
  if (config.channels.includes("linkedin")) {
    files["content/linkedin.md"] = [
      title + " is out.", "",
      "For " + audience + ":", "",
      first ? compact(first, 230) : "See the release notes for the changes.",
      "", "What would you like to see improved next?", "",
      "Release notes: " + releaseLink, "",
      "[Draft - review technical claims and obtain publishing approval]", ""
    ].join("\n");
  }
  if (config.channels.includes("bluesky")) {
    const head = title + " is out. ";
    const link = release.url || "";
    let available = 300 - head.length - link.length - (link ? 2 : 0);
    let post = head + (available > 15 ? compact(blurb, available) : "");
    if (link && link.length + 2 <= 300) post += "\n" + link;
    files["content/bluesky.md"] = post.slice(0, 300).trim() + "\n";
  }
  if (config.channels.includes("newsletter")) {
    files["content/newsletter.md"] = [
      "Subject: " + title + " release update", "",
      "Hi,", "", project + " " + tag + " is available.",
      "", "From the release notes:", ...changes,
      "", "Read the full announcement: " + releaseLink,
      "", "We'd welcome your feedback.", "",
      "[Draft - approval required]", ""
    ].join("\n");
  }
  files["manifest.json"] = JSON.stringify({
    schemaVersion: 1,
    project, repository: release.repository, releaseTag: tag, releaseUrl: release.url,
    status: "draft", approvalRequired: true, published: false,
    channels: config.channels, evidence,
    generatedFiles: Object.keys(files).filter((name) => name !== "manifest.json")
  }, null, 2) + "\n";
  return { files, evidence };
}
