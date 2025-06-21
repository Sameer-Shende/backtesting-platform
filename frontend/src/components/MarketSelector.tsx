import React, { useState } from "react";

interface Props {
  onSubmit: (market: string, symbol: string) => void;
}

const MarketSelector: React.FC<Props> = ({ onSubmit }) => {
  const [market, setMarket] = useState("spot");
  const [symbol, setSymbol] = useState("BTCUSDT");

  const handleSubmit = () => {
    if (symbol.trim()) {
      onSubmit(market, symbol.trim().toUpperCase());
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Select Market and Symbol</h2>
      <select value={market} onChange={(e) => setMarket(e.target.value)}>
        <option value="spot">Spot</option>
        <option value="futures">Futures</option>
      </select>

      <input
        type="text"
        value={symbol}
        placeholder="e.g., BTCUSDT"
        onChange={(e) => setSymbol(e.target.value)}
        style={{ marginLeft: "1rem" }}
      />

      <button onClick={handleSubmit} style={{ marginLeft: "1rem" }}>
        Load Data
      </button>
    </div>
  );
};

export default MarketSelector;
