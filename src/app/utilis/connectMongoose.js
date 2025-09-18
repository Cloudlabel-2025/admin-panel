import mongoose from "mongoose";

const MONGODB_URI = "mongodb+srv://cloudlabel_db_user:cloudlabel%402025@admin-panel.ziw1mkn.mongodb.net/admin-panel"

async function connectMongoose() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("MongoDB is Connected");
    }
    catch (err){
    console.error("MongoDB connection is error",err);  
    throw err;
    }
}

export default connectMongoose;