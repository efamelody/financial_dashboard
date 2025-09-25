import { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Fetch data from Flask backend
    axios.get("http://localhost:5000/api/stock/AAPL")
    .then(res => {
      const cleaned = res.data.history.map(row => ({
        Date: row["('Date', '')"],
        Close: row["('Close', 'AAPL')"],
        Open: row["('Open', 'AAPL')"],
        High: row["('High', 'AAPL')"],
        Low: row["('Low', 'AAPL')"],
        Volume: row["('Volume', 'AAPL')"]
      }));
      setData(cleaned);
    })
      .catch(err => {
        console.error("Error fetching data:", err);
      });
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>📈 Financial Dashboard</h1>
      <h2>Apple (AAPL) Stock Prices</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="Date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="Close" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>


    </div>
  );
}

export default App;
