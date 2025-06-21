from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import pandas as pd
import numpy as np
import ta

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
    hours: int  # <-- new


@app.post("/backtest")
async def backtest(req: BacktestRequest):
    # 1. Fetch OHLCV from Binance
    limit = min(req.hours, 1000)

    if req.market == "futures":
        url = f"https://fapi.binance.com/fapi/v1/klines?symbol={req.symbol}&interval={req.interval}&limit={limit}"
    else:
        url = f"https://api.binance.com/api/v3/klines?symbol={req.symbol}&interval={req.interval}&limit={limit}"


    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        raw = res.json()

    df = pd.DataFrame(raw, columns=[
        "timestamp", "open", "high", "low", "close", "volume",
        "_", "_", "_", "_", "_", "_"
    ])
    
    df["close"] = pd.to_numeric(df["close"])

    # 2. Calculate indicators
    df["ema"] = ta.trend.ema_indicator(df["close"], window=10)
    df["macd"] = ta.trend.macd_diff(df["close"])
    df["rsi"] = ta.momentum.rsi(df["close"], window=14)

    # 3. Convert strategy blocks to expression string
    expr_parts = []
    for block in req.strategy:
        if block.type == "indicator":
            expr_parts.append(f'df["{block.name}"]')
        elif block.type == "operator":
            expr_parts.append(block.value)
        elif block.type == "logic":
            if block.value.upper() == "AND":
                expr_parts.append("&")
            elif block.value.upper() == "OR":
                expr_parts.append("|")
            else:
                expr_parts.append(block.value)
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

    # 5. Simple trade simulation: Buy → Sell on next False
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

    # 6. Metrics
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