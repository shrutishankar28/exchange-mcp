import express from "express";
import type { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { createServer } from "./server.js";
import { chatHandler } from "./proxy.js";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req: Request, res: Response) => {
    const apiKey = req.headers.authorization?.replace("Bearer ", "");

    // Fresh server per request — each user gets their own key context
    const server = createServer(apiKey);

    const transport = new StreamableHTTPServerTransport({});

    try {
      await server.connect(transport as Transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("MCP request error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.post("/chat", chatHandler);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}
