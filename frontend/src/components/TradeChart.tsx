import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceDot
} from "recharts";

interface Trade {
  index: number;
  action: string;
  price: number;
}

interface Props {
  data: any[];
  trades: Trade[];
}

export default function TradeChart({ data, trades }: Props) {
  // Add buy/sell markers
  const markers = trades.map((trade) => ({
    x: trade.index,
    y: trade.price,
    action: trade.action,
  }));

  return (
    <div style={{ width: "100%", height: 400 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" hide />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="close" stroke="#8884d8" dot={false} />
          <Line type="monotone" dataKey="ema" stroke="#82ca9d" dot={false} />
          <Line type="monotone" dataKey="macd" stroke="#ff7300" dot={false} />
          <Line type="monotone" dataKey="rsi" stroke="#ffc658" dot={false} />

          {/* Buy/Sell markers */}
          {markers.map((m, i) => (
            <ReferenceDot
              key={i}
              x={m.x}
              y={m.y}
              r={5}
              fill={m.action === "buy" ? "green" : "red"}
              label={{ value: m.action, position: "top" }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
