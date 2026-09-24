// Simple shared-secret auth. Not enterprise-grade, but sufficient for a
// single-user personal dashboard — never skip this check once real money
// is involved (Phase 7), and consider upgrading to a real auth provider
// before then.
export function checkAuth(req) {
  const provided = req.headers["x-dashboard-password"];
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) {
    throw new Error("DASHBOARD_PASSWORD is not set in Vercel environment variables");
  }
  return provided === expected;
}

export function requireAuth(req, res) {
  if (!checkAuth(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}
