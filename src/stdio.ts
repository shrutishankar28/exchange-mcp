import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

const server = createServer();
const transport = new StdioServerTransport();

try {
  await server.connect(transport);
  console.error("Exchange MCP stdio server running");
} catch (err) {
  console.error("Failed to start stdio server:", err);
  process.exit(1);
}