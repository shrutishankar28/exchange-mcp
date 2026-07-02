import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchTicker } from "../exchangeClient.js";

export function registerTickerTools(server: McpServer, apiKey?: string) {
  server.tool(
    "get_ticker",
    "Get the current price and 24h stats for a trading pair e.g. tBTCUSD",
    {
      symbol: z.string().describe("Trading pair symbol e.g. tBTCUSD, tETHUSD"),
    },
    async ({ symbol }) => {
      const ticker = await fetchTicker(symbol, apiKey);
      return {
        content: [{ type: "text", text: JSON.stringify(ticker, null, 2) }],
      };
    }
  );
}
