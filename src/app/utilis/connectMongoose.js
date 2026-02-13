import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connection.setMaxListeners(20);

async function connectMongoose() {
    try {
        if (!MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in environment variables");
        }
        if (mongoose.connection.readyState === 1) {
            return;
        }
        if (mongoose.connection.readyState === 2) {
            await new Promise((resolve) => mongoose.connection.once('connected', resolve));
            return;
        }
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 2,
        });
        console.log("MongoDB is Connected");
    }
    catch (err){
        console.error("MongoDB connection error:", err);  
        throw err;
    }
}

export default connectMongoose;