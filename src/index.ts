// src/index.ts (temporary, we'll replace this in Step 6)
// import { config } from "./config.js";

// console.log("Config loaded:", config);

// src/index.ts (temporary test)
// import { fetchTicker } from "./exchangeClient.js";
// const symbol = 'tBTCUSD'

// const url = `${config.exchangeBaseUrl}/v2/ticker/${symbol}`;
// console.log("Calling:", url);

// const ticker = await fetchTicker("tBTCUSD");
// console.log(ticker);

// src/index.ts
import { createApp } from "./http.js";
import { config } from "./config.js";

const app = createApp();

app.listen(config.port, () => {
  console.log(`MCP server running on http://localhost:${config.port}`);
  console.log(`Health check: http://localhost:${config.port}/health`);
});

