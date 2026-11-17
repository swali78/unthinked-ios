import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai";
import { checkVisa, searchFlights, searchHotels, suggestDestinations } from "@/lib/data/search";
import type { TravelToolName } from "./tools";

/**
 * Offline assistant used when no AI Gateway credentials are configured.
 * Picks a tool by keyword, runs it against the mock data, and streams the
 * same message parts a real model would, so the UI is identical.
 */
export function mockChatResponse(messages: UIMessage[]) {
  const last = [...messages].reverse().find((m) => m.role === "user");
  const text = (last?.parts ?? [])
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .toLowerCase();

  const plan = route(text);

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.write({ type: "start" });
      const say = async (id: string, words: string) => {
        writer.write({ type: "text-start", id });
        for (const chunk of words.match(/\S+\s*/g) ?? []) {
          writer.write({ type: "text-delta", id, delta: chunk });
          await sleep(28);
        }
        writer.write({ type: "text-end", id });
      };

      // Guidance goes before the cards so it never trails a finished receipt.
      await say("t1", plan.outro ? `${plan.intro} ${plan.outro}` : plan.intro);
      if (plan.tool) {
        const toolCallId = `call_${Math.random().toString(36).slice(2, 10)}`;
        writer.write({
          type: "tool-input-available",
          toolCallId,
          toolName: plan.tool.name,
          input: plan.tool.input,
        });
        await sleep(650);
        writer.write({ type: "tool-output-available", toolCallId, output: plan.tool.run() });
      }
      writer.write({ type: "finish" });
    },
  });
  return createUIMessageStreamResponse({ stream });
}

type Plan = {
  intro: string;
  outro?: string;
  tool?: { name: TravelToolName; input: Record<string, unknown>; run: () => unknown };
};

const PLACES = ["maldives", "santorini", "bali", "sharm", "phuket", "cairo", "istanbul", "tokyo", "dubai", "paris", "rome", "london", "greece", "egypt", "japan", "thailand", "türkiye", "turkey", "indonesia"];

function route(t: string): Plan {
  const place = PLACES.find((p) => t.includes(p));
  const pretty = place ? place.replace(/^\w/, (c) => c.toUpperCase()) : undefined;

  if (/visa|passport|entry/.test(t)) {
    const destination = pretty ?? "Egypt";
    return {
      intro: `Here's what an Indian passport needs for ${destination}.`,
      outro: "I can start the application and fill it from your saved passport whenever you're ready.",
      tool: { name: "checkVisa", input: { destination }, run: () => checkVisa({ destination }) },
    };
  }
  if (/hotel|stay|room|resort|villa|sleep/.test(t)) {
    const city = pretty ?? "Bali";
    return {
      intro: `These are the best-rated stays in ${city} right now.`,
      outro: "Tap one to book. Free cancellation applies until 48 hours before check-in.",
      tool: { name: "searchHotels", input: { city }, run: () => searchHotels({ city }) },
    };
  }
  const wantsIdeas = /sea|beach|island|vacation|holiday|suggest|where should|ocean|warm/.test(t);
  if (/flight|fly|ticket|book|plane/.test(t) || (place && /trip/.test(t)) || (place && !wantsIdeas)) {
    const to = pretty ?? "Cairo";
    const from = /from (\w+)/.exec(t)?.[1] ?? "Dubai";
    const cabin = /business/.test(t) ? "Business" : /first/.test(t) ? "First" : "Economy";
    return {
      intro: `I looked at ${cabin.toLowerCase()} flights from ${cap(from)} to ${to} for next Friday.`,
      outro: "Prices are per traveler and sorted cheapest first. Tap a flight to book it here.",
      tool: {
        name: "searchFlights",
        input: { from, to, cabin },
        run: () => searchFlights({ from, to, cabin, count: 5 }),
      },
    };
  }
  if (wantsIdeas) {
    return {
      intro: "For warm water this time of year, these are worth a look.",
      outro: "The Maldives and Sharm are visa-easy on your passport. Want flights for one of them?",
      tool: { name: "suggestDestinations", input: { theme: "sea" }, run: () => suggestDestinations({ theme: "sea" }) },
    };
  }
  return {
    intro:
      "I can find flights, hotels and visa requirements, or suggest somewhere to go. Try “flights to Bali next month” or “do I need a visa for Japan?”",
  };
}

const cap = (s: string) => s.replace(/^\w/, (c) => c.toUpperCase());
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
