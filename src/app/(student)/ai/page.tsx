import { ChatInterface } from "@/components/ai/chat-interface";

export const metadata = {
  title: "AI Study Assistant",
  description: "Get help with your studies using AI-powered tools",
};

export default function AIAssistantPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <ChatInterface />
    </div>
  );
}
