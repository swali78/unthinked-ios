import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { mockChatResponse } from "@/lib/ai/mock";
import { SYSTEM_PROMPT, travelTools } from "@/lib/ai/tools";

export const maxDuration = 60;

const hasGateway = () =>
  Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // No credentials: run the offline assistant over the same mock data.
  if (!hasGateway() || process.env.UNTHINKED_MOCK_AI === "1") {
    return mockChatResponse(messages);
  }

  const result = streamText({
    model: process.env.UNTHINKED_MODEL ?? "anthropic/claude-sonnet-5.5",
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: travelTools,
    stopWhen: isStepCount(4),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
