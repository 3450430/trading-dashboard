# Trading Bot Dashboard

Interactive dashboard for the trading bot — view live positions, toggle
auto/manual mode, edit the tactical watchlist, and place manual trades.
Deployed on Vercel; the actual bot keeps running independently on your EC2 box.

## How it fits together

- **EC2 bot**: still runs the automated strategy hourly via cron, unchanged.
  Before each run, it now reads `control_state.json` from your GitHub repo
  (public raw URL, no auth needed for reading) to get the current mode and
  watchlist.
- **This dashboard (Vercel)**: lets you view live Alpaca account data (calls
  Alpaca directly using keys stored as Vercel environment variables — never
  exposed to your browser), and lets you edit `control_state.json` via
  GitHub's API (using a GitHub token, also stored server-side only).
- **GitHub**: hosts `control_state.json` — the shared "control panel" file
  both sides read.

## Setup

### 1. Push this folder to a GitHub repo
This can be a new repo, or a folder within your existing trading-bot repo.
Also commit `control_state.json` (copy `control_state.example.json` to
`control_state.json` first) — this is the file both sides will read/write.

### 2. Deploy to Vercel
- Go to vercel.com, sign in (can use your GitHub account), click "Add New Project"
- Import the GitHub repo you just pushed
- Vercel auto-detects it's a Next.js app — click Deploy

### 3. Set environment variables in Vercel
In your Vercel project → Settings → Environment Variables, add:

| Name | Value |
|---|---|
| `DASHBOARD_PASSWORD` | any password you choose — this locks the whole dashboard |
| `ALPACA_API_KEY` | your Alpaca paper trading API key |
| `ALPACA_SECRET_KEY` | your Alpaca paper trading secret key |
| `ALPACA_BASE_URL` | `https://paper-api.alpaca.markets` |
| `GITHUB_TOKEN` | a GitHub Personal Access Token with `repo` write access (create at github.com/settings/tokens) |
| `GITHUB_REPO` | `yourusername/your-repo-name` |
| `GITHUB_CONTROL_PATH` | `control_state.json` (or wherever you put it) |
| `GITHUB_BRANCH` | `main` |

After adding these, redeploy (Vercel → Deployments → the three dots → Redeploy).

### 4. Update the EC2 bot with the same GitHub info
On your EC2 server, add to your `.env` file:
```
GITHUB_REPO=yourusername/your-repo-name
GITHUB_CONTROL_PATH=control_state.json
GITHUB_BRANCH=main
```
(No GitHub token needed on the EC2 side — it only reads the public raw file.)

### 5. Visit your dashboard
Vercel gives you a URL like `your-project.vercel.app` — open it, enter your
`DASHBOARD_PASSWORD`, and you're in. Works from any device, anywhere.

## Security notes
- The password gate is simple (a shared secret compared server-side) —
  reasonable for a single-user personal tool, but before connecting real
  money (Phase 7), consider a stronger auth solution.
- Never commit your `.env` files or paste API keys into chat — only ever
  into Vercel's environment variable settings or your server's `.env` file.
