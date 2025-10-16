import connectMongoose from "../../../utilis/connectMongoose";
import User from "../../../../models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateTokens } from "../../../utilis/authMiddleware";

export async function POST(req) {
  try {
    await connectMongoose();

    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Check for super admin credentials from environment
    if (email === process.env.SUPER_ADMIN_EMAIL && password === process.env.SUPER_ADMIN_PASSWORD) {
      const payload = {
        userId: "super-admin",
        email: process.env.SUPER_ADMIN_EMAIL,
        role: "super-admin",
        employeeId: "ADMIN001"
      };
      
      const { accessToken, refreshToken } = generateTokens(payload);
      
      return NextResponse.json({
        message: "Super Admin login successful",
        token: accessToken,
        refreshToken,
        user: {
          employeeId: "ADMIN001",
          name: "Super Admin",
          email: process.env.SUPER_ADMIN_EMAIL,
          role: "super-admin"
        }
      });
    }

    // Regular user authentication
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 400 });
    }

    // Get employee details from department collections
    let employeeData = {
      role: "Employee",
      name: user.name,
      department: null
    };
    
    try {
      const mongoose = await import('mongoose');
      const db = mongoose.default.connection.db;
      const collections = await db.listCollections().toArray();
      const departmentCollections = collections
        .map(col => col.name)
        .filter(name => name.endsWith('_department'));
      
      console.log(`Searching for employee ${user.employeeId} in collections:`, departmentCollections);
      
      for (const collName of departmentCollections) {
        try {
          const employee = await db.collection(collName).findOne({ employeeId: user.employeeId });
          if (employee) {
            console.log(`Found employee in ${collName}:`, { employeeId: employee.employeeId, role: employee.role, department: employee.department });
            employeeData = {
              role: employee.role || "Employee",
              name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || user.name,
              department: employee.department || collName.replace('_department', '')
            };
            break;
          }
        } catch (collErr) {
          console.error(`Error searching in ${collName}:`, collErr.message);
          continue;
        }
      }
      console.log(`Final employee data for ${user.employeeId}:`, employeeData);
    } catch (err) {
      console.error('Error fetching employee details:', err);
    }

    const payload = {
      userId: user._id,
      email: user.email,
      role: employeeData.role,
      employeeId: user.employeeId
    };
    
    const { accessToken, refreshToken } = generateTokens(payload);

    return NextResponse.json({
      message: "Login successful",
      token: accessToken,
      refreshToken,
      user: {
        employeeId: user.employeeId,
        name: employeeData.name,
        email: user.email,
        role: employeeData.role,
        department: employeeData.department
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
