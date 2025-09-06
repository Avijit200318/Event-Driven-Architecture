import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { Svix } from "svix";
// svix help us to connect easily with the webhooks

export async function POST(request: NextRequest) {
    const WEBHOOK_SECRET = process.env.WEBHOOKS_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error("Please add webhooks secrect in env file");
    }

    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id")
    const svix_timestamp = headerPayload.get("svix-timestamp")
    const svix_signature = headerPayload.get("svix-signature")

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return NextResponse.json(
            { message: "Error occured - No svix headers", success: false }, { status: 401 }
        )
    }

    // now we need to handle our payload
    const payload = await request.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(WEBHOOK_SECRET);

    // create an event
    let evt: WebhookEvent;

    try {
        // for our case it not payload it body
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,

        }) as WebhookEvent;

        // console.log("event: ", evt);
    } catch (error) {
        console.log("Error verifying webhooks: ", error);
        return NextResponse.json(
            { message: "Error verifying webhooks", scuccess: false },
            { status: 500 }
        );
    }

    // open the clerk then go to configure -> webhooks -> Event catalog -> user.created
    const { id } = evt.data;
    const eventType = evt.type;

    if (eventType === "user.created") {
        // user created now lets add them into database
        try {
            const { email_addresses, primary_email_address_id } = evt.data;

            // checking
            const primaryEmail = email_addresses.find((email) => email.id === primary_email_address_id);

            if (!primaryEmail) {
                return NextResponse.json(
                    { message: "No primary email found", scuccess: false },
                    { status: 400 }
                );
            }

            // create a user in postgrsql(neon db)
            const newUser = await prisma.user.create({
                data: {
                    id: evt.data.id,
                    email: primaryEmail.email_address,
                    isSubscribed: false
                }
            });
            console.log("New user created", newUser);

        } catch (error) {
            return NextResponse.json(
                { message: "Error creating user in database", scuccess: false },
                { status: 403 }
            );
        }
    }

    return NextResponse.json(
        { message: "Webhooks created successfully", scuccess: true },
        { status: 200 }
    );
}