import connectMongoose from "@/app/utilis/connectMongoose";
import Timecard from "@/models/Timecard";
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

const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const calculateMetrics = async (timecards) => {
  const requiredLoginTimeSetting = await Settings.findOne({ key: 'REQUIRED_LOGIN_TIME' });
  const requiredLoginTime = requiredLoginTimeSetting?.value || "10:00";
  const requiredLoginMinutes = timeToMinutes(requiredLoginTime);
  
  let totalWorkingHours = 0;
  let breakOveruseCount = 0;
  let lateLoginCount = 0;
  let earlyLogoutCount = 0;
  let idleGaps = [];

  for (const tc of timecards) {
    if (!tc.logIn || !tc.logOut) continue;

    let workMinutes = timeToMinutes(tc.logOut) - timeToMinutes(tc.logIn);
    if (tc.lunchOut && tc.lunchIn) {
      workMinutes -= (timeToMinutes(tc.lunchIn) - timeToMinutes(tc.lunchOut));
    }
    totalWorkingHours += workMinutes / 60;

    if (tc.breaks?.length) {
      for (const b of tc.breaks) {
        if (b.breakIn && b.breakOut) {
          const breakDuration = timeToMinutes(b.breakIn) - timeToMinutes(b.breakOut);
          if (breakDuration > 30) {
            breakOveruseCount++;
          }
        }
      }
    }

    if (timeToMinutes(tc.logIn) > requiredLoginMinutes) {
      lateLoginCount++;
    }

    const totalTime = timeToMinutes(tc.logOut) - timeToMinutes(tc.logIn);
    if (totalTime < 630) {
      earlyLogoutCount++;
    }

    const events = [];
    events.push({ time: tc.logIn, type: 'login' });
    if (tc.lunchOut) events.push({ time: tc.lunchOut, type: 'lunchOut' });
    if (tc.lunchIn) events.push({ time: tc.lunchIn, type: 'lunchIn' });
    tc.breaks?.forEach(b => {
      if (b.breakOut) events.push({ time: b.breakOut, type: 'breakOut' });
      if (b.breakIn) events.push({ time: b.breakIn, type: 'breakIn' });
    });
    events.push({ time: tc.logOut, type: 'logout' });

    events.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

    let lastActiveTime = null;
    for (const event of events) {
      if (event.type === 'login' || event.type === 'lunchIn' || event.type === 'breakIn') {
        lastActiveTime = event.time;
      } else if (event.type === 'lunchOut' || event.type === 'breakOut' || event.type === 'logout') {
        if (lastActiveTime) {
          const gap = timeToMinutes(event.time) - timeToMinutes(lastActiveTime);
          if (gap > 0) {
            idleGaps.push({ date: tc.date, gap: gap, from: lastActiveTime, to: event.time });
          }
        }
        lastActiveTime = null;
      }
    }
  }

  return {
    totalWorkingHours: parseFloat(totalWorkingHours.toFixed(2)),
    breakOveruseCount,
    lateLoginCount,
    earlyLogoutCount,
    idleGaps: idleGaps.length,
    idleGapDetails: idleGaps
  };
};

async function handleGET(req) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const userRole = searchParams.get("userRole");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID required" }, { status: 400 });
    }

    let query = { employeeId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const timecards = await Timecard.find(query).sort({ date: -1 });
    const metrics = await calculateMetrics(timecards);

    const roleLower = userRole?.toLowerCase();
    if (roleLower === 'employee' || roleLower === 'intern') {
      return NextResponse.json({
        totalWorkingHours: metrics.totalWorkingHours,
        lateLoginCount: metrics.lateLoginCount,
        breakOveruseCount: metrics.breakOveruseCount
      });
    }

    return NextResponse.json(metrics);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const GET = requireAuth(handleGET);
