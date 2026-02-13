import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
 
    employeeId:{ type: String},
    department:{ type: String},
    name:{type: String},
    module:{ type: String},
    client:{ type: String},
    topic: { type: String},
    taskName: {type: String},
    startDate:{ type: Date },
    expectedendDate:{ type: Date},
    actualendDate:{type: Date},
    assignedBy:{type: String},
    reviewedBy:{type: String},
    status:{ type: String,
        enum:["Yet to start","In progress","In-review","completed","On hold","Re-work1","Re-work2","Re-work3"],
        default:"Yet to start"
    },
    remarks:{ type: String},
},
{timestamps: true});

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);










