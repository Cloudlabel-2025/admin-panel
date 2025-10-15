import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  type: { type: String, required: true }, // 'payroll', 'absence', 'general'
  title: { type: String, required: true },
  message: { type: String, required: true },
  payrollDetails: {
    payPeriod: String,
    netPay: Number,
    status: String
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);