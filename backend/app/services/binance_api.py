import httpx
from typing import Optional


def fetch_ohlcv(symbol: str, interval: str, market: str,
                start_time: Optional[int] = None,
                end_time: Optional[int] = None,
                limit: int = 1000):
    """
    Fetch OHLCV data from Binance with optional start/end time.
    """

    base_url = "https://api.binance.com" if market == "spot" else "https://fapi.binance.com"
    endpoint = "/api/v3/klines" if market == "spot" else "/fapi/v1/klines"
    url = f"{base_url}{endpoint}"

    params = {
        "symbol": symbol.upper(),
        "interval": interval,
        "limit": limit,
    }

    if start_time:
        params["startTime"] = start_time
    if end_time:
        params["endTime"] = end_time

    try:
        response = httpx.get(url, params=params, timeout=10)
        response.raise_for_status()
    except httpx.HTTPStatusError as e:
        print(f"❌ HTTP error fetching OHLCV: {e.response.status_code} - {e.response.text}")
        raise
    except httpx.RequestError as e:
        print(f"❌ Request error fetching OHLCV: {e}")
        raise

    raw = response.json()

    if not isinstance(raw, list):
        raise ValueError(f"Invalid OHLCV response format: {raw}")

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
