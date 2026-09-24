import { useState, useEffect } from "react";

export default function Dashboard() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [status, setStatus] = useState(null);
  const [control, setControl] = useState(null);
  const [newTicker, setNewTicker] = useState("");
  const [manualSymbol, setManualSymbol] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem("dashboard_password") : null;
    if (saved) {
      setPassword(saved);
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (authed) {
      refreshAll();
    }
  }, [authed]);

  async function apiCall(path, options = {}) {
    const resp = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-dashboard-password": password,
        ...(options.headers || {}),
      },
    });
    if (resp.status === 401) {
      setAuthed(false);
      sessionStorage.removeItem("dashboard_password");
      throw new Error("Wrong password");
    }
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  async function refreshAll() {
    setLoading(true);
    setError("");
    try {
      const [statusData, controlData] = await Promise.all([
        apiCall("/api/status"),
        apiCall("/api/control"),
      ]);
      setStatus(statusData);
      setControl(controlData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function tryLogin() {
    sessionStorage.setItem("dashboard_password", password);
    setAuthed(true);
  }

  async function toggleMode() {
    const newMode = control.mode === "auto" ? "manual" : "auto";
    setError("");
    try {
      await apiCall("/api/control", {
        method: "POST",
        body: JSON.stringify({ mode: newMode, watchlist: control.watchlist }),
      });
      await refreshAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addTicker() {
    if (!newTicker.trim()) return;
    const symbol = newTicker.trim().toUpperCase();
    if (control.watchlist.includes(symbol)) {
      setNewTicker("");
      return;
    }
    const updated = [...control.watchlist, symbol];
    setError("");
    try {
      await apiCall("/api/control", {
        method: "POST",
        body: JSON.stringify({ mode: control.mode, watchlist: updated }),
      });
      setNewTicker("");
      await refreshAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeTicker(symbol) {
    const updated = control.watchlist.filter((t) => t !== symbol);
    setError("");
    try {
      await apiCall("/api/control", {
        method: "POST",
        body: JSON.stringify({ mode: control.mode, watchlist: updated }),
      });
      await refreshAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function manualBuy() {
    if (!manualSymbol.trim() || !manualAmount) return;
    setError("");
    try {
      await apiCall("/api/trade", {
        method: "POST",
        body: JSON.stringify({
          action: "buy",
          symbol: manualSymbol.trim(),
          dollar_amount: parseFloat(manualAmount),
        }),
      });
      setManualSymbol("");
      setManualAmount("");
      await refreshAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function manualSellAll(symbol) {
    if (!confirm(`Close entire ${symbol} position?`)) return;
    setError("");
    try {
      await apiCall("/api/trade", {
        method: "POST",
        body: JSON.stringify({ action: "sell_all", symbol }),
      });
      await refreshAll();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!authed) {
    return (
      <div style={styles.loginWrap}>
        <div style={styles.loginBox}>
          <h2>Trading Bot Dashboard</h2>
          <input
            type="password"
            placeholder="Dashboard password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryLogin()}
            style={styles.input}
          />
          <button onClick={tryLogin} style={styles.button}>Enter</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={{ margin: 0 }}>Trading Bot Dashboard</h1>
        <button onClick={refreshAll} style={styles.refreshBtn} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {status && (
        <div style={styles.summaryRow}>
          <div style={styles.card}>
            <div style={styles.label}>Portfolio Value</div>
            <div style={styles.value}>${parseFloat(status.portfolio_value).toLocaleString()}</div>
          </div>
          <div style={styles.card}>
            <div style={styles.label}>Cash</div>
            <div style={styles.value}>${parseFloat(status.cash).toLocaleString()}</div>
          </div>
          <div style={styles.card}>
            <div style={styles.label}>Mode</div>
            <div style={styles.value}>
              <span style={{ color: control?.mode === "auto" ? "#2a9d3f" : "#c9820a" }}>
                {control?.mode?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {control && (
        <div style={styles.section}>
          <h2 style={styles.h2}>Mode</h2>
          <p style={{ color: "#666", fontSize: 14 }}>
            AUTO: the EC2 bot trades this watchlist automatically every hour.
            MANUAL: the bot skips automatic trading — only trades you place below happen.
          </p>
          <button onClick={toggleMode} style={styles.button}>
            Switch to {control.mode === "auto" ? "MANUAL" : "AUTO"}
          </button>
        </div>
      )}

      {control && (
        <div style={styles.section}>
          <h2 style={styles.h2}>Watchlist ({control.watchlist.length} tickers)</h2>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              placeholder="e.g. TSLA or BTC-USD"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTicker()}
              style={styles.input}
            />
            <button onClick={addTicker} style={styles.button}>Add</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {control.watchlist.map((t) => (
              <span key={t} style={styles.chip}>
                {t}
                <button onClick={() => removeTicker(t)} style={styles.chipRemove}>×</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {status && (
        <div style={styles.section}>
          <h2 style={styles.h2}>Open Positions</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Symbol</th>
                <th style={styles.th}>Qty</th>
                <th style={styles.th}>Market Value</th>
                <th style={styles.th}>Avg Entry</th>
                <th style={styles.th}>P/L</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {status.positions.length === 0 && (
                <tr><td colSpan={6} style={styles.td}>No open positions</td></tr>
              )}
              {status.positions.map((p) => (
                <tr key={p.symbol}>
                  <td style={styles.td}>{p.symbol}</td>
                  <td style={styles.td}>{parseFloat(p.qty).toFixed(4)}</td>
                  <td style={styles.td}>${parseFloat(p.market_value).toFixed(2)}</td>
                  <td style={styles.td}>${parseFloat(p.avg_entry_price).toFixed(2)}</td>
                  <td style={{ ...styles.td, color: parseFloat(p.unrealized_pl) >= 0 ? "#2a9d3f" : "#c0392b" }}>
                    {(parseFloat(p.unrealized_plpc) * 100).toFixed(2)}%
                  </td>
                  <td style={styles.td}>
                    <button onClick={() => manualSellAll(p.symbol)} style={styles.smallBtn}>Close</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={styles.section}>
        <h2 style={styles.h2}>Manual Trade</h2>
        <p style={{ color: "#666", fontSize: 14 }}>
          Places a real order on your paper account immediately, regardless of mode.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Symbol (e.g. AAPL)"
            value={manualSymbol}
            onChange={(e) => setManualSymbol(e.target.value)}
            style={styles.input}
          />
          <input
            placeholder="Dollar amount"
            type="number"
            value={manualAmount}
            onChange={(e) => setManualAmount(e.target.value)}
            style={styles.input}
          />
          <button onClick={manualBuy} style={styles.button}>Buy</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { fontFamily: "-apple-system, sans-serif", maxWidth: 900, margin: "0 auto", padding: 20, color: "#1a1a1a" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  loginWrap: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "-apple-system, sans-serif" },
  loginBox: { display: "flex", flexDirection: "column", gap: 12, width: 280 },
  input: { padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", fontSize: 14, flex: 1 },
  button: { padding: "8px 16px", borderRadius: 6, border: "none", background: "#1a1a1a", color: "white", cursor: "pointer", fontSize: 14 },
  refreshBtn: { padding: "6px 12px", borderRadius: 6, border: "1px solid #ccc", background: "white", cursor: "pointer" },
  smallBtn: { padding: "4px 10px", borderRadius: 4, border: "1px solid #c0392b", background: "white", color: "#c0392b", cursor: "pointer", fontSize: 12 },
  errorBox: { background: "#fff0f0", border: "1px solid #f5c2c2", padding: 12, borderRadius: 6, marginBottom: 16, color: "#c0392b" },
  summaryRow: { display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" },
  card: { background: "#f7f7f8", borderRadius: 8, padding: "12px 20px", flex: 1, minWidth: 140 },
  label: { fontSize: 12, color: "#666", textTransform: "uppercase" },
  value: { fontSize: 22, fontWeight: 600, marginTop: 4 },
  section: { marginBottom: 32 },
  h2: { fontSize: 17, borderBottom: "2px solid #eee", paddingBottom: 6 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "8px 12px", background: "#efefef", fontSize: 13 },
  td: { padding: "8px 12px", borderBottom: "1px solid #eee", fontSize: 13 },
  chip: { display: "inline-flex", alignItems: "center", gap: 6, background: "#eef", padding: "4px 10px", borderRadius: 16, fontSize: 13 },
  chipRemove: { border: "none", background: "none", cursor: "pointer", fontSize: 14, color: "#666", padding: 0 },
};
