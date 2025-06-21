// src/api/api.ts
import axios from "axios";

const BASE_URL = "http://localhost:8000"; // Change if your backend runs elsewhere

export async function runBacktest(
  symbol: string,
  interval: string,
  market: string,
  hours: number,
  strategy: any[]
) {
  try {
    const response = await axios.post(`${BASE_URL}/backtest`, {
      symbol,
      interval,
      market,
      hours,
      strategy,
    });
    return response.data;
  } catch (error: any) {
    console.error("Failed to backtest:", error);
    return { error: error.message };
  }
}
