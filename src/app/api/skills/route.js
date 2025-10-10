import connectMongoose from "@/app/utilis/connectMongoose";
import Skill from "@/models/Skill";
import { NextResponse } from "next/server";

await connectMongoose();

export async function POST(req) {
    try{
        const body = req.json();
        const skill = await Skill.create(body);
        return NextResponse.json(skill,{status:201});
    }
    catch(err){
    return NextResponse.json({error:err.message},{status:500});
    }
}

export async function GET() {
    try{
      const skills = await Skill.find()
      .populate("employeeId name")
      .sort({createdAt:-1});
      return NextResponse.json(skills,{status:200});
    }
    catch(err){
    return NextResponse.json({error:err.message},{status:500});
    }
}