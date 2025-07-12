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
    order,
    repeat,
    repeatInterval,
    repeatUnit,
    repeatDays,
    occurences,
    priority,
    startDate,
    endDate,
  } = await req.json();

  if (!userId || !title || !tasksListId) {
    return NextResponse.json(
      { message: "userId, title and tasksListId are required!" },
      { status: 400 }
    );
  }

  try {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        order: order || 0,
        repeat,
        repeatInterval,
        repeatUnit,
        repeatDays,
        occurences,
        priority,
        startDate,
        endDate,
        user: { connect: { id: userId } },
        tasksList: { connect: { id: tasksListId } },
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

    return NextResponse.json(tasks || [], { status: 200 });
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
    state,
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
    return NextResponse.json(
      { message: "taskId is required!" },
      { status: 400 }
    );
  }

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      return NextResponse.json({ message: "Task not found!" }, { status: 404 });
    }

    await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(state && { state }),
        ...(repeat !== undefined && { repeat }),
        ...(repeatInterval !== undefined && { repeatInterval }),
        ...(repeatUnit && { repeatUnit }),
        ...(repeatDays && { repeatDays }),
        ...(occurences !== undefined && { occurences }),
        ...(priority && { priority }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
      },
    });

    return NextResponse.json(
      { message: "Task updated successfully" },
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
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error deleting the task" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const { tasksListId, taskOrders } = await req.json();

  if (!tasksListId || !taskOrders || !Array.isArray(taskOrders)) {
    return NextResponse.json(
      { message: "tasksListId and taskOrders array are required!" },
      { status: 400 }
    );
  }

  try {
    // Update each task with its new order
    for (const { taskId, order } of taskOrders) {
      await prisma.task.update({
        where: { id: taskId },
        data: { order },
      });
    }

    return NextResponse.json(
      { message: "Task order updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error updating task order" },
      { status: 500 }
    );
  }
}
