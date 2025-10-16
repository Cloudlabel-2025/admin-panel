import connectMongoose from "../../../../utilis/connectMongoose";
import PurchaseInvoice from "../../../../../models/PurchaseInvoice";
import { NextResponse } from "next/server";
import { requireRole } from "../../../../utilis/authMiddleware";
import { unlink } from 'fs/promises';
import path from 'path';

export const GET = requireRole(["super-admin", "admin"])(async function(req, { params }) {
  try {
    await connectMongoose();
    const { id } = await params;
    const invoice = await PurchaseInvoice.findById(id);
    return NextResponse.json(invoice, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

export const DELETE = requireRole(["super-admin", "admin"])(async function(req, { params }) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    // Get the invoice to delete the file
    const invoice = await PurchaseInvoice.findById(id);
    if (invoice && invoice.fileUrl) {
      const filePath = path.join(process.cwd(), 'public', invoice.fileUrl);
      try {
        await unlink(filePath);
      } catch (fileErr) {
        console.log('File deletion error:', fileErr.message);
      }
    }
    
    await PurchaseInvoice.findByIdAndDelete(id);
    return NextResponse.json({ message: "Purchase invoice deleted successfully" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

