import connectMongoose from "@/app/utilis/connectMongoose";
import Timecard from "@/models/Timecard";
import { NextResponse } from "next/server";
import { requireAuth } from "../../utilis/authMiddleware";

export const POST = requireAuth(async function(req,res){
    try{
    await connectMongoose();
    const data = await req.json();
     if (!data.date) {
      data.date = new Date();
    }
    const timecard = await Timecard.create(data);
    return NextResponse.json({ message: "Timecard created", timecard }, { status: 201 });
    }
    catch(err){
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
});

export const GET = requireAuth(async function(req,res) {
    try{
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const isAdmin = searchParams.get("admin");
    const dateParam = searchParams.get("date");
    const department = searchParams.get("department");
    
    let query = {};
    if (employeeId && !isAdmin) {
      query.employeeId = employeeId;
    }
    
    // Filter by date for admin monitoring
    if (isAdmin && dateParam) {
      const start = new Date(dateParam);
      const end = new Date(dateParam);
      end.setHours(23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }
    
    // Filter by department for team roles
    if (isAdmin && department) {
      try {
        const employeeRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/Employee/search?department=${department}`);
        if (employeeRes.ok) {
          const employeeData = await employeeRes.json();
          const employeeIds = employeeData.employees.map(emp => emp.employeeId);
          query.employeeId = { $in: employeeIds };
        }
      } catch (err) {
        console.error('Error filtering by department:', err);
      }
    }
    
    const timecards = await Timecard.find(query).sort({date:-1});
    
    // Add employee names to timecards
    const timecardsWithNames = await Promise.all(
      timecards.map(async (timecard) => {
        try {
          const employeeRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/Employee/${timecard.employeeId}`);
          if (employeeRes.ok) {
            const employeeData = await employeeRes.json();
            return {
              ...timecard.toObject(),
              employeeName: `${employeeData.firstName || ''} ${employeeData.lastName || ''}`.trim() || 'Unknown'
            };
          }
        } catch (err) {
          console.error(`Error fetching employee ${timecard.employeeId}:`, err);
        }
        return {
          ...timecard.toObject(),
          employeeName: 'Unknown'
        };
      })
    );
    
    return NextResponse.json(timecardsWithNames, {status:200});
    }
    catch(err){
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
});

export const PUT = requireAuth(async function(req){
  try {
    await connectMongoose();
    const body = await req.json();
    const { _id, action, ...updates } = body;

    // Fix all records action
    if (action === 'fix_all') {
      const timecards = await Timecard.find({});
      let fixed = 0;
      
      for (const timecard of timecards) {
        const oldTotal = timecard.totalHours;
        await timecard.recalculateTotalHours();
        if (oldTotal !== timecard.totalHours) {
          fixed++;
        }
      }
      
      return NextResponse.json({ 
        message: `Fixed ${fixed} timecard records`,
        total: timecards.length 
      });
    }

    const timecard = await Timecard.findByIdAndUpdate(_id, updates, { new: true });

    if (!timecard) {
      return NextResponse.json({ error: "Timecard not found" }, { status: 404 });
    }

    // If logout time is being set, complete daily tasks and update attendance
    if (updates.logOut && timecard.employeeId) {
      try {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/daily-task`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'complete_on_logout',
            employeeId: timecard.employeeId,
            logoutTime: updates.logOut
          })
        });
        
        // Update attendance status after logout
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: timecard.employeeId
          })
        });
      } catch (err) {
        console.error('Failed to complete daily tasks on logout:', err);
      }
    }

    return NextResponse.json({ timecard });
  } catch (err) {
    console.error("PUT error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
});
