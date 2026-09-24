// Server-side only. These functions run inside Vercel's serverless
// functions (pages/api/*), never in the browser — the API keys never reach
// the client.
const ALPACA_BASE = process.env.ALPACA_BASE_URL || "https://paper-api.alpaca.markets";

function alpacaHeaders() {
  return {
    "APCA-API-KEY-ID": process.env.ALPACA_API_KEY,
    "APCA-API-SECRET-KEY": process.env.ALPACA_SECRET_KEY,
  };
}

export async function getAccount() {
  const resp = await fetch(`${ALPACA_BASE}/v2/account`, { headers: alpacaHeaders() });
  if (!resp.ok) throw new Error(`Alpaca account fetch failed: ${resp.status}`);
  return resp.json();
}

export async function getPositions() {
  const resp = await fetch(`${ALPACA_BASE}/v2/positions`, { headers: alpacaHeaders() });
  if (!resp.ok) throw new Error(`Alpaca positions fetch failed: ${resp.status}`);
  return resp.json();
}

export async function placeMarketOrder(symbol, notional, side) {
  const resp = await fetch(`${ALPACA_BASE}/v2/orders`, {
    method: "POST",
    headers: { ...alpacaHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      symbol,
      notional: notional.toString(),
      side, // "buy" or "sell"
      type: "market",
      time_in_force: "day",
    }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.message || `Alpaca order failed: ${resp.status}`);
  return data;
}

export async function closePosition(symbol) {
  const resp = await fetch(`${ALPACA_BASE}/v2/positions/${symbol}`, {
    method: "DELETE",
    headers: alpacaHeaders(),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.message || `Alpaca close position failed: ${resp.status}`);
  return data;
}
