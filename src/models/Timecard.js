import mongoose from "mongoose";

// Helper: Convert "HH:mm" string to decimal hours
function timeToHours(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h + m / 60;
}

// Calculate total working hours (actual hours worked)
function calculatedTotalHours(logIn, logOut, lunchOut, lunchIn, permission) {
  try {
    if (!logIn || !logOut || logIn === "" || logOut === "") return "00:00";

    const [liH, liM] = logIn.split(":").map(Number);
    const [loH, loM] = logOut.split(":").map(Number);
    
    if (isNaN(liH) || isNaN(liM) || isNaN(loH) || isNaN(loM)) return "00:00";
    
    let start = liH * 60 + liM;
    let end = loH * 60 + loM;
    if (end < start) end += 24 * 60;

    let worked = end - start;

    // subtract lunch break if both times exist and are different
    if (lunchOut && lunchIn && lunchOut !== "" && lunchIn !== "" && lunchOut !== lunchIn) {
      const [lo1, lo2] = lunchOut.split(":").map(Number);
      const [li1, li2] = lunchIn.split(":").map(Number);
      if (!isNaN(lo1) && !isNaN(lo2) && !isNaN(li1) && !isNaN(li2)) {
        const lunchDuration = li1 * 60 + li2 - (lo1 * 60 + lo2);
        if (lunchDuration > 0) {
          worked -= lunchDuration;
        }
      }
    }

    // subtract permission time
    if (permission && permission > 0) {
      const permissionMinutes = Number(permission) * 60;
      worked -= permissionMinutes;
    }

    if (worked < 0) worked = 0;

    const hh = Math.floor(worked / 60);
    const mm = worked % 60;
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error calculating total hours:', error);
    return "00:00";
  }
}

const TimecardSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: [true, "Employee ID is required"],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  logIn: {
    type: String,
    default: "",
  },
  logOut: {
    type: String,
    default: "",
  },
  lunchOut: {
    type: String,
    default: "",
  },
  lunchIn: {
    type: String,
    default: "",
  },
  permission: {
    type: Number,
    default: 0,
  },
  permissionMinutes: {
    type: Number,
    default: 0,
  },
  permissionReason: {
    type: String,
    default: "",
  },
  permissionLocked: {
    type: Boolean,
    default: false,
  },
  reason: {
    type: String,
    default: "",
  },
  breaks: [{
    breakOut: { type: String, default: "" },
    breakIn: { type: String, default: "" },
    reason: { type: String, default: "" }
  }],
  lateLogin: {
    type: Boolean,
    default: false
  },
  lateLoginMinutes: {
    type: Number,
    default: 0
  },
  attendanceStatus: {
    type: String,
    enum: ['Present', 'Half Day', 'Leave', 'Absent'],
    default: 'Present'
  },
  statusReason: {
    type: String,
    default: ''
  },
  workMinutes: {
    type: Number,
    default: 0
  },
  userRole: {
    type: String,
    default: ''
  },
  autoLogoutReason: {
    type: String,
    default: '',
  },
  manualLogoutReason: {
    type: String,
    default: '',
  },
  totalHours: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, { strict: false });

// Middleware to calculate hours on save
TimecardSchema.pre("save", function (next) {
  try {
    this.updatedAt = new Date();
    if (this.logOut) {
      this.totalHours = calculatedTotalHours(
        this.logIn,
        this.logOut,
        this.lunchOut,
        this.lunchIn,
        this.permission
      );
    }
  } catch (error) {
    console.error('Error in save middleware:', error);
  }
  next();
});

// Middleware to recalc hours on update
TimecardSchema.pre(["findOneAndUpdate", "updateOne"], async function (next) {
  try {
    const update = this.getUpdate();
    
    // Get the current document to merge with updates
    const docToUpdate = await this.model.findOne(this.getQuery());
    
    if (docToUpdate) {
      // Merge current values with updates
      const logIn = update.logIn !== undefined ? update.logIn : docToUpdate.logIn;
      const logOut = update.logOut !== undefined ? update.logOut : docToUpdate.logOut;
      const lunchOut = update.lunchOut !== undefined ? update.lunchOut : docToUpdate.lunchOut;
      const lunchIn = update.lunchIn !== undefined ? update.lunchIn : docToUpdate.lunchIn;
      let permission = update.permission !== undefined ? update.permission : docToUpdate.permission;
      
      // Convert permission to number if it's a string
      if (typeof permission === 'string') {
        permission = parseFloat(permission) || 0;
      }
      
      // Always calculate total hours when any time field is updated
      update.totalHours = calculatedTotalHours(logIn, logOut, lunchOut, lunchIn, permission);
      this.setUpdate(update);
    }
  } catch (error) {
    console.error('Error in timecard middleware:', error);
    this.totalHours = "00:00";
  }
  
  next();
});

// Method to recalculate total hours for existing records
TimecardSchema.methods.recalculateTotalHours = function() {
  let permission = this.permission;
  if (typeof permission === 'string') {
    permission = parseFloat(permission) || 0;
  }
  this.totalHours = calculatedTotalHours(
    this.logIn,
    this.logOut, 
    this.lunchOut,
    this.lunchIn,
    permission
  );
  return this.save();
};

// Force delete cached model to ensure schema updates
if (mongoose.models.Timecard) {
  delete mongoose.models.Timecard;
}

const Timecard = mongoose.model("Timecard", TimecardSchema);

export default Timecard;
