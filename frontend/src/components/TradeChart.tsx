import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceDot,
  Label,
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
  const markers = trades.map((trade) => ({
    x: trade.index,
    y: trade.price,
    action: trade.action,
  }));

  return (
    <div style={{ width: "100%", height: 500 }}>
      <ResponsiveContainer>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString()}>
            <Label value="Time (UTC)" offset={-5} position="insideBottom" />
          </XAxis>

          <YAxis yAxisId="left">
            <Label
              value="Price / Indicators"
              angle={-90}
              position="insideLeft"
              style={{ textAnchor: "middle" }}
            />
          </YAxis>

          <YAxis yAxisId="right" orientation="right">
            <Label
              value="Volume"
              angle={-90}
              position="insideRight"
              style={{ textAnchor: "middle" }}
            />
          </YAxis>

          <Tooltip />
          <Legend verticalAlign="top" height={36} />

          {/* Volume bars on right Y axis */}
          <Bar
            yAxisId="right"
            dataKey="volume"
            barSize={4}
            fill="#8884d8"
            name="Volume"
          />

          {/* Price & Indicators on left Y axis */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="close"
            stroke="#8884d8"
            dot={false}
            name="Close"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="ema"
            stroke="#82ca9d"
            dot={false}
            name="EMA"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="macd"
            stroke="#ff7300"
            dot={false}
            name="MACD"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="rsi"
            stroke="#ffc658"
            dot={false}
            name="RSI"
          />

          {/* Buy/Sell markers */}
          {markers.map((m, i) => (
            <ReferenceDot
              key={i}
              x={data[m.x]?.timestamp}
              y={m.y}
              r={5}
              fill={m.action === "buy" ? "green" : "red"}
              label={{ value: m.action.toUpperCase(), position: "top" }}
              yAxisId="left"
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
