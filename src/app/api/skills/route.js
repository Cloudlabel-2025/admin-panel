import connectMongoose from "@/app/utilis/connectMongoose";
import Skill from "@/models/Skill";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function POST(req) {
    try{
        await connectMongoose();
        const body = await req.json();
        const createdByUserId = req.headers.get('x-user-id');
        const skillData = { ...body };
        if (createdByUserId && mongoose.Types.ObjectId.isValid(createdByUserId)) {
            skillData.createdBy = createdByUserId;
        }
        const skill = await Skill.create(skillData);
        
        // Create notification for the employee
        try {
          const User = (await import('../../../models/User')).default;
          const user = await User.findById(body.employeeId).select('employeeId');
          if (user && user.employeeId) {
            const Notification = (await import('../../../models/Notification')).default;
            await Notification.create({
              employeeId: user.employeeId,
              title: "New Skill Added",
              message: `A new skill "${body.skillName}" has been added to your profile with ${body.proficiencyLevels?.[0] || 'Beginner'} proficiency level.`,
              type: "info",
              isRead: false,
              createdAt: new Date()
            });
          }
        } catch (notifErr) {
          console.error('Error creating notification:', notifErr);
        }
        
        return NextResponse.json(skill,{status:201});
    }
    catch(err){
        console.error('Error in POST /api/skills:', err);
        return NextResponse.json({error:err.message},{status:500});
    }
}

export async function GET() {
    try{
      await connectMongoose();
      let skills = await Skill.find().sort({createdAt:-1}).lean();
      
      // Manually populate employeeId
      const User = (await import('../../../models/User')).default;
      for (let skill of skills) {
        if (skill.employeeId) {
          try {
            const user = await User.findById(skill.employeeId).select('name employeeId email').lean();
            skill.employeeId = user;
          } catch (e) {
            console.error('Error populating user:', e);
          }
        }
      }
      
      return NextResponse.json(skills,{status:200});
    }
    catch(err){
      console.error('Error in GET /api/skills:', err);
      return NextResponse.json({error:err.message},{status:500});
    }
}