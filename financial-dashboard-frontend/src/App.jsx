import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

/**
 * Helper: return first existing property from row among candidates
 */
function pickVal(row, candidates) {
  for (const k of candidates) {
    if (Object.prototype.hasOwnProperty.call(row, k)) return row[k];
  }
  return null;
}

/**
 * Build likely key name variants for a field and symbol.
 * (Handles: plain keys, tuple-like keys, underscore-flattened keys, etc.)
 */
function buildCandidates(field, symbol) {
  const Field = field.charAt(0).toUpperCase() + field.slice(1);
  return [
    Field,
    field,
    field.toLowerCase(),
    `('${Field}', '${symbol}')`,
    `('${Field}','${symbol}')`,
    `('${Field}', '${symbol}')`, // with space (some responses show a space)
    `${Field}_${symbol}`,
    `${symbol}_${Field}`,
    `${Field}${symbol}`,
    `${symbol}${Field}`,
    `${Field} ${symbol}`,
  ];
}

function buildDateCandidates() {
  return ["Date", "date", "timestamp", "Timestamp", "('Date', '')", "('Date','')", "index"];
}

function normalizeMAs(maObj) {
  const out = {};
  if (!maObj) return out;
  Object.entries(maObj).forEach(([k, v]) => {
    // prefer patterns like MA7, MA_7, 7, "20", "MA20"
    const digits = (k.match(/\d+/) || [])[0];
    if (digits) {
      out[`MA${digits}`] = v;
    } else {
      out[k] = v;
    }
  });
  return out;
}

function App() {
  const [ticker, setTicker] = useState("AAPL");
  const [data, setData] = useState([]);
  const [kpis, setKpis] = useState({});
  const [movingAverages, setMovingAverages] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedFields, setSelectedFields] = useState(["Close"]);
  const [dateRange, setDateRange] = useState("1M");

  const stockOptions = ["AAPL", "MSFT", "TSLA", "GOOGL", "AMZN"];

  const toggleField = (field) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const fetchData = async (symbol) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`http://localhost:5000/api/stock/${symbol}`);
      const rawData = res.data.history || [];
      const maRaw = res.data.moving_averages || {};
      const kpisRaw = res.data.kpis || {};

      // Map raw rows to consistent keys, handling different backend formats
      const cleaned = rawData
        .map((item) => {
          const dateVal = pickVal(item, buildDateCandidates());
          const openVal = pickVal(item, buildCandidates("Open", symbol));
          const highVal = pickVal(item, buildCandidates("High", symbol));
          const lowVal = pickVal(item, buildCandidates("Low", symbol));
          const closeVal = pickVal(item, buildCandidates("Close", symbol));
          const volVal = pickVal(item, buildCandidates("Volume", symbol));

          // normalize numbers (some values may be strings)
          const Open = openVal == null ? null : Number(openVal);
          const High = highVal == null ? null : Number(highVal);
          const Low = lowVal == null ? null : Number(lowVal);
          const Close = closeVal == null ? null : Number(closeVal);
          const Volume = volVal == null ? null : Number(volVal);

          // Date: try to get a parsable string
          const Date = dateVal == null ? null : String(dateVal);

          // Only return rows that have a Date and at least a Close
          if (!Date || (Close == null && Open == null && High == null && Low == null)) return null;
          return { Date, Open, High, Low, Close, Volume };
        })
        .filter(Boolean);

      setData(cleaned);

      // set KPIs (prefer backend kpis, otherwise compute)
      const computedKpis = { ...kpisRaw };
      if (!computedKpis.last_price && cleaned.length) {
        const last = cleaned[cleaned.length - 1].Close ?? cleaned[cleaned.length - 1].Open;
        computedKpis.last_price = last;
      }
      if (!computedKpis.pct_change && cleaned.length >= 2) {
        const last = cleaned[cleaned.length - 1].Close ?? cleaned[cleaned.length - 1].Open;
        const prev = cleaned[cleaned.length - 2].Close ?? cleaned[cleaned.length - 2].Open;
        computedKpis.pct_change = prev ? ((last - prev) / prev) * 100 : 0;
        computedKpis.change = last - prev;
      }
      if (!computedKpis.high && cleaned.length) {
        computedKpis.high = Math.max(...cleaned.map((r) => r.High ?? r.Close ?? -Infinity));
      }
      if (!computedKpis.low && cleaned.length) {
        computedKpis.low = Math.min(...cleaned.map((r) => r.Low ?? r.Close ?? Infinity));
      }

      setKpis(computedKpis);
      setMovingAverages(normalizeMAs(maRaw));
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data. Is the backend running and ticker valid?");
      setData([]);
      setKpis({});
      setMovingAverages({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(ticker);
  }, [ticker]);

  const getFilteredData = () => {
    if (!data || data.length === 0) return [];
    const end = dayjs(data[data.length - 1].Date);
    let start;
    switch (dateRange) {
      case "7D":
        start = end.subtract(7, "day");
        break;
      case "1M":
        start = end.subtract(1, "month");
        break;
      case "6M":
        start = end.subtract(6, "month");
        break;
      case "1Y":
        start = end.subtract(1, "year");
        break;
      default:
        return data;
    }
    return data.filter((item) => dayjs(item.Date).isAfter(start));
  };

  const filteredData = getFilteredData();

  // Summary stats derived from filteredData
  const computeSummary = (rows) => {
    if (!rows || rows.length === 0) return null;
    const closes = rows.map((r) => r.Close).filter((v) => v != null);
    const highs = rows.map((r) => r.High).filter((v) => v != null);
    const lows = rows.map((r) => r.Low).filter((v) => v != null);
    const vols = rows.map((r) => r.Volume).filter((v) => v != null);

    const lastClose = closes.length ? closes[closes.length - 1] : null;
    const firstClose = closes.length ? closes[0] : null;
    const pctChange = firstClose ? ((lastClose - firstClose) / firstClose) * 100 : null;
    const avgVolume = vols.length ? vols.reduce((a, b) => a + b, 0) / vols.length : null;

    return {
      lastClose,
      pctChange,
      maxClose: closes.length ? Math.max(...closes) : null,
      minClose: closes.length ? Math.min(...closes) : null,
      periodHigh: highs.length ? Math.max(...highs) : null,
      periodLow: lows.length ? Math.min(...lows) : null,
      avgVolume,
    };
  };

  const summary = computeSummary(filteredData);

  // last values of MAs (try MA7 and MA50)
  const lastMA7 = movingAverages.MA7?.slice(-1)[0] ?? null;
  const lastMA50 = movingAverages.MA50?.slice(-1)[0] ?? null;

  return (
    <div style={{ display: "flex", padding: "20px", gap: "20px" }}>
      {/* Left: Chart & controls */}
      <div style={{ flex: 2 }}>
        <h1>Financial Dashboard</h1>

        <div style={{ marginBottom: "10px" }}>
          <label style={{ marginRight: "8px" }}>Select Stock:</label>
          <select
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            style={{ padding: "6px 10px" }}
          >
            {stockOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div style={{ margin: "10px 0" }}>
          {["Open", "High", "Low", "Close", "Volume"].map((f) => (
            <button
              key={f}
              onClick={() => toggleField(f)}
              style={{
                marginRight: "8px",
                padding: "6px 10px",
                borderRadius: 6,
                border: selectedFields.includes(f) ? "2px solid #3b82f6" : "1px solid #ccc",
                background: selectedFields.includes(f) ? "#eef2ff" : "white",
                cursor: "pointer",
              }}
            >
              {selectedFields.includes(f) ? ` ${f}` : f}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: "14px" }}>
          {["7D", "1M", "6M", "1Y", "ALL"].map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              style={{
                marginRight: "8px",
                padding: "6px 10px",
                borderRadius: 6,
                border: dateRange === r ? "2px solid #3b82f6" : "1px solid #ccc",
                background: dateRange === r ? "#eef2ff" : "white",
                cursor: "pointer",
              }}
            >
              {r}
            </button>
          ))}
        </div>

        <h3>{ticker} — Chart</h3>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && filteredData.length > 0 && (
          <ResponsiveContainer width="100%" height={420}>
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="Date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedFields.includes("Close") && (
                <Line type="monotone" dataKey="Close" stroke="#6366f1" dot={false} />
              )}
              {selectedFields.includes("Open") && (
                <Line type="monotone" dataKey="Open" stroke="#10b981" dot={false} />
              )}
              {selectedFields.includes("High") && (
                <Line type="monotone" dataKey="High" stroke="#f97316" dot={false} />
              )}
              {selectedFields.includes("Low") && (
                <Line type="monotone" dataKey="Low" stroke="#16a34a" dot={false} />
              )}
              {selectedFields.includes("Volume") && (
                <Line type="monotone" dataKey="Volume" stroke="#111827" dot={false} />
              )}

              {/* optional: overlay moving averages from backend if present */}
              {movingAverages.MA7 && (
                <Line
                  type="monotone"
                  dataKey={(row) => {
                    // map MA7 by index if lengths match, otherwise skip
                    const idx = filteredData.indexOf(row);
                    const arr = movingAverages.MA7;
                    return arr && arr[idx] !== undefined ? Number(arr[idx]) : null;
                  }}
                  name="MA7"
                  stroke="#ef4444"
                  dot={false}
                />
              )}
              {movingAverages.MA50 && (
                <Line
                  type="monotone"
                  dataKey={(row) => {
                    const idx = filteredData.indexOf(row);
                    const arr = movingAverages.MA50;
                    return arr && arr[idx] !== undefined ? Number(arr[idx]) : null;
                  }}
                  name="MA50"
                  stroke="#06b6d4"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Right: Summary */}
      <div
        style={{
          flex: 1,
          padding: 16,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          background: "#fafafa",
          minWidth: 260,
        }}
      >
        <h3>📊 Summary</h3>

        {(!kpis || Object.keys(kpis).length === 0) && !summary ? (
          <p>No summary available yet.</p>
        ) : (
          <>
            <p>
              <strong>Current Price:</strong>{" "}
              {kpis.last_price != null ? `$${Number(kpis.last_price).toFixed(2)}` : summary?.lastClose != null ? `$${summary.lastClose.toFixed(2)}` : "N/A"}
            </p>

            <p>
              <strong>Change (period):</strong>{" "}
              {kpis.pct_change != null ? `${Number(kpis.pct_change).toFixed(2)}%` : summary?.pctChange != null ? `${summary.pctChange.toFixed(2)}%` : "N/A"}
            </p>

            <p>
              <strong>Period High:</strong>{" "}
              {summary?.periodHigh != null ? `$${summary.periodHigh.toFixed(2)}` : (kpis.high ? `$${Number(kpis.high).toFixed(2)}` : "N/A")}
            </p>

            <p>
              <strong>Period Low:</strong>{" "}
              {summary?.periodLow != null ? `$${summary.periodLow.toFixed(2)}` : (kpis.low ? `$${Number(kpis.low).toFixed(2)}` : "N/A")}
            </p>

            <p>
              <strong>Avg Volume:</strong>{" "}
              {summary?.avgVolume != null ? Math.round(summary.avgVolume).toLocaleString() : "N/A"}
            </p>

            <hr style={{ margin: "12px 0" }} />

            <h4>Trend</h4>
            <p>
              <strong>MA7:</strong> {lastMA7 ? Number(lastMA7).toFixed(2) : "N/A"} <br />
              <strong>MA50:</strong> {lastMA50 ? Number(lastMA50).toFixed(2) : "N/A"}
            </p>

            <p>
              {lastMA7 != null && lastMA50 != null
                ? lastMA7 > lastMA50
                  ? "📈 Short-term > Long-term — bullish"
                  : "📉 Short-term < Long-term — bearish"
                : "MA data unavailable"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
