import { Suspense } from "react";
import { ChatScreen } from "@/components/unthinked/chat-screen";

export default function ChatPage() {
  return (
    <Suspense>
      <ChatScreen />
    </Suspense>
  );
}
