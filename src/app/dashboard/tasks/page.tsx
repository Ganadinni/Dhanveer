export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { TasksClient } from "./TasksClient";

export default async function TasksPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const tasks = await db.task.findMany({
    where: {
      completed: false,
      ...(isAdmin ? {} : { assignedToId: session?.user?.id }),
    },
    include: {
      lead: { select: { id: true, businessName: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  const overdue = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)));

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Tasks"
        subtitle={`${tasks.length} pending${overdue.length > 0 ? ` · ${overdue.length} overdue` : ""}`}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <TasksClient initialTasks={JSON.parse(JSON.stringify(tasks))} />
      </div>
    </div>
  );
}
