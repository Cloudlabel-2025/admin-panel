import mongoose from "mongoose";

// function to convert hours

function timeToHours(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h + m / 60;
}

//function to calculate total hours

function calculatedTotalHours(logIn, logOut, lunchOut, lunchIn, permission) {
  if (!logIn || !logOut || !lunchOut || !lunchIn || !permission) return 0;
  const [logInH, logInM] = logIn.split(":").map(Number);
  const [logOutH, logOutM] = logOut.split(":").map(Number);
  const [lunchOutH, lunchOutM] = lunchOut.split(":").map(Number);
  const [lunchInH, lunchInM] = lunchIn.split(":").map(Number);

  const logInDate = new Date(0, 0, 0, logInH, logInM);
  const logOutDate = new Date(0, 0, 0, logOutH, logOutM);
  const lunchOutDate = new Date(0, 0, 0, lunchOutH, lunchOutM);
  const lunchInDate = new Date(0, 0, 0, lunchInH, lunchInM);

  const workDuration = (logOutDate - logInDate) / (1000 * 60 * 60); // total working hours
  const lunchDuration = (lunchInDate - lunchOutDate) / (1000 * 60 * 60); // lunch hours
  const permissionDuration = timeToHours(permission); //permission hours

  return workDuration - lunchDuration - permissionDuration;
}

const TimecardSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: [true, "employeeId is required"],
  },
  date: {
    type: Date,
    required: [true, "Date is required"],
  },
  logIn: {
    type: String,
    required: [true, "Log-In Time is required"],
  },
  logOut: {
    type: String,
    required: [true, "Log-Out Time is required"],
  },
  lunchOut: {
    type: String,
    required: [true, "Lunch-Out Time is required"],
  },
  lunchIn: {
    type: String,
    required: [true, "Lunch-In Time is required"],
  },
  permission: {
    type: String,
    default: "00:00",
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

//middleware to calculate hours

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

// recalc on update
TimecardSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.logIn && update.logOut && update.lunchOut && update.lunchIn) {
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
