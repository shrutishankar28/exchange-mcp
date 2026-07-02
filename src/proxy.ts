import type { Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";
import { fetchTicker } from "./exchangeClient.js";

const client = new Anthropic({ apiKey: config.anthropicApiKey });

// Mirror the tool definition so Claude knows what's available
const tools: Anthropic.Tool[] = [
  {
    name: "get_ticker",
    description: "Get the current price and 24h stats for a trading pair e.g. tBTCUSD",
    input_schema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "Trading pair symbol e.g. tBTCUSD, tETHUSD",
        },
      },
      required: ["symbol"],
    },
  },
];

// Call the right tool based on what Claude requested
async function callTool(name: string, input: Record<string, string>) {
  if (name === "get_ticker") {
    const symbol = input.symbol;
    if (!symbol) {
      throw new Error("get_ticker requires a symbol");
    }
    const ticker = await fetchTicker(symbol);
    return JSON.stringify(ticker, null, 2);
  }
  throw new Error(`Unknown tool: ${name}`);
}

export async function chatHandler(req: Request, res: Response) {
  const { message, history = [] } = req.body;

  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const messages: Anthropic.MessageParam[] = [
    ...history,
    { role: "user", content: message },
  ];

  // Agentic loop — Claude may call tools multiple times
  while (true) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `You are a helpful assistant for a crypto exchange. 
When users ask about prices or market data, use the get_ticker tool.
Keep responses concise and clear.`,
      messages,
      tools,
    });

    // If Claude is done, return the text response
    if (response.stop_reason === "end_turn") {
      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b as Anthropic.TextBlock).text)
        .join("");

      res.json({
        reply: text,
        history: [...messages, { role: "assistant", content: response.content }],
      });
      return;
    }

    // If Claude wants to call a tool, handle it
    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter((b) => b.type === "tool_use") as Anthropic.ToolUseBlock[];

      // Add Claude's tool request to history
      messages.push({ role: "assistant", content: response.content });

      // Execute each tool and collect results
      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          const result = await callTool(
            toolUse.name,
            toolUse.input as Record<string, string>
          );
          return {
            type: "tool_result" as const,
            tool_use_id: toolUse.id,
            content: result,
          };
        })
      );

      // Feed results back to Claude
      messages.push({ role: "user", content: toolResults });

      // Loop again so Claude can form its final response
      continue;
    }

    // Any other stop_reason (max_tokens, refusal, pause_turn, ...) — stop here
    // rather than looping forever with no state change.
    res.status(502).json({ error: `Unhandled stop_reason: ${response.stop_reason}` });
    return;
  }
}
