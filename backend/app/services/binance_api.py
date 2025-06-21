import httpx

def fetch_ohlcv(symbol: str, interval: str, market: str):
    base_url = "https://api.binance.com" if market == "spot" else "https://fapi.binance.com"
    endpoint = "/api/v3/klines" if market == "spot" else "/fapi/v1/klines"

    url = f"{base_url}{endpoint}"
    params = {
        "symbol": symbol.upper(),
        "interval": interval,
        "limit": 100
    }

    response = httpx.get(url, params=params)
    response.raise_for_status()

    raw = response.json()

    # Return parsed OHLCV format
    return [
        {
            "timestamp": r[0],
            "open": float(r[1]),
            "high": float(r[2]),
            "low": float(r[3]),
            "close": float(r[4]),
            "volume": float(r[5])
        }
        for r in raw
    ]
