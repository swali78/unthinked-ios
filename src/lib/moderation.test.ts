import { describe, expect, it } from "vitest";
import { findOffensive } from "./moderation";

describe("offensive-content filter", () => {
  it.each([
    "fuck off", "you're a BITCH", "sh1t trip", "fuuuuck", "what the fucking hell", "motherfucker", "you bhenchod",
    "chutiya hai", "kill yourself", "n1gger", "send nudes", "Fück you",
  ])("blocks %j", (text) => {
    expect(findOffensive(text)).not.toBeNull();
  });

  it.each([
    "Flying to Niger then Nigeria", "Weekend in Scunthorpe and Essex", "Spicy food and spices in Penang", "Classic assassin's creed vibes",
    "Lund and Malmö in June", "Shiitake hotpot in Kyoto", "Phuket or Fukuoka?", "chod do yaar, let's just go", "Dick's Sporting Goods",
    "Hiking in Cockburn Sound", "My dog is a kutta lol", "Saw the Matterhorn", "Grape season in Hampshire", "Arsenal match in London",
  ])("allows %j", (text) => {
    expect(findOffensive(text)).toBeNull();
  });
});
