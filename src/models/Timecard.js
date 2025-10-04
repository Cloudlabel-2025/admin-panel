import mongoose from "mongoose";

// Helper: Convert "HH:mm" string to decimal hours
function timeToHours(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h + m / 60;
}

// Calculate total working hours (actual hours worked)
function calculatedTotalHours(logIn, logOut, lunchOut, lunchIn) {
  if (!logIn || !logOut) return "00:00";

  const [logInH, logInM] = logIn.split(":").map(Number);
  const [logOutH, logOutM] = logOut.split(":").map(Number);

  const logInDate = new Date(0, 0, 0, logInH, logInM);
  const logOutDate = new Date(0, 0, 0, logOutH, logOutM);

  let workDuration = (logOutDate - logInDate) / (1000 * 60 * 60);

  // subtract lunch break if both times exist
  if (lunchOut && lunchIn) {
    const [lunchOutH, lunchOutM] = lunchOut.split(":").map(Number);
    const [lunchInH, lunchInM] = lunchIn.split(":").map(Number);
    const lunchOutDate = new Date(0, 0, 0, lunchOutH, lunchOutM);
    const lunchInDate = new Date(0, 0, 0, lunchInH, lunchInM);
    const lunchDuration = (lunchInDate - lunchOutDate) / (1000 * 60 * 60);
    workDuration -= lunchDuration;
  }

  workDuration = Math.max(0, workDuration);
  const hours = Math.floor(workDuration);
  const minutes = Math.round((workDuration - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

const TimecardSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: [true, "Employee ID is required"],
  },
  date: {
    type: Date,
    default: Date.now, // system date
  },
  logIn: {
    type: String,
    default: "", // auto-filled when login button clicked
  },
  logOut: {
    type: String,
    default: "", // auto-filled when logout button clicked
  },
  lunchOut: {
    type: String,
    default: "", // auto-filled when lunch checkbox checked
  },
  lunchIn: {
    type: String,
    default: "", // auto-filled when lunch checkbox unchecked
  },
  permission: {
    type: String,
    default: "00:00", // manually entered
    validate: {
      validator: function(v) {
        if (!v || v === "00:00") return true;
        const [h, m] = v.split(":").map(Number);
        const hours = h + m / 60;
        return hours <= 2;
      },
      message: "Permission cannot exceed 2 hours"
    }
  },
  reason: {
    type: String,
    default: "",
  },
  totalHours: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to calculate hours on save
TimecardSchema.pre("save", function (next) {
  this.totalHours = calculatedTotalHours(
    this.logIn,
    this.logOut,
    this.lunchOut,
    this.lunchIn
  );
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
      
      // Always calculate total hours when any time field is updated
      update.totalHours = calculatedTotalHours(logIn, logOut, lunchOut, lunchIn);
      this.setUpdate(update);
    }
  } catch (error) {
    console.error('Error in timecard middleware:', error);
  }
  
  next();
});

export default mongoose.models.Timecard ||
  mongoose.model("Timecard", TimecardSchema);
