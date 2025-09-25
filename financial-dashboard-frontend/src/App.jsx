import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from "recharts";

function App() {
  const [ticker, setTicker] = useState("AAPL"); // default ticker
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedFields, setSelectedFields] = useState(["Close"]); // ✅ Default to Close

  const stockOptions = ["AAPL", "MSFT", "TSLA", "GOOGL", "AMZN"];

  //  Toggle handler
  const toggleField = (field) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  // Fetch stock data
  const fetchData = async (symbol) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`http://localhost:5000/api/stock/${symbol}`);
      const rawData = res.data.history;

      const cleaned = rawData.map((item) => ({
        Date: item["('Date', '')"],
        Open: item[`('Open', '${symbol}')`],
        High: item[`('High', '${symbol}')`],
        Low: item[`('Low', '${symbol}')`],
        Close: item[`('Close', '${symbol}')`],
        Volume: item[`('Volume', '${symbol}')`],
      }));

      setData(cleaned);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(ticker);
  }, [ticker]);

  return (
    <div style={{ padding: "20px" }}>
      <h1> Financial Dashboard</h1>

      {/* Dropdown for stock selection */}
      <label style={{ marginRight: "10px" }}>Select Stock:</label>
      <select
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
        style={{ padding: "8px", fontSize: "16px" }}
      >
        {stockOptions.map((symbol) => (
          <option key={symbol} value={symbol}>
            {symbol}
          </option>
        ))}
      </select>

      {/* Toggle buttons */}
      <div style={{ margin: "20px 0" }}>
        {["Open", "High", "Low", "Close", "Volume"].map((field) => (
          <button
            key={field}
            onClick={() => toggleField(field)}
            style={{
              marginRight: "10px",
              padding: "8px 12px",
              borderRadius: "6px",
              border: selectedFields.includes(field)
                ? "2px solid #8884d8"
                : "1px solid #ccc",
              background: selectedFields.includes(field) ? "#eee" : "white",
              cursor: "pointer",
            }}
          >
            {selectedFields.includes(field) ? ` ${field}` : field}
          </button>
        ))}
      </div>

      <h2>{ticker} Stock Prices</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && data.length > 0 && (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="Date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {selectedFields.includes("Close") && (
              <Line type="monotone" dataKey="Close" stroke="#8884d8" dot={false} />
            )}
            {selectedFields.includes("Open") && (
              <Line type="monotone" dataKey="Open" stroke="#82ca9d" dot={false} />
            )}
            {selectedFields.includes("High") && (
              <Line type="monotone" dataKey="High" stroke="#ff7300" dot={false} />
            )}
            {selectedFields.includes("Low") && (
              <Line type="monotone" dataKey="Low" stroke="#387908" dot={false} />
            )}
            {selectedFields.includes("Volume") && (
              <Line type="monotone" dataKey="Volume" stroke="#000000" dot={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default App;
