# 📊 Financial Dashboard API

This project is a **Flask-based backend API** for fetching and analyzing **stock** and **cryptocurrency** data.
It pulls live data, computes financial metrics, and serves everything as JSON so a **frontend dashboard** can visualize it.

---

## 🚀 Features

* **Stock data** via [yfinance](https://pypi.org/project/yfinance/).
* **Crypto data** via [ccxt](https://github.com/ccxt/ccxt).
* **KPIs** (Key Performance Indicators) like returns, volatility, etc.
* **Moving averages** (technical indicators).
* **Caching layer** (avoids re-downloading the same data too often).
* **JSON API endpoints** (ready for frontend integration).

---

## 🛠️ Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-username/financial_dashboard.git
cd financial_dashboard
```

### 2. Create a virtual environment

```bash
python -m venv venv
source venv/bin/activate    # Mac/Linux
venv\Scripts\activate       # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

Example `requirements.txt`:

```txt
flask
flask-cors
pandas
yfinance
ccxt
```

### 4. Run the server

```bash
python app.py
```

By default, Flask runs on:
👉 [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## 🔌 API Endpoints

### 📈 Stock Data

```
GET /api/stock/<ticker>
```

Example:

```
http://127.0.0.1:5000/api/stock/AAPL?period=60d
```

* `ticker`: stock ticker (e.g. AAPL, TSLA).
* `period`: how much history to fetch (`60d`, `1y`, etc).

Response example:

```json
{
  "kpis": {
    "latest_price": 207.58,
    "return_pct": 2.35,
    "volatility": 1.22
  },
  "history": [
    {
      "Date": "2025-07-01",
      "Open_AAPL": 206.43,
      "High_AAPL": 209.95,
      "Low_AAPL": 205.90,
      "Close_AAPL": 207.58,
      "Volume_AAPL": 78788900
    }
  ],
  "moving_averages": {
    "MA_20": [205.1, 206.2, ...],
    "MA_50": [202.3, 203.5, ...]
  }
}
```

---

### 💰 Crypto Data

```
GET /api/crypto/<symbol>
```

Example:

```
http://127.0.0.1:5000/api/crypto/BTC/USDT
```

Response example:

```json
{
  "kpis": {
    "latest_price": 27000.5,
    "return_pct": 3.12,
    "volatility": 2.5
  },
  "history": [
    {
      "timestamp": "2025-07-01",
      "open": 26800,
      "high": 27300,
      "low": 26500,
      "Close": 27000,
      "volume": 12345
    }
  ],
  "moving_averages": {
    "MA_20": [26500, 26600, ...],
    "MA_50": [26000, 26150, ...]
  }
}
```

---

## 📂 Project Structure

```
financial_dashboard/
│── app.py              # Flask API
│── data_fetcher.py     # Functions to fetch stock/crypto data
│── analytics.py        # Functions to compute KPIs and indicators
│── requirements.txt    # Dependencies
│── README.md           # Documentation (this file)
```

---

## 🧾 How It Works

1. **Fetch data**

   * Stocks → `yfinance`
   * Crypto → `ccxt`

2. **Cache results**

   * Avoids overloading APIs by storing results for 20 seconds.

3. **Preprocess data**

   * Convert datetimes to strings (JSON-safe).
   * Flatten multi-index column names (e.g. `"('Close','AAPL')"` → `"Close_AAPL"`).

4. **Compute analytics**

   * KPIs (latest price, return %, volatility, etc).
   * Moving averages (20-day, 50-day, etc).

5. **Serve JSON**

   * Flask returns clean JSON, ready for charts and dashboards.

---

## 📊 What the Data Means

* **Date / timestamp** → The trading day (for stocks) or candle time (for crypto).
* **Open, High, Low, Close** → Standard OHLC price data.
* **Volume** → Number of shares or coins traded.
* **KPIs** → Quick metrics about performance.
* **Moving averages** → Trend indicators, often used in technical analysis.

---


