import { createApp } from "./http.js";
import { config } from "./config.js";

const app = createApp();

app.listen(config.port, "127.0.0.1", () => {
  console.log(`MCP server running on http://localhost:${config.port}`);
  console.log(`Health check: http://localhost:${config.port}/health`);
});

