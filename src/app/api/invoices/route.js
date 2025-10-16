import connectMongoose from "@/app/utilis/connectMongoose";
import Invoice from "@/models/Invoice";
import { NextResponse } from "next/server";
import { requireRole } from "../../utilis/authMiddleware";

export const GET = requireRole(["super-admin", "admin", "developer"])(async function() {
  try {
    await connectMongoose();
    const invoices = await Invoice.find()
      .populate("clientId", "name email company")
      .sort({ createdAt: -1 });
    return NextResponse.json(invoices, { status: 200 });
  } catch (err) {
    console.error("Error fetching invoices:", err);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
});

export const POST = requireRole(["super-admin", "admin", "developer"])(async function(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    
    // Generate invoice number
    const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
    const invoiceNumber = `INV-${String(Date.now()).slice(-6)}`;
    
    body.invoiceNumber = invoiceNumber;
    const invoice = await Invoice.create(body);
    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    console.error("Error creating invoice:", err);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
});