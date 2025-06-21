from fastapi import APIRouter
from app.services.binance_api import fetch_ohlcv

router = APIRouter()

@router.get("/ohlcv")
def get_ohlcv(symbol: str, interval: str = "1h", market: str = "spot"):
    return fetch_ohlcv(symbol, interval, market)
