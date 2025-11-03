import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

async function connectMongoose() {
    try {
        if (!MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in environment variables");
        }
        if (mongoose.connection.readyState === 1) {
            return;
        }
        await mongoose.connect(MONGODB_URI);
        console.log("MongoDB is Connected");
    }
    catch (err){
        console.error("MongoDB connection error:", err);  
        throw err;
    }
}

export default connectMongoose;