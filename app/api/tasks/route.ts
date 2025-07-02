import prisma from "@/db/prisma";
import { connect } from "http2";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Get the data from body
  const {
    userId,
    title,
    description,
    tasksListId,
    repeat,
    repeatInterval,
    repeatUnit,
    repeatDays,
    occurences,
    priority,
    startDate,
    endDate,
  } = await req.json();

  if (!userId || !title) {
    return NextResponse.json(
      { message: "userId and title are required!" },
      { status: 400 }
    );
  }

  try {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        repeat,
        repeatInterval,
        repeatUnit,
        repeatDays,
        occurences,
        priority,
        startDate,
        endDate,
        user: { connect: { id: userId } },
        ...(tasksListId && { tasksList: { connect: { id: tasksListId } } }),
      },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error creating the task!" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const userId = req.headers.get("userId");
  if (!userId) {
    return NextResponse.json(
      { message: "userId is required" },
      { status: 400 }
    );
  }

  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId: userId,
        // tasksListId: null, //not working, have to filter in front-end
      },
    });

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ message: "No tasks found!" }, { status: 404 });
    }

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error fetching the tasks" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  // Get the data from body
  const {
    taskId,
    title,
    description,
    repeat,
    repeatInterval,
    repeatUnit,
    repeatDays,
    occurences,
    priority,
    startDate,
    endDate,
  } = await req.json();

  if (!taskId) {
      return NextResponse.json({ message: "taskId is required!" }, { status: 400 });
  }

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      return NextResponse.json({ message: "Task not found!" }, { status: 404 });
    }

    if (!title) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }

    await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        repeat,
        repeatInterval,
        repeatUnit,
        repeatDays,
        occurences,
        priority,
        startDate,
        endDate,
      },
    });

    return NextResponse.json(
      { message: "Tasks List updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { taskId } = await req.json();

  if (!taskId) {
    return NextResponse.json(
      { message: "taskId is required!" },
      { status: 400 }
    );
  }

  try {
    await prisma.task.delete({
      where: { id: taskId },
    });
    return NextResponse.json(
      { message: "Task deleted successfully" },
      { status: 200 }
    );
  } catch (error) {}
}
