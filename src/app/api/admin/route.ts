import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

const client = await clerkClient();

const isAdmin = async (userId: string) => {
    const user = await client.users.getUser(userId);
    return user.publicMetadata.role === "admin";
}