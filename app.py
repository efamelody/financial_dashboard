from flask import Flask, jsonify, request
from flask_cors import CORS
from data_fetcher import fetch_stock_history, fetch_crypto_history
from analytics import compute_kpis, compute_moving_averages
import pandas as pd

app = Flask(__name__)
CORS(app)

def make_json_safe(df):
    if df.empty:
        return []
    df_copy = df.copy()
    # convert datetime columns to string
    for col in df_copy.select_dtypes(include=["datetime64[ns]"]).columns:
        df_copy[col] = df_copy[col].astype(str)
    # ensure column names are strings
    df_copy.columns = [str(c) for c in df_copy.columns]
    return df_copy.to_dict(orient="records")

@app.route("/api/stock/<ticker>")
def stock(ticker):
    df = fetch_stock_history(ticker.upper(), period=request.args.get("period","60d"))
    if df.empty:
        return jsonify({"error": "No data available"}), 404

    df_copy = df.rename(columns={"close":"Close"}).copy()
    kpis = compute_kpis(df_copy)
    ma = compute_moving_averages(df_copy)
    ma_safe = {k: [float(x) for x in v] for k, v in ma.items()}
    history = make_json_safe(df_copy)

    return jsonify({"kpis": kpis, "history": history, "moving_averages": ma_safe})


@app.route("/api/crypto/<symbol>")
def crypto(symbol):
    df = fetch_crypto_history(symbol)
    if df.empty:
        return jsonify({"error": "No data available"}), 404

    df_copy = df.rename(columns={"close":"Close"}).copy()
    kpis = compute_kpis(df_copy)
    ma = compute_moving_averages(df_copy)
    ma_safe = {k: [float(x) for x in v] for k, v in ma.items()}

if __name__ == "__main__":
    app.run(debug=True, port=5000)
