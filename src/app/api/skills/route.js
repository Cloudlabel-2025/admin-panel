import connectMongoose from "@/app/utilis/connectMongoose";
import Skill from "@/models/Skill";
import { NextResponse } from "next/server";

export async function POST(req) {
    try{
        await connectMongoose();
        const body = await req.json();
        const skill = await Skill.create(body);
        
        // Create notification for the employee
        try {
          const Notification = (await import('../../../models/Notification')).default;
          await Notification.create({
            employeeId: body.employeeId,
            title: "New Skill Added",
            message: `A new skill "${body.skillName}" has been added to your profile with ${body.proficiencyLevels?.[0] || 'Beginner'} proficiency level.`,
            type: "skill",
            status: "unread",
            createdAt: new Date()
          });
        } catch (notifErr) {
          console.error('Error creating notification:', notifErr);
        }
        
        return NextResponse.json(skill,{status:201});
    }
    catch(err){
    return NextResponse.json({error:err.message},{status:500});
    }
}

export async function GET() {
    try{
      await connectMongoose();
      const skills = await Skill.find()
      .populate("employeeId","name")
      .sort({createdAt:-1});
      return NextResponse.json(skills,{status:200});
    }
    catch(err){
    return NextResponse.json({error:err.message},{status:500});
    }
}