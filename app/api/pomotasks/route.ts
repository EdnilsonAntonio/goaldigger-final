import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db/prisma";

// GET: List all PomoTasks
export async function GET() {
  const tasks = await prisma.pomoTask.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tasks);
}

// POST: Create a new PomoTask
export async function POST(req: NextRequest) {
  const { title, notes, estPomodoros } = await req.json();
  if (!title)
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  const task = await prisma.pomoTask.create({
    data: {
      title,
      notes,
      estPomodoros: estPomodoros ?? 1,
      state: "undone",
    },
  });
  return NextResponse.json(task);
}

// PUT: Update a PomoTask (decrement estPomodoros, mark as done, or edit)
export async function PUT(req: NextRequest) {
  const { id, title, notes, estPomodoros, state, decrement } = await req.json();
  if (!id)
    return NextResponse.json({ error: "ID is required" }, { status: 400 });

  let data: any = {};
  if (title !== undefined) data.title = title;
  if (notes !== undefined) data.notes = notes;
  if (estPomodoros !== undefined) data.estPomodoros = estPomodoros;
  if (state !== undefined) data.state = state;

  // Decrement logic
  if (decrement) {
    const task = await prisma.pomoTask.findUnique({ where: { id } });
    if (!task)
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    const newCount = (task.estPomodoros ?? 1) - 1;
    data.estPomodoros = newCount;
    if (newCount <= 0) data.state = "done";
  }

  const updated = await prisma.pomoTask.update({ where: { id }, data });
  return NextResponse.json(updated);
}

// DELETE: Remove a PomoTask
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id)
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  await prisma.pomoTask.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
