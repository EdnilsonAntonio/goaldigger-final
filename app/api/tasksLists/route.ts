import prisma from "@/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Receive the data from body
  const { title, userId } = await req.json();

  if (!title || !userId) {
    return NextResponse.json(
      { message: "Title and user id are required!" },
      { status: 400 }
    );
  }
  // Save it to the database
  try {
    const tasksList = await prisma.tasksList.create({
      data: {
        title,
        user: { connect: { id: userId } },
      },
    });
    return NextResponse.json(tasksList, { status: 201 });
    // Catch any errors
  } catch (error) {
    console.error(error);
    return NextResponse.json(error, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const userId = req.headers.get("userId");

  if (!userId) {
    return NextResponse.json(
      { message: "userId is required!" },
      { status: 400 }
    );
  }

  try {
    const tasksLists = await prisma.tasksList.findMany({
      where: {
        userId: userId,
      },
    });

    if (!tasksLists) {
      return NextResponse.json({ message: "No tasks found!" }, { status: 404 });
    }

    return NextResponse.json(tasksLists, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const { tasksListId, completion } = await req.json();

  if (!tasksListId) {
    return NextResponse.json(
      { message: "tasksListId is required!" },
      { status: 400 }
    );
  }

  try {
    const existingList = await prisma.tasksList.findUnique({
      where: { id: tasksListId },
    });

    if (!existingList) {
      return NextResponse.json(
        { message: "Tasks List not found!" },
        { status: 404 }
      );
    }

    await prisma.tasksList.update({
      where: { id: tasksListId },
      data: { completion: completion }
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
  const { tasksListId } = await req.json();

  if (!tasksListId) {
    return NextResponse.json(
      { message: "tasksListId is required!" },
      { status: 400 }
    );
  }

  try {
    const existingList = await prisma.tasksList.findUnique({
      where: { id: tasksListId },
    });

    if (!existingList) {
      return NextResponse.json(
        { message: "Tasks List not found!" },
        { status: 404 }
      );
    }

    await prisma.tasksList.delete({
      where: { id: tasksListId },
    });

    return NextResponse.json(
      { message: "Tasks List deleted successfully" },
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
