import { tool } from "ai";
import { z } from "zod";
import { checkVisa, searchFlights, searchHotels, suggestDestinations } from "@/lib/data/search";

export const travelTools = {
  suggestDestinations: tool({
    description:
      "Suggest destinations for a theme such as sea, beach, city, culture, desert or food. Use when the traveler hasn't picked a place yet.",
    inputSchema: z.object({ theme: z.string().optional().describe("e.g. 'sea', 'culture'") }),
    execute: async (input) => suggestDestinations(input),
  }),
  searchFlights: tool({
    description:
      "Search flights between two cities or airports. Results render as selectable cards with an in-chat checkout, so don't repeat every flight in text.",
    inputSchema: z.object({
      from: z.string().describe("Origin city or IATA code. Default to Dubai (DXB) if unknown."),
      to: z.string().describe("Destination city or IATA code"),
      date: z.string().optional().describe("Departure date, YYYY-MM-DD"),
      cabin: z.enum(["Economy", "Premium", "Business", "First"]).optional(),
    }),
    execute: async (input) => searchFlights({ ...input, count: 5 }),
  }),
  searchHotels: tool({
    description: "Search hotels in a city. Results render as cards with booking.",
    inputSchema: z.object({
      city: z.string(),
      maxPricePerNight: z.number().optional().describe("In US cents"),
    }),
    execute: async (input) => searchHotels(input),
  }),
  checkVisa: tool({
    description:
      "Look up visa requirements for the traveler's passport (default India) and a destination country or city.",
    inputSchema: z.object({
      destination: z.string(),
      nationality: z.string().optional(),
    }),
    execute: async (input) => checkVisa(input),
  }),
};

export type TravelToolName = keyof typeof travelTools;

export const SYSTEM_PROMPT = `You are Unthinked, a calm, well-travelled assistant inside a travel app for booking flights, hotels and visas.
The traveler is Khalid, an Indian passport holder living in Dubai (home airport DXB). Today is ${new Date().toDateString()}.
- Use tools for anything about flights, hotels, visas or destination ideas. The UI renders tool results as rich cards, so keep your text short: one or two sentences that add judgment (best value, timing, a caveat), never a list repeating the cards.
- Write in plain sentence case. No markdown headings, no bullet lists unless asked.
- Prices are mock data in USD. Bookings and payments are simulated.
- If something is missing (dates, origin), assume sensible defaults and say what you assumed.`;
