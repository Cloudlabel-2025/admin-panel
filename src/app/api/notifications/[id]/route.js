import connectMongoose from "../../../utilis/connectMongoose";

import Notification from "../../../../models/Notification";

export async function DELETE(request, { params }) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    await Notification.findByIdAndDelete(id);
    return Response.json({ message: "Notification deleted successfully" });
  } catch (error) {
    return Response.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectMongoose();
    const { id } = await params;
    const data = await request.json();
    
    await Notification.findByIdAndUpdate(id, data);
    return Response.json({ message: "Notification updated successfully" });
  } catch (error) {
    return Response.json({ error: "Failed to update notification" }, { status: 500 });
  }
}