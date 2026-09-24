import { requireAuth } from "../../lib/auth";
import { getControlState, updateControlState } from "../../lib/github";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  try {
    if (req.method === "GET") {
      const state = await getControlState();
      res.status(200).json(state);
    } else if (req.method === "POST") {
      const { mode, watchlist } = req.body;
      if (!["auto", "manual"].includes(mode)) {
        return res.status(400).json({ error: "mode must be 'auto' or 'manual'" });
      }
      if (!Array.isArray(watchlist)) {
        return res.status(400).json({ error: "watchlist must be an array" });
      }
      await updateControlState({ mode, watchlist });
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
