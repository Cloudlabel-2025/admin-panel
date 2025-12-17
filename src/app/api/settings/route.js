import connectMongoose from "@/app/utilis/connectMongoose";
import { NextResponse } from "next/server";
import { requireAuth } from "../../utilis/authMiddleware";
import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  updatedBy: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now }
});

const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

async function handleGET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    
    if (key) {
      const setting = await Settings.findOne({ key });
      return NextResponse.json({ value: setting?.value || "10:00" });
    }
    
    const settings = await Settings.find({});
    return NextResponse.json(settings);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function handlePUT(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const { key, value, updatedBy, role } = body;
    
    if (role !== 'SUPER_ADMIN' && role !== 'super-admin' && role !== 'Super-admin') {
      return NextResponse.json({ error: "Only Super Admin can update settings" }, { status: 403 });
    }
    
    const setting = await Settings.findOneAndUpdate(
      { key },
      { key, value, updatedBy, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    
    if (key === 'REQUIRED_LOGIN_TIME') {
      try {
        const { createEmployeeModel } = require('@/models/Employee');
        const departments = ['Technical', 'Functional', 'Production', 'OIC', 'Management'];
        const notifications = [];
        
        for (const dept of departments) {
          const EmployeeModel = createEmployeeModel(dept);
          const employees = await EmployeeModel.find({});
          
          for (const emp of employees) {
            notifications.push({
              employeeId: emp.employeeId,
              title: 'Login Time Updated',
              message: `Required login time has been updated to ${value} by Super Admin. This applies to all employees effective immediately.`,
              type: 'info',
              isRead: false
            });
          }
        }
        
        if (notifications.length > 0) {
          await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notifications })
          });
        }
      } catch (err) {
        console.error('Failed to send notifications:', err);
      }
    }
    
    return NextResponse.json({ message: "Setting updated", setting });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const GET = requireAuth(handleGET);
export const PUT = requireAuth(handlePUT);
