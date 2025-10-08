import mongoose from "mongoose";

const AccountSchema = new mongoose.Schema({
name:{type:String,required:true},
type:{type:String,enum:["Asset","Liability","Equity","Income","Expense"],required:true},
description:{type:String},
balance:{type:Number,default:0},
},
{timestamps:true},
);
export default mongoose.models.Account || mongoose.model("Account", AccountSchema);
