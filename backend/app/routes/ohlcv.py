from fastapi import APIRouter, Query
from typing import Optional
from app.services.binance_api import fetch_ohlcv

router = APIRouter()

@router.get("/ohlcv")
def get_ohlcv(
    symbol: str,
    interval: str = "1h",
    market: str = "spot",
    startTime: Optional[int] = Query(None, description="Start timestamp in ms"),
    endTime: Optional[int] = Query(None, description="End timestamp in ms")
):
    try:
        return fetch_ohlcv(symbol, interval, market, start_time=startTime, end_time=endTime)
    except Exception as e:
        return {"error": f"Failed to fetch OHLCV: {str(e)}"}
