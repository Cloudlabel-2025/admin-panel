import connectMongoose from "../../../utilis/connectMongoose";


import PurchaseInvoice from "../../../../models/PurchaseInvoice";
import { NextResponse } from "next/server";
import { requireRole } from "../../../utilis/authMiddleware";
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const POST = requireRole(["super-admin", "admin", "developer"])(async function(req) {
  try {
    await connectMongoose();
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const uniqueFilename = `${crypto.randomUUID()}${fileExtension}`;
    const documentsDir = path.join(process.cwd(), 'public', 'documents');
    const filePath = path.join(documentsDir, uniqueFilename);
    
    // Ensure documents directory exists
    try {
      await mkdir(documentsDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }
    
    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    
    // Generate invoice number
    const lastInvoice = await PurchaseInvoice.findOne().sort({ createdAt: -1 });
    const nextNum = lastInvoice ? parseInt(lastInvoice.invoiceNumber.replace('PI-', '')) + 1 : 1;
    const invoiceNumber = `PI-${nextNum.toString().padStart(6, '0')}`;
    
    // Create purchase invoice with file info
    const purchaseInvoiceData = {
      invoiceNumber,
      poNumber: formData.get('poNumber'),
      vendorName: formData.get('vendorName'),
      vendorEmail: formData.get('vendorEmail'),
      invoiceDate: formData.get('invoiceDate') || null,
      dueDate: formData.get('dueDate') || null,
      totalAmount: formData.get('totalAmount') || null,
      paidAmount: formData.get('paidAmount') || 0,
      description: formData.get('description'),
      fileName: file.name,
      fileUrl: `/documents/${uniqueFilename}`,
      fileSize: file.size,
      uploadedBy: 'admin'
    };
    
    const purchaseInvoice = await PurchaseInvoice.create(purchaseInvoiceData);
    return NextResponse.json(purchaseInvoice, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

export const GET = requireRole(["super-admin", "admin", "developer"])(async function() {
  try {
    await connectMongoose();
    const invoices = await PurchaseInvoice.find().sort({ createdAt: -1 });
    return NextResponse.json(invoices, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
