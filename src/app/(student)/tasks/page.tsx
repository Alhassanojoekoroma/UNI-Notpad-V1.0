import { TaskManager } from "@/components/dashboard/task-manager";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tasks</h1>
      <TaskManager />
    </div>
  );
}
