from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import pandas as pd
import numpy as np
import ta
from datetime import datetime, timedelta

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StrategyBlock(BaseModel):
    type: str
    name: str | None = None
    value: str | None = None

class BacktestRequest(BaseModel):
    symbol: str
    interval: str
    market: str
    strategy: list[StrategyBlock]
    hours: int

def interval_to_milliseconds(interval: str) -> int:
    mapping = {
        "1m": 60_000,
        "3m": 180_000,
        "5m": 300_000,
        "15m": 900_000,
        "30m": 1_800_000,
        "1h": 3_600_000,
        "2h": 7_200_000,
        "4h": 14_400_000,
        "6h": 21_600_000,
        "8h": 28_800_000,
        "12h": 43_200_000,
        "1d": 86_400_000,
    }
    return mapping.get(interval, 60_000)

@app.post("/backtest")
async def backtest(req: BacktestRequest):
    end_time = int(datetime.utcnow().timestamp() * 1000)
    start_time = end_time - req.hours * 3600 * 1000
    all_data = []
    url = "https://fapi.binance.com/fapi/v1/klines" if req.market == "futures" else "https://api.binance.com/api/v3/klines"

    try:
        while start_time < end_time:
            params = {
                "symbol": req.symbol,
                "interval": req.interval,
                "startTime": start_time,
                "limit": 1000
            }
            async with httpx.AsyncClient(timeout=10) as client:
                res = await client.get(url, params=params)
                res.raise_for_status()
                chunk = res.json()

            if not chunk:
                break

            all_data.extend(chunk)
            last_time = chunk[-1][0]
            start_time = last_time + interval_to_milliseconds(req.interval)

            if len(chunk) < 1000:
                break

    except Exception as e:
        print("❌ OHLCV Fetch Failed:", e)
        return {
            "pnl": None,
            "trades": [],
            "strategy": "",
            "error": f"OHLCV fetch error: {e}"
        }

    df = pd.DataFrame(all_data, columns=[
        "timestamp", "open", "high", "low", "close", "volume",
        "_", "_", "_", "_", "_", "_"
    ])
    df["close"] = pd.to_numeric(df["close"])

    df["ema"] = ta.trend.ema_indicator(df["close"], window=10)
    df["macd"] = ta.trend.macd_diff(df["close"])
    df["rsi"] = ta.momentum.rsi(df["close"], window=14)

    expr_parts = []
    for block in req.strategy:
        if block.type == "indicator":
            expr_parts.append(f'df["{block.name}"]')
        elif block.type == "operator":
            expr_parts.append(block.value)
        elif block.type == "logic":
            expr_parts.append("&" if block.value.upper() == "AND" else "|" if block.value.upper() == "OR" else block.value)
        elif block.type == "value":
            expr_parts.append(f'{block.value}')

    expr = " ".join(expr_parts)
    print("Evaluating strategy:", expr)

    df["buy"] = False
    try:
        safe_expr = expr.replace("&", ") & (").replace("|", ") | (")
        df["buy"] = eval(f"({safe_expr})")
    except Exception as e:
        print("❌ Eval error:", str(e))
        return {
            "pnl": None,
            "trades": [],
            "strategy": expr,
            "error": f"Strategy parse error: {e}"
        }

    trades = []
    in_trade = False
    entry_price = 0

    for i in range(len(df)):
        if df.loc[i, "buy"] and not in_trade:
            in_trade = True
            entry_price = df.loc[i, "close"]
            trades.append({"index": i, "action": "buy", "price": entry_price})
        elif not df.loc[i, "buy"] and in_trade:
            in_trade = False
            exit_price = df.loc[i, "close"]
            trades.append({"index": i, "action": "sell", "price": exit_price})

    pnl = 0.0
    returns = []
    wins = 0
    losses = 0

    for i in range(0, len(trades), 2):
        if i + 1 < len(trades):
            buy = trades[i]["price"]
            sell = trades[i + 1]["price"]
            ret = (sell - buy) / buy * 100
            returns.append(ret)
            pnl += ret
            if ret > 0:
                wins += 1
            else:
                losses += 1

    max_drawdown = min(returns) if returns else 0
    win_rate = wins / (wins + losses) * 100 if wins + losses > 0 else 0
    sharpe = (np.mean(returns) / np.std(returns)) * np.sqrt(252) if len(returns) > 1 and np.std(returns) != 0 else 0

    return {
        "pnl": f"{pnl:.2f}%",
        "max_drawdown": f"{max_drawdown:.2f}%",
        "sharpe_ratio": f"{sharpe:.2f}",
        "win_rate": f"{win_rate:.2f}%",
        "trades": trades,
        "strategy": expr,
        "df": df[["timestamp", "close", "ema", "macd", "rsi"]].tail(200).to_dict(orient="records"),
        "error": None
    }