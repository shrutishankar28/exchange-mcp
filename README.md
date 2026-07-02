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
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

- `EXCHANGE_BASE_URL` — Bitfinex REST API base URL. The default points at
  Bitfinex's production public API, so ticker data reflects real market
  prices.
- `PORT` — only used by the HTTP transport (`npm start` / `npm run dev`).
- `ANTHROPIC_API_KEY` — required by the `/chat` endpoint (`src/proxy.ts`),
  which uses the Anthropic API to drive a tool-calling chat loop over
  `get_ticker`. Get a key from the
  [Anthropic Console](https://console.anthropic.com/). Not needed for the
  stdio transport used by Claude Desktop — only for the HTTP transport's
  `/chat` route.

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

Claude Desktop shows a tool-call disclosure inline in the response when a
connector tool fires — expand it to confirm `get_ticker` actually ran and see
the raw request/response.

## Example: React chat widget

`src/exampleWidget/` contains a standalone React chat widget
(`ChatWidget.js`) plus an example wrapper (`Wrapper.js`) showing how to
render it. It's not part of the MCP server itself — copy `ChatWidget.js`
into your own React project and render it (see `Wrapper.js` for the minimal
usage) to get a floating chat UI that talks to the `/chat` endpoint.

It expects the HTTP transport running locally (`npm run dev`) at
`http://localhost:3001/chat` (see `PROXY_URL` in `ChatWidget.js` — update it if your server runs elsewhere).

## Project structure

```
src/
  config.ts          # env var loading
  exchangeClient.ts  # Bitfinex REST API client
  http.ts            # Express app for the HTTP transport
  index.ts           # HTTP transport entrypoint (npm run dev / npm start)
  stdio.ts           # stdio transport entrypoint (used by Claude Desktop)
  server.ts          # McpServer construction, tool registration
  proxy.ts           # /chat endpoint — Anthropic tool-calling loop over get_ticker
  exampleWidget/
    ChatWidget.js    # standalone React chat widget (copy into your own app)
    Wrapper.js       # example usage of ChatWidget
  tools/
    tickers.ts       # get_ticker tool definition
```
