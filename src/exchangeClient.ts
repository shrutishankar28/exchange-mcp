import { config } from "./config.js";

export interface Ticker {
  symbol: string;
  bid: number;
  bid_size: number;
  ask: number;
  ask_size: number;
  daily_change: number;
  daily_change_pct: number;
  last_price: number;
  volume: number;
  high: number;
  low: number;
  timestamp: number;
}

type TickerTuple = [
  bid: number,
  bid_size: number,
  ask: number,
  ask_size: number,
  daily_change: number,
  daily_change_relative: number,
  last_price: number,
  volume: number,
  high: number,
  low: number,
  timestamp: number
];

function mapArrayToTicker(symbol: string, raw: TickerTuple): Ticker {
  const [
    bid,
    bid_size,
    ask,
    ask_size,
    daily_change,
    daily_change_relative,
    last_price,
    volume,
    high,
    low,
    timestamp,
  ] = raw;

  return {
    symbol,
    bid,
    bid_size,
    ask,
    ask_size,
    daily_change,
    daily_change_pct: parseFloat((daily_change_relative * 100).toFixed(4)), // 0.0318 → 3.18
    last_price,
    volume,
    high,
    low,
    timestamp,
  };
}

export async function fetchTicker(
  symbol: string,
  apiKey?: string
): Promise<Ticker> {
  const url = `${config.exchangeBaseUrl}/v2/ticker/${symbol}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ticker for ${symbol}: ${response.status} ${response.statusText}`
    );
  }

  const raw: number[] = await response.json();
  if (raw.length !== 11) {
    throw new Error(`Unexpected ticker response shape for ${symbol}`);
  }

  return mapArrayToTicker(symbol, raw as TickerTuple);
}