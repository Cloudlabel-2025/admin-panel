import connectMongoose from "../../utilis/connectMongoose";


import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  title: String,
  message: String,
  recipient: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const AccountSchema = new mongoose.Schema({
  name: String,
  type: String,
  balance: { type: Number, default: 0 },
  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const TransactionSchema = new mongoose.Schema({
  fromAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  toAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  type: String,
  amount: Number,
  description: String,
  date: { type: Date, default: Date.now },
  source: String
});

const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
const Account = mongoose.models.Account || mongoose.model("Account", AccountSchema);
const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);

export async function POST(request) {
  try {
    await connectMongoose();
    const { amount, description } = await request.json();
    
    // Find or create Admin Cash account
    let adminAccount = await Account.findOne({ name: "Admin Cash" });
    if (!adminAccount) {
      adminAccount = await Account.create({
        name: "Admin Cash",
        type: "Asset",
        balance: 0,
        description: "Admin Cash Account for Office Expenses"
      });
    }
    
    // Find or create Petty Cash account
    let pettyCashAccount = await Account.findOne({ name: "Petty Cash" });
    if (!pettyCashAccount) {
      pettyCashAccount = await Account.create({
        name: "Petty Cash",
        type: "Asset",
        balance: 0,
        description: "Petty Cash Account"
      });
    }
    
    // Update both account balances
    await Account.findByIdAndUpdate(adminAccount._id, {
      $inc: { balance: parseFloat(amount) },
      updatedAt: new Date()
    });
    
    await Account.findByIdAndUpdate(pettyCashAccount._id, {
      $inc: { balance: parseFloat(amount) },
      updatedAt: new Date()
    });
    
    // Create transaction record
    await Transaction.create({
      toAccount: adminAccount._id,
      type: 'Credit',
      amount: parseFloat(amount),
      description: `Fund transfer from Super Admin: ${description || 'Office expenses'}`,
      source: 'fund-transfer'
    });
    
    // Create notification for admin
    const notification = new Notification({
      title: "💰 Fund Transfer Received",
      message: `₹${amount} has been transferred to your account. ${description || ''}`,
      recipient: "admin"
    });
    
    await notification.save();
    
    return Response.json({ message: "Fund transfer completed successfully" });
  } catch (error) {
    return Response.json({ error: "Failed to process fund transfer" }, { status: 500 });
  }
}
