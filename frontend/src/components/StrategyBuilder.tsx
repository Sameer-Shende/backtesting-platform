import { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "react-beautiful-dnd";
import { runBacktest } from "../api/api";
import TradeChart from "./TradeChart";

const strategyBlocks = [
  { id: "ema", label: "EMA", type: "indicator", name: "ema" },
  { id: "rsi", label: "RSI", type: "indicator", name: "rsi" },
  { id: "macd", label: "MACD", type: "indicator", name: "macd" },
  { id: "and", label: "AND", type: "logic", value: "AND" },
  { id: "or", label: "OR", type: "logic", value: "OR" },
  { id: "gt", label: ">", type: "operator", value: ">" },
  { id: "lt", label: "<", type: "operator", value: "<" },
];

const symbolOptions = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"];
const intervalOptions = ["1m", "5m", "15m", "1h", "4h", "1d"];
const timeRangeOptions: Record<string, number> = {
  "1D": 24,
  "1W": 24 * 7,
  "1M": 24 * 30,
  "6M": 24 * 30 * 6,
  "1Y": 24 * 30 * 12,
};
const marketOptions = ["spot", "futures"];

export default function StrategyBuilder() {
  const [canvas, setCanvas] = useState<any[]>([]);
  const [customValue, setCustomValue] = useState("");
  const [result, setResult] = useState<any>(null);
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("1h");
  const [market, setMarket] = useState("spot");
  const [timeRange, setTimeRange] = useState("1M");

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    if (
      source.droppableId === "blockList" &&
      destination.droppableId === "canvas"
    ) {
      const newBlock = strategyBlocks.find((b) => b.id === draggableId);
      if (newBlock) {
        setCanvas((prev) => [...prev, newBlock]);
      }
    }
  };

  const addValueBlock = () => {
    if (!isNaN(Number(customValue))) {
      setCanvas((prev) => [
        ...prev,
        { type: "value", value: customValue, label: customValue },
      ]);
      setCustomValue("");
    }
  };

  const handleBacktest = async () => {
    const strategyJSON = canvas.map((block) => {
      if (block.type === "indicator") return { type: "indicator", name: block.name };
      if (block.type === "operator" || block.type === "logic")
        return { type: block.type, value: block.value };
      if (block.type === "value") return { type: "value", value: block.value };
      return {};
    });

    const response = await runBacktest(
      symbol,
      interval,
      market,
      timeRangeOptions[timeRange],
      strategyJSON
    );
    setResult(response);
  };

  const selectors: [string, string, React.Dispatch<React.SetStateAction<string>>, string[]][] = [
    ["Symbol", symbol, setSymbol, symbolOptions],
    ["Market", market, setMarket, marketOptions],
    ["Interval", interval, setInterval, intervalOptions],
    ["Duration", timeRange, setTimeRange, Object.keys(timeRangeOptions)],
  ];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      padding: "1rem",
      gap: "1rem",
      maxWidth: "100%",
      margin: "auto",
      width: "100%",
    }}>
      {/* Market Controls */}
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        <div>
          <label>Symbol</label><br />
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            {symbolOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label>Market</label><br />
          <select value={market} onChange={(e) => setMarket(e.target.value)}>
            {marketOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label>Interval</label><br />
          <select value={interval} onChange={(e) => setInterval(e.target.value)}>
            {intervalOptions.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label>Duration</label><br />
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            {Object.keys(timeRangeOptions).map((key) => <option key={key} value={key}>{key}</option>)}
          </select>
        </div>
      </div>
  
      {/* Drag and Drop Builder & Backtest Panel */}
      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", width: "100%" }}>
        <DragDropContext onDragEnd={handleDragEnd}>
          {/* Blocks List */}
          <Droppable droppableId="blockList" isDropDisabled>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  padding: "1rem",
                  border: "1px solid #ccc",
                  width: 260,
                  background: "#f9f9f9",
                  borderRadius: "8px",
                }}
              >
                <h3>Blocks</h3>
                {strategyBlocks.map((block, index) => (
                  <Draggable key={block.id} draggableId={block.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          padding: "0.6rem",
                          marginBottom: "0.5rem",
                          background: "#eee",
                          borderRadius: 6,
                          cursor: "grab",
                          ...provided.draggableProps.style,
                        }}
                      >
                        {block.label}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                <div style={{ marginTop: "1rem" }}>
                  <input
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder="Enter value"
                    style={{ width: "100%", marginBottom: "0.5rem" }}
                  />
                  <button onClick={addValueBlock} style={{ width: "100%" }}>
                    Add Value
                  </button>
                </div>
              </div>
            )}
          </Droppable>
  
          {/* Strategy Canvas */}
          <Droppable droppableId="canvas">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  flex: 1,
                  padding: "1rem",
                  border: "2px dashed #999",
                  minHeight: 300,
                  borderRadius: "8px",
                  background: "#fafafa",
                }}
              >
                <h3>Strategy Canvas</h3>
                {canvas.map((block, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "0.6rem",
                      marginBottom: "0.5rem",
                      background: "#dff0d8",
                      borderRadius: 4,
                    }}
                  >
                    {block.label}
                  </div>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
  
        {/* Run Backtest Panel */}
        <div style={{
          minWidth: "320px",
          background: "#f5f5f5",
          padding: "1rem",
          borderRadius: 8,
          flexShrink: 0,
          alignSelf: "stretch",
        }}>
          <button onClick={handleBacktest}>Run Backtest</button>
          {result && (
            <div style={{ marginTop: "2rem", width: "100%" }}>
              <h4>📊 Backtest Result</h4>
              {result.error ? (
                <p style={{ color: "red" }}>❌ {result.error}</p>
              ) : (
                <>
                  <div style={{ lineHeight: 1.8 }}>
                    <p>💰 PnL: {result.pnl}</p>
                    <p>📉 Max Drawdown: {result.max_drawdown}</p>
                    <p>📈 Sharpe Ratio: {result.sharpe_ratio}</p>
                    <p>🏆 Win Rate: {result.win_rate}</p>
                    <p>🔁 Trades: {result.trades?.length}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
  
      {/* Chart Display */}
      {result && !result.error && (
        <div style={{ marginTop: "2rem", width: "100%" }}>
          <TradeChart data={result.df} trades={result.trades} />
        </div>
      )}
    </div>
  );
  
}
