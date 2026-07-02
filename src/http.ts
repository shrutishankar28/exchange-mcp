// src/http.ts
// src/http.ts
import express from "express";
import type { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { createServer } from "./server.js";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req: Request, res: Response) => {
    // Extract per-user API key from Authorization header
    const apiKey = req.headers.authorization?.replace("Bearer ", "");

    // Fresh server per request — each user gets their own key context
    const server = createServer(apiKey);

    // Omitting sessionIdGenerator (rather than passing undefined) keeps the
    // transport stateless under exactOptionalPropertyTypes.
    const transport = new StreamableHTTPServerTransport({});

    try {
      // Cast needed: the SDK's onclose accessor pair types the getter as
      // `(() => void) | undefined` but the Transport interface declares it
      // as `() => void`, which exactOptionalPropertyTypes flags as a
      // mismatch even though the runtime shapes are compatible.
      await server.connect(transport as Transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("MCP request error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}
