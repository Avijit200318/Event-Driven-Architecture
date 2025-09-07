import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    // we will have and parameter access -> /api/todos/3584782748..[id]
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json(
            { message: "Unauthorized", success: false },
            { status: 401 }
        )
    }

    try {
        const todoId = params.id;
        const todo = await prisma.todo.findUnique({
            where: { id: todoId }
        })

        if (!todo) {
            return NextResponse.json(
                { message: "Todo not found", success: false },
                { status: 404 }
            )
        }

        if (todo.userId !== userId) {
            return NextResponse.json(
                { message: "Forbidden", success: false },
                { status: 401 }
            )
        }

        await prisma.todo.delete({
            where: { id: todoId }
        });

        return NextResponse.json(
            { message: "Todo deleted successfully", success: true },
            { status: 201 }
        )
    } catch (error) {
        console.log("Error while deleting todo", error);
        return NextResponse.json(
            { message: "Error while deleting todo", success: false },
            { status: 500 }
        )
    }
};

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { completed } = await request.json();
    const todoId = params.id;

    const todo = await prisma.todo.findUnique({
      where: { id: todoId },
    });

    if (!todo) {
      return NextResponse.json({ message: "Todo not found" }, { status: 404 });
    }

    if (todo.userId !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const updatedTodo = await prisma.todo.update({
      where: { id: todoId },
      data: { completed },
    });

    return NextResponse.json({
        message: "Todo is updated",
        updatedTodo
    }, {status: 201});
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
