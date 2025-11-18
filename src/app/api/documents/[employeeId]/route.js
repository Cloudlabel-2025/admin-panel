import connectMongoose from "@/app/utilis/connectMongoose";

export const dynamic = "force-dynamic";
import Document from "@/models/Document";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function DELETE(req, { params }) {
  try {
    await connectMongoose();
    const { employeeId } = await params;

    const doc = await Document.findById(employeeId);
    if (!doc) {
      console.log('employeeId');
      
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // ✅ Delete physical file if exists
    const filePath = path.join(process.cwd(), "public", doc.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await Document.findByIdAndDelete(employeeId);

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error("❌ DELETE Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
