import { MessageInbox } from "@/components/messages/inbox";

export default function LecturerMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground">
          Communicate with students and other lecturers
        </p>
      </div>
      <MessageInbox />
    </div>
  );
}
