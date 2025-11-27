import { NextResponse } from "next/server";


import connectMongoose from "@/app/utilis/connectMongoose";
import mongoose from "mongoose";

export async function PATCH(request) {
  try {
    await connectMongoose();
    const { employeeId, profilePicture } = await request.json();

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const departmentCollections = collections
      .map(col => col.name)
      .filter(name => name.endsWith("_department"));

    let employee = null;
    let foundCollection = null;

    for (const collName of departmentCollections) {
      const collection = db.collection(collName);
      employee = await collection.findOne({ employeeId });
      if (employee) {
        foundCollection = collection;
        break;
      }
    }

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    await foundCollection.updateOne(
      { employeeId },
      { $set: { profilePicture } }
    );

    return NextResponse.json({ 
      message: "Profile picture updated successfully",
      profilePicture 
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    return NextResponse.json({ error: "Failed to update profile picture" }, { status: 500 });
  }
}
