import connectMongoose from "@/app/utilis/connectMongoose";

export const dynamic = "force-dynamic";
import Performance from "@/models/Performance";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        await connectMongoose();
        
        // Get all performance records without employeeName
        const performanceRecords = await Performance.find({ employeeName: { $exists: false } });
        
        console.log(`Found ${performanceRecords.length} records to update`);
        
        const collections = Object.keys(mongoose.connection.collections);
        const departmentCollections = collections.filter(name => name.endsWith('_department'));
        
        let updated = 0;
        
        for (const perf of performanceRecords) {
            if (perf.employeeId) {
                // Search all department collections for the employee
                for (const collectionName of departmentCollections) {
                    const collection = mongoose.connection.collections[collectionName];
                    const employee = await collection.findOne({ _id: new mongoose.Types.ObjectId(perf.employeeId) });
                    if (employee) {
                        const employeeName = employee.name || `${employee.firstName} ${employee.lastName}`.trim();
                        await Performance.findByIdAndUpdate(perf._id, { employeeName });
                        updated++;
                        console.log(`Updated ${perf._id} with name: ${employeeName}`);
                        break;
                    }
                }
            }
        }
        
        return NextResponse.json({ 
            message: `Migration completed. Updated ${updated} records.`,
            updated 
        }, { status: 200 });
        
    } catch (err) {
        console.error('Migration error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}