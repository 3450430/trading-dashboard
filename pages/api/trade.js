import { requireAuth } from "../../lib/auth";
import { placeMarketOrder, closePosition } from "../../lib/alpaca";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, symbol, dollar_amount } = req.body;

  try {
    if (action === "buy") {
      if (!symbol || !dollar_amount) {
        return res.status(400).json({ error: "symbol and dollar_amount required for buy" });
      }
      const order = await placeMarketOrder(symbol.toUpperCase(), dollar_amount, "buy");
      return res.status(200).json({ success: true, order });
    }
    if (action === "sell_all") {
      if (!symbol) {
        return res.status(400).json({ error: "symbol required for sell_all" });
      }
      const result = await closePosition(symbol.toUpperCase());
      return res.status(200).json({ success: true, result });
    }
    return res.status(400).json({ error: "action must be 'buy' or 'sell_all'" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
