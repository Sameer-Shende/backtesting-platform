import React from 'react';
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
  Brush,
} from 'recharts';

interface Trade {
  index: number;
  action: string;
  price: number;
}

interface Props {
  data: {
    timestamp: number;
    open?: number;
    high?: number;
    low?: number;
    close: number;
    volume?: number;
    ema?: number;
    macd?: number;
    rsi?: number;
  }[];
  trades: Trade[];
}

export default function TradeChart({ data, trades }: Props) {
  if (!data || data.length === 0) {
    return <p>No chart data available.</p>;
  }

  const markers = trades.map((trade) => ({
    x: data[trade.index]?.timestamp,
    y: trade.price,
    action: trade.action,
  }));

  return (
    <div style={{ width: '100%', height: 500 }}>
      <ResponsiveContainer>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(t) =>
              new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          >
            <Label value="Time (UTC)" offset={-5} position="insideBottom" />
          </XAxis>

          <YAxis yAxisId="left" domain={['auto', 'auto']}>
            <Label
              value="Price / Indicators"
              angle={-90}
              position="insideLeft"
              style={{ textAnchor: 'middle' }}
            />
          </YAxis>

          <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']}>
            <Label
              value="Volume"
              angle={-90}
              position="insideRight"
              style={{ textAnchor: 'middle' }}
            />
          </YAxis>

          <Tooltip
            labelFormatter={(label) =>
              new Date(label).toLocaleString('en-GB', {
                hour12: false,
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })
            }
          />
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
            m.x != null && (
              <ReferenceDot
                key={i}
                x={m.x}
                y={m.y}
                r={5}
                fill={m.action === 'buy' ? 'green' : 'red'}
                label={{ value: m.action.toUpperCase(), position: 'top' }}
                yAxisId="left"
              />
            )
          ))}

          {/* Brush for scrolling */}
          <Brush
            dataKey="timestamp"
            height={30}
            stroke="#8884d8"
            travellerWidth={10}
            startIndex={Math.max(0, data.length - 50)}
            endIndex={data.length - 1}
            tickFormatter={(t) => new Date(t).toLocaleDateString()}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
