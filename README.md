# exchange-mcp

An MCP (Model Context Protocol) server that exposes Bitfinex's public REST API
as tools an LLM client (e.g. Claude Desktop) can call — starting with
`get_ticker` for current price / 24h stats on a trading pair.

Two transports are included:

- **stdio** (`src/stdio.ts`) — for local clients like Claude Desktop, which
  spawn the server as a subprocess and talk to it over stdin/stdout.
- **HTTP** (`src/index.ts` / `src/http.ts`) — a stateless `POST /mcp` endpoint
  for remote/multi-user setups, plus a `GET /health` check.

## Prerequisites

- Node.js 18+
- npm

## 1. Install

```bash
git clone https://github.com/shrutishankar28/exchange-mcp.git
cd exchange-mcp
npm install
```

## 2. Configure environment variables

Copy the example env file and adjust if needed:

```bash
cp .env.example .env
```

```env
EXCHANGE_BASE_URL=https://api-pub.bitfinex.com
PORT=3001
```

- `EXCHANGE_BASE_URL` — Bitfinex REST API base URL. The default points at
  Bitfinex's production public API, so ticker data reflects real market
  prices.
- `PORT` — only used by the HTTP transport (`npm start` / `npm run dev`).

`src/config.ts` loads `.env` from the project root regardless of the process's
current working directory, so it works correctly even when a client (like
Claude Desktop) launches the server from an unrelated directory.

## 3. Run it standalone (optional, for testing)

```bash
npm run stdio   # stdio transport — same mode Claude Desktop uses
# or
npm run dev     # HTTP transport on http://localhost:3001
```

For the HTTP transport, verify it's up:

```bash
curl http://localhost:3001/health
# {"status":"ok"}
```

## 4. Connect it to Claude Desktop

Claude Desktop launches MCP servers over **stdio**, so you'll point it at
`src/stdio.ts` via `tsx` (already installed as a dev dependency).

1. Get the **absolute path** to this project:

   ```bash
   pwd
   ```

2. Open Claude Desktop's config file:

   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

   Create the file if it doesn't exist.

3. Add (or merge into) an `mcpServers` entry, using the absolute path from
   step 1:

   ```json
   {
     "mcpServers": {
       "exchange-mcp": {
         "command": "/absolute/path/to/exchange-mcp/node_modules/.bin/tsx",
         "args": ["/absolute/path/to/exchange-mcp/src/stdio.ts"]
       }
     }
   }
   ```

   Both `command` and the path in `args` **must be absolute** — Claude
   Desktop does not run this from the project directory, so relative paths
   or `npm run stdio` won't resolve correctly.

4. **Fully quit Claude Desktop** (not just close the window — use Quit from
   the menu/tray) and reopen it. The stdio subprocess is only spawned at app
   launch.

5. Enable the connector for a chat:

   In the chat composer, click **`+`** → **Connectors**, and toggle
   **exchange-mcp** on. (Newer Claude Desktop builds surfaced MCP tools here
   instead of the older hammer/tools icon — if you don't see a hammer icon,
   this is where to look.)

6. Verify the connection in **Settings → Developer** (or **Connectors**) —
   `exchange-mcp` should show status **Running**.

## 5. Try it

Start a **new** chat (existing chats may not pick up a newly connected
server) and ask something like:

> What's the current ticker for tBTCUSD on Bitfinex?

Use Bitfinex's raw symbol format (e.g. `tBTCUSD`, `tETHUSD` — note the
leading `t`), since that's what `get_ticker` expects.

Claude Desktop shows a tool-call disclosure inline in the response when a
connector tool fires — expand it to confirm `get_ticker` actually ran and see
the raw request/response.

## Project structure

```
src/
  config.ts          # env var loading
  exchangeClient.ts   # Bitfinex REST API client
  http.ts             # Express app for the HTTP transport
  index.ts             # HTTP transport entrypoint (npm run dev / npm start)
  stdio.ts             # stdio transport entrypoint (used by Claude Desktop)
  server.ts             # McpServer construction, tool registration
  tools/
    tickers.ts          # get_ticker tool definition
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run the HTTP transport with hot reload (`tsx`) |
| `npm run stdio` | Run the stdio transport (what Claude Desktop uses) |
| `npm run build` | Type-check and compile to `dist/` |
| `npm start` | Run the compiled HTTP server from `dist/` |
