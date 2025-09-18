import connectMongoose from "@/app/utilis/connectMongoose";
import Employee from "@/app/models/Employee";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    try {
        await connectMongoose();
        const employee = await Employee.findById(params.employeeId);
        return NextResponse.json(employee, { status: 200 })
    }
    catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        await connectMongoose();
        const body = await req.json();
        const updatedEmployee = await Employee.findByIdAndUpdate(
            params.employeeId,
            body,
            {new:true}
        );
        return NextResponse.json(updatedEmployee, { status: 200 })
    }
    catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        await connectMongoose();
        const deletedEmployee = await Employee.findByIdAndDelete(params.employeeId);
        return NextResponse.json({ message:"employee is Deleted Successfully"} ,{ status: 200 })
    }
    catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}