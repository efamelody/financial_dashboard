import time
import pandas as pd
import yfinance as yf
import ccxt

class TTLCache:
    def __init__(self, ttl=30):
        self.ttl = ttl
        self.store = {}
    def get(self, key):
        v = self.store.get(key)
        if not v: return None
        ts, val = v
        if time.time() - ts > self.ttl:
            del self.store[key]
            return None
        return val
    def set(self, key, val):
        self.store[key] = (time.time(), val)

cache = TTLCache(ttl=20)

def fetch_stock_history(ticker, period="60d", interval="1d"):
    key = f"stock:{ticker}:{period}:{interval}"
    cached = cache.get(key)
    if cached is not None: return cached
    try:
        df = yf.download(ticker, period=period, interval=interval, progress=False, auto_adjust=True)
        df.reset_index(inplace=True)
        cache.set(key, df)
        return df
    except Exception as e:
        print(f"Stock fetch error ({ticker}):", e)
        return pd.DataFrame()

def fetch_crypto_history(symbol="BTC/USDT", exchange_name="binance", timeframe="1d"):
    key = f"crypto:{exchange_name}:{symbol}:{timeframe}"
    cached = cache.get(key)
    if cached is not None: return cached
    try:
        exchange = getattr(ccxt, exchange_name)({'timeout':10000})
        ohlcv = exchange.fetch_ohlcv(symbol, timeframe=timeframe, limit=200)
        df = pd.DataFrame(ohlcv, columns=["timestamp","open","high","low","close","volume"])
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
        cache.set(key, df)
        return df
    except Exception as e:
        print(f"Crypto fetch error ({symbol}):", e)
        return pd.DataFrame(columns=["timestamp","open","high","low","close","volume"])
