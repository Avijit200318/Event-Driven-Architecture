import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json(
            { message: "Unauthorized", success: false },
            { status: 401 }
        )
    }

    // capture payment
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return NextResponse.json(
                { message: "User is not found", success: false },
                { status: 404 }
            )
        }

        const subscriptionEnds = new Date();
        subscriptionEnds.setMonth(subscriptionEnds.getMonth() + 1);

        const updateUser = await prisma.user.update({
            where: { id: userId },
            data: {
                isSubscribed: true,
                subscriptionEnds: subscriptionEnds
            }
        });

        return NextResponse.json({
            message: "Subscription Added",
            subscriptionEnds: updateUser.subscriptionEnds,
            success: true
        }, { status: 2001 });
    } catch (error) {
        console.log("Error: ", error);
        return NextResponse.json(
            { message: "Internal Server Error", success: false },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json(
            { message: "Unauthorized", success: false },
            { status: 401 }
        )
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                isSubscribed: true,
                subscriptionEnds: true
            }
        });

        if (!user) {
            return NextResponse.json(
                { message: "User not found", success: false },
                { status: 404 }
            )
        }

        const now = new Date();
        if(user.subscriptionEnds && user.subscriptionEnds < now){
            await prisma.user.update({
                where: {id: userId},
                data: {
                    isSubscribed: false,
                    subscriptionEnds: null
                }
            });

            return NextResponse.json({
                message: "User subscription ends",
                isSubscrbed: false,
                success: false
            }, {status: 201})
        }

        // if user subscription not ended
        return NextResponse.json({
            message: "User subscription active",
            isSubscribed: user.isSubscribed,
            success: false
        }, {status: 201});

    } catch (error) {
        console.log("Error: ", error);
        return NextResponse.json(
            { message: "Internal Server Error", success: false },
            { status: 500 }
        )
    }
}