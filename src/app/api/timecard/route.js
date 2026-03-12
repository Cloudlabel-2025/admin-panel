import connectMongoose from '@/app/utilis/connectMongoose';
import Timecard from '@/models/Timecard';
import { createEmployeeModel } from '@/models/Employee';
import { NextResponse } from 'next/server';
import { requireAuth } from '../../utilis/authMiddleware';
import mongoose from 'mongoose';
import { calculateAttendanceStatus } from '@/app/utilis/employeeUtils';
import Attendance from '@/models/Attendance';
import { DEPARTMENTS } from '@/app/utilis/constants';
import { getEmployeeNameAndDept } from '@/app/utilis/employeeDataUtils';
import { handleLogin, handlePermissionUpdate, handleBreakUpdate, handleLunchUpdate, handleLogout } from '@/app/services/timecardService';

async function handlePOST(req) {
  try {
    await connectMongoose();
    const data = await req.json();

    if (!data.date) data.date = new Date();

    // Handle login
    if (data.logIn) {
      const result = await handleLogin(data.employeeId, data.date, data.logIn, data.userRole);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error, timecard: result.timecard, blocked: result.blocked },
          { status: result.status || 400 }
        );
      }
      return NextResponse.json({ message: result.message, timecard: result.timecard }, { status: 201 });
    }

    // Handle permission before login
    if (data.permissionMinutes && !data.logIn) {
      console.log('Creating timecard with permission before login:', data.permissionMinutes, 'minutes');
      const timecard = await Timecard.create({
        ...data,
        permissionLocked: data.permissionLocked || false
      });
      return NextResponse.json({ message: 'Permission recorded before login', timecard }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export const POST = requireAuth(handlePOST);

async function handleGET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const currentUser = req.user;

    const employeeId = searchParams.get('employeeId');
    const isAdmin = searchParams.get('admin') === 'true';
    const dateParam = searchParams.get('date');

    const userRole = currentUser.role;
    const userDepartment = currentUser.department;

    let query = {};
    if (employeeId && !isAdmin) query.employeeId = employeeId;

    if (isAdmin && dateParam) {
      const start = new Date(dateParam + 'T00:00:00.000Z');
      const end = new Date(dateParam + 'T23:59:59.999Z');
      query.date = { $gte: start, $lte: end };

      // Role-based filtering for monitoring
      if (userRole === 'Team-Lead' || userRole === 'Team-admin') {
        try {
          const collections = Object.keys(mongoose.connection.collections).filter(name =>
            name.endsWith('_department')
          );

          let departmentEmployeeIds = [];
          for (const collName of collections) {
            const collection = mongoose.connection.collections[collName];

            const empFilter = { department: userDepartment };
            if (userRole === 'Team-admin') {
              empFilter.role = { $ne: 'Team-Lead' };
            }

            const employees = await collection.find(empFilter).toArray();
            departmentEmployeeIds.push(...employees.map(emp => emp.employeeId));
          }

          if (departmentEmployeeIds.length > 0) {
            query.employeeId = { $in: departmentEmployeeIds };
          } else {
            query.employeeId = 'NONE';
          }
        } catch (err) {
          console.error('Error filtering by department:', err);
        }
      } else if (searchParams.get('department')) {
        const targetDept = searchParams.get('department');
        try {
          const collections = Object.keys(mongoose.connection.collections).filter(name =>
            name.endsWith('_department')
          );
          let deptEmpIds = [];
          for (const collName of collections) {
            const collection = mongoose.connection.collections[collName];
            const employees = await collection.find({ department: targetDept }).toArray();
            deptEmpIds.push(...employees.map(emp => emp.employeeId));
          }
          if (deptEmpIds.length > 0) query.employeeId = { $in: deptEmpIds };
        } catch (err) {
          console.error('Error filtering by department:', err);
        }
      }
    } else if (employeeId && !isAdmin) {
      const today = new Date().toISOString().split('T')[0];
      const start = new Date(today + 'T00:00:00.000Z');
      const end = new Date(today + 'T23:59:59.999Z');
      query.date = { $gte: start, $lte: end };
    }

    const timecards = await Timecard.find(query).sort({ date: -1 }).limit(isAdmin ? 100 : 1);

    const timecardsWithNames = await Promise.all(
      timecards.map(async (timecard) => {
        try {
          const { name: employeeName } = await getEmployeeNameAndDept(timecard.employeeId);
          return {
            ...timecard.toObject(),
            employeeName
          };
        } catch (err) {
          return {
            ...timecard.toObject(),
            employeeName: 'Unknown'
          };
        }
      })
    );

    return NextResponse.json(timecardsWithNames, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export const GET = requireAuth(handleGET);

async function handlePUT(req) {
  try {
    await connectMongoose();
    const body = await req.json();
    const { _id, ...updates } = body;

    console.log('Backend: Received PUT request with updates:', JSON.stringify(updates));

    if (!_id) {
      return NextResponse.json({ error: 'Timecard ID required' }, { status: 400 });
    }

    const timecard = await Timecard.findById(_id);
    if (!timecard) {
      return NextResponse.json({ error: 'Timecard not found' }, { status: 404 });
    }

    // Handle lunch updates
    if (updates.lunchOut || updates.lunchIn) {
      const result = await handleLunchUpdate(_id, updates.lunchOut, updates.lunchIn);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: result.status || 400 });
      }
    }

    // Handle break updates
    if (updates.breaks) {
      const result = await handleBreakUpdate(_id, updates.breaks);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: result.status || 400 });
      }
    }

    // Handle permission updates
    if (updates.permissionMinutes !== undefined) {
      const result = await handlePermissionUpdate(_id, updates.permissionMinutes, updates.permissionReason, updates.permissionLocked);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error, details: result.details },
          { status: result.status || 400 }
        );
      }
    }

    // Handle logout
    if (updates.logOut) {
      const result = await handleLogout(_id, updates.logOut, updates.autoLogoutReason, updates.manualLogoutReason);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: result.status || 500 });
      }
    }

    // Fetch updated timecard
    const updatedTimecard = await Timecard.findById(_id);
    return NextResponse.json({ timecard: updatedTimecard.toObject(), message: 'Updated successfully' });
  } catch (err) {
    console.error('PUT error:', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export const PUT = requireAuth(handlePUT);
