import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTickerTools } from "./tools/tickers.js";

export function createServer(apiKey?: string): McpServer {
  const server = new McpServer({
    name: "exchange-mcp",
    version: "1.0.0",
  });

  registerTickerTools(server, apiKey);

  // Future tools go here:
  // registerBalanceTools(server, apiKey);
  // registerOrderBookTools(server, apiKey);

  return server;
}
