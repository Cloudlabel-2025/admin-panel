import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema({
 name:{type:String,required:true},
 email:String,
 phone:String,
 address:String,
},
{timestamps:true},
);

export default mongoose.models.Customer || mongoose.model("Customer",CustomerSchema);