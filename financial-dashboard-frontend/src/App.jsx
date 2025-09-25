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
  const [data, setData] = useState([]);
  const [selectedFields, setSelectedFields] = useState(["Close"]); // default show Close

  useEffect(() => {
    axios.get("http://localhost:5000/api/stock/AAPL")
      .then(res => {
        const rawData = res.data.history;
  
        // 🔄 Transform keys to simpler names
        const cleaned = rawData.map(item => ({
          Date: item["('Date', '')"],
          Open: item["('Open', 'AAPL')"],
          High: item["('High', 'AAPL')"],
          Low: item["('Low', 'AAPL')"],
          Close: item["('Close', 'AAPL')"],
          Volume: item["('Volume', 'AAPL')"]
        }));
  
        setData(cleaned);
      })
      .catch(err => {
        console.error("Error fetching data:", err);
      });
  }, []);
  

  const toggleField = (field) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>📈 Financial Dashboard</h1>
      <h2>Apple (AAPL) Stock Data</h2>

      {/* Info card */}
      <div style={{ marginBottom: "20px", padding: "10px", background: "#f9f9f9", borderRadius: "8px" }}>
        <h3>📘 What does this chart mean?</h3>
        <p>
          Stock prices have several values each day:
          <br />
          <b>Open</b> = first price of the day | 
          <b> High</b> = highest price | 
          <b> Low</b> = lowest price | 
          <b> Close</b> = final price when market closed | 
          <b> Volume</b> = number of shares traded
        </p>
      </div>

      {/* Toggle buttons */}
      <div style={{ marginBottom: "20px" }}>
        {["Open", "High", "Low", "Close", "Volume"].map((field) => (
          <button
            key={field}
            onClick={() => toggleField(field)}
            style={{
              marginRight: "10px",
              padding: "8px 12px",
              borderRadius: "6px",
              border: selectedFields.includes(field) ? "2px solid #8884d8" : "1px solid #ccc",
              background: selectedFields.includes(field) ? "#eee" : "white",
              cursor: "pointer"
            }}
          >
            {selectedFields.includes(field) ? `✅ ${field}` : field}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="Date" />
          <YAxis />
          <Tooltip />
          <Legend />

          {selectedFields.includes("Open") && <Line type="monotone" dataKey="Open" stroke="#8884d8" />}
          {selectedFields.includes("High") && <Line type="monotone" dataKey="High" stroke="#82ca9d" />}
          {selectedFields.includes("Low") && <Line type="monotone" dataKey="Low" stroke="#ff7300" />}
          {selectedFields.includes("Close") && <Line type="monotone" dataKey="Close" stroke="#387908" />}
          {selectedFields.includes("Volume") && <Line type="monotone" dataKey="Volume" stroke="#ff0000" />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default App;
