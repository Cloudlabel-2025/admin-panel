import connectMongoose from "@/app/utilis/connectMongoose";
import Document from "@/models/Document";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const config = { api: { bodyParser: false } };

// 📤 Upload Document
export async function POST(req) {
  try {
    await connectMongoose();
    const formData = await req.formData();
    const file = formData.get("file");
    const title = formData.get("title");
    const description = formData.get("description");
    const documentNumber = formData.get("documentNumber");
    const employeeId = formData.get("employeeId");
    const employeeName = formData.get("employeeName");
    


    if (!file || !title || !documentNumber) {
      return NextResponse.json(
        { error: "File, title, and document number are required." },
        { status: 400 }
      );
    }

    // ✅ Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/zip",
      "image/jpeg",
      "application/docx",
      "image/png",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF, ZIP, PNG, DOCX or JPEG files are allowed." },
        { status: 400 }
      );
    }

    // ✅ Validate size
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must not exceed 5MB." },
        { status: 400 }
      );
    }

    // ✅ Save file with a unique name
    const uploadDir = path.join(process.cwd(), "public", "documents");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const ext = path.extname(file.name);
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, uniqueName);
    fs.writeFileSync(filePath, buffer);

    // ✅ Save to DB
    const docData = {
      title,
      description,
      documentNumber,
      employeeId,
      employeeName,
      fileUrl: `/documents/${uniqueName}`,
      fileType: file.type,
    };
    const doc = await Document.create(docData);

    return NextResponse.json(
      { message: "Document uploaded successfully", document: doc },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ Upload Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 📥 Fetch All Documents
export async function GET() {
  try {
    await connectMongoose();
    const docs = await Document.find().sort({ createdAt: -1 });
    return NextResponse.json({ documents: docs }, { status: 200 });
  } catch (err) {
    console.error("❌ GET Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
