import pandas as pd

def compute_kpis(df, price_col="Close"):
    if df.empty or price_col not in df.columns:
        return {"last_price": None, "change": None, "pct_change": None, "high": None, "low": None}

    last_price = float(df[price_col].iloc[-1])
    prev_price = float(df[price_col].iloc[-2]) if len(df) > 1 else last_price
    change = last_price - prev_price
    pct_change = (change / prev_price * 100) if prev_price else 0

    max_val = df[price_col].max()
    high = float(max_val.iloc[0]) if isinstance(max_val, pd.Series) else float(max_val)

    min_val = df[price_col].min()
    low = float(min_val.iloc[0]) if isinstance(min_val, pd.Series) else float(min_val)

    return {"last_price": last_price, "change": change, "pct_change": pct_change, "high": high, "low": low}


def compute_moving_averages(df, price_col="Close", windows=[7, 50, 200]):
    out = {}
    if df.empty or price_col not in df.columns:
        return out

    for w in windows:
        ma_series = df[price_col].rolling(window=w, min_periods=1).mean()
        out[f"MA{w}"] = [float(x) for x in ma_series.values]

    return out
