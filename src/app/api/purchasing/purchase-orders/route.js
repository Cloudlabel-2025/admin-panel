import connectMongoose from "../../../utilis/connectMongoose";
import PurchaseOrder from "../../../../models/PurchaseOrder";
import { NextResponse } from "next/server";
import { requireRole } from "../../../utilis/authMiddleware";
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const POST = requireRole(["super-admin", "admin"])(async function(req) {
  try {
    await connectMongoose();
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
    const documentsDir = path.join(process.cwd(), 'public', 'documents');
    const filePath = path.join(documentsDir, uniqueFilename);
    
    // Ensure documents directory exists
    await mkdir(documentsDir, { recursive: true });
    
    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    
    // Generate PO number
    const lastPO = await PurchaseOrder.findOne().sort({ createdAt: -1 });
    const nextNum = lastPO ? parseInt(lastPO.poNumber.replace('PO-', '')) + 1 : 1;
    const poNumber = `PO-${nextNum.toString().padStart(6, '0')}`;
    
    // Create purchase order with file info
    const purchaseOrderData = {
      poNumber,
      vendorName: formData.get('vendorName'),
      vendorEmail: formData.get('vendorEmail') || '',
      vendorPhone: formData.get('vendorPhone') || '',
      deliveryDate: formData.get('deliveryDate') || null,
      totalAmount: formData.get('totalAmount') ? Number(formData.get('totalAmount')) : null,
      description: formData.get('description') || '',
      fileName: file.name,
      fileUrl: `/documents/${uniqueFilename}`,
      fileSize: file.size,
      uploadedBy: 'admin'
    };
    
    const purchaseOrder = await PurchaseOrder.create(purchaseOrderData);
    return NextResponse.json(purchaseOrder, { status: 201 });
  } catch (err) {
    console.error('Purchase Order POST Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});

export const GET = requireRole(["super-admin", "admin"])(async function() {
  try {
    await connectMongoose();
    const orders = await PurchaseOrder.find().sort({ createdAt: -1 });
    return NextResponse.json(orders, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
