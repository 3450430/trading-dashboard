import { requireAuth } from "../../lib/auth";
import { getAccount, getPositions } from "../../lib/alpaca";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  try {
    const [account, positions] = await Promise.all([getAccount(), getPositions()]);
    res.status(200).json({
      portfolio_value: account.portfolio_value,
      cash: account.cash,
      positions: positions.map((p) => ({
        symbol: p.symbol,
        qty: p.qty,
        market_value: p.market_value,
        avg_entry_price: p.avg_entry_price,
        unrealized_pl: p.unrealized_pl,
        unrealized_plpc: p.unrealized_plpc,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
