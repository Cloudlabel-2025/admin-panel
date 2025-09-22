import mongoose from "mongoose";

// Helper: Convert "HH:mm" string to decimal hours
function timeToHours(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h + m / 60;
}

// Calculate total working hours
function calculatedTotalHours(logIn, logOut, lunchOut, lunchIn, permission) {
  if (!logIn || !logOut) return 0; // must have logIn and logOut

  const [logInH, logInM] = logIn.split(":").map(Number);
  const [logOutH, logOutM] = logOut.split(":").map(Number);

  const logInDate = new Date(0, 0, 0, logInH, logInM);
  const logOutDate = new Date(0, 0, 0, logOutH, logOutM);

  let workDuration = (logOutDate - logInDate) / (1000 * 60 * 60); // base working hours

  // subtract lunch break if both times exist
  if (lunchOut && lunchIn) {
    const [lunchOutH, lunchOutM] = lunchOut.split(":").map(Number);
    const [lunchInH, lunchInM] = lunchIn.split(":").map(Number);
    const lunchOutDate = new Date(0, 0, 0, lunchOutH, lunchOutM);
    const lunchInDate = new Date(0, 0, 0, lunchInH, lunchInM);
    const lunchDuration = (lunchInDate - lunchOutDate) / (1000 * 60 * 60);
    workDuration -= lunchDuration;
  }

  // subtract manual permission hours
  const permissionDuration = timeToHours(permission);
  workDuration -= permissionDuration;

  return workDuration;
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
  },
  reason: {
    type: String,
    default: "",
  },
  totalHours: {
    type: Number,
    default: 0,
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
    this.lunchIn,
    this.permission
  );
  next();
});

// Middleware to recalc hours on update
TimecardSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.logIn && update.logOut) {
    update.totalHours = calculatedTotalHours(
      update.logIn,
      update.logOut,
      update.lunchOut,
      update.lunchIn,
      update.permission || "00:00"
    );
    this.setUpdate(update);
  }
  next();
});

export default mongoose.models.Timecard ||
  mongoose.model("Timecard", TimecardSchema);
