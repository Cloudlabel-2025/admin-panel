import connectMongoose from "@/app/utilis/connectMongoose";
import Client from "@/models/Client";
import { NextResponse } from "next/server";
import { requireRole } from "../../utilis/authMiddleware";

export const GET = requireRole(["super-admin", "admin", "developer"])(async function() {
  try {
    await connectMongoose();
    const clients = await Client.find().sort({ createdAt: -1 });
    return NextResponse.json(clients, { status: 200 });
  } catch (err) {
    console.error("Error fetching clients:", err);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
});

export const POST = requireRole(["super-admin", "admin", "developer"])(async function(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const client = await Client.create(body);
    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    console.error("Error creating client:", err);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
});