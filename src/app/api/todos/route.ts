import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

const ITEM_PER_PAGE = 10;

export async function GET(request: NextRequest){
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json(
            { message: "Unauthorized", success: false },
            { status: 401 }
        )
    }

    // fetch search params
    const {searchParams} = new URL(request.url);
    // we will send page but if empty then use 1
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";

    try {
        const todos = await prisma.todo.findMany({
            where: {
                userId,
                title: {
                    contains: search,
                    mode: "insensitive"
                }
            },
            orderBy: {createdAt: "desc"},
            take: ITEM_PER_PAGE,
            skip: (page - 1) * ITEM_PER_PAGE
            // skipping items like for page2 (2-1)*10 so we are skipping 10 items
        });

        const totalItems = await prisma.todo.count({
            where: {
                userId,
                title: {
                    contains: "search",
                    mode: "insensitive"
                }
            }
        });

        const totalPages = Math.ceil(totalItems / ITEM_PER_PAGE);

        return NextResponse.json({
            todos,
            currentPage: page,
            totalPages
        })
    } catch (error) {
        console.log("Error while pagination: ", error);
        return NextResponse.json({
            message: "Error while pagination",
            success: false
        }, {status: 500})
    }
}

export async function POST(request: NextRequest){
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json(
            { message: "Unauthorized", success: false },
            { status: 401 }
        )
    }

    const user = await prisma.user.findUnique({
        where: {id: userId},
        include: {todos: true}
    });
    console.log("user: ", user);

    if(!user){
        return NextResponse.json({
            message: "User not found",
            success: false
        }, {status: 402});
    }

    if(!user.isSubscribed && user.todos.length >= 3){
        return NextResponse.json({
            message: "Free users can only create only 3 todos. Please subscribe to our paid plan to write more awasome todos",
            success: false
        }, {status: 402});
    }

    const {title} = await request.json();

    const newTodo = await prisma.todo.create({
        data: {title, userId}
    })

    return NextResponse.json({
        message: "",
        todo: newTodo,
        success: true
    }, {status: 201})
}