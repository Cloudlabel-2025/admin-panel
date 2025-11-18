import connectMongoose from "../../../../utilis/connectMongoose";

export const dynamic = "force-dynamic";
import PurchaseOrder from "../../../../../models/PurchaseOrder";
import { NextResponse } from "next/server";
import { requireRole } from "../../../../utilis/authMiddleware";
import { unlink } from 'fs/promises';
import path from 'path';

export const GET = requireRole(["super-admin", "admin", "developer"])(async function(req, { params }) {
  try {
    await connectMongoose();
    const { id } = await params;
    const order = await PurchaseOrder.findById(id);
    return NextResponse.json(order, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

export const DELETE = requireRole(["super-admin", "admin", "developer"])(async function(req, { params }) {
  try {
    await connectMongoose();
    const { id } = await params;
    
    // Get the order to delete the file
    const order = await PurchaseOrder.findById(id);
    if (order && order.fileUrl) {
      const filePath = path.join(process.cwd(), 'public', order.fileUrl);
      try {
        await unlink(filePath);
      } catch (fileErr) {
        console.log('File deletion error:', fileErr.message);
      }
    }
    
    await PurchaseOrder.findByIdAndDelete(id);
    return NextResponse.json({ message: "Purchase order deleted successfully" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
