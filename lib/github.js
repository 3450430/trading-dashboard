// Reads/writes control_state.json in your GitHub repo via the Contents API.
// This file is the shared "control panel" state — both this dashboard and
// the EC2 bot read it. The EC2 bot only needs read access (public raw URL,
// no token needed there); only this dashboard needs write access, using a
// GitHub Personal Access Token stored as a Vercel environment variable.
const GITHUB_API = "https://api.github.com";

function githubHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
  };
}

function repoPath() {
  const repo = process.env.GITHUB_REPO; // e.g. "yourusername/trading-bot"
  const path = process.env.GITHUB_CONTROL_PATH || "control_state.json";
  return { repo, path };
}

export async function getControlState() {
  const { repo, path } = repoPath();
  const resp = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
    headers: githubHeaders(),
  });
  if (!resp.ok) {
    if (resp.status === 404) {
      // File doesn't exist yet — return a sensible default
      return { mode: "auto", watchlist: [], sha: null };
    }
    throw new Error(`GitHub read failed: ${resp.status}`);
  }
  const data = await resp.json();
  const content = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
  return { ...content, sha: data.sha };
}

export async function updateControlState(newState) {
  const { repo, path } = repoPath();
  const current = await getControlState(); // to get the current sha, required by GitHub for updates

  const body = {
    message: `Update control state via dashboard (${new Date().toISOString()})`,
    content: Buffer.from(
      JSON.stringify({ mode: newState.mode, watchlist: newState.watchlist }, null, 2)
    ).toString("base64"),
    branch: process.env.GITHUB_BRANCH || "main",
  };
  if (current.sha) body.sha = current.sha;

  const resp = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
    method: "PUT",
    headers: { ...githubHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.message || `GitHub write failed: ${resp.status}`);
  }
  return resp.json();
}
