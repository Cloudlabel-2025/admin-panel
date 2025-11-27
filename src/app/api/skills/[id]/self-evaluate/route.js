import { NextResponse } from "next/server";

import connectMongoose from "@/app/utilis/connectMongoose";
import Skill from "@/models/Skill";

export async function POST(req, { params }) {
  try {
    await connectMongoose();
    const { rating, comments } = await req.json();
    const { id } = params;

    const skill = await Skill.findByIdAndUpdate(
      id,
      {
        selfEvaluation: {
          rating,
          comments,
          lastUpdated: new Date(),
        },
      },
      { new: true }
    ).populate('employeeId', 'name employeeId').populate('createdBy', 'employeeId');

    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    // Send notification to the person who created the skill
    if (skill.createdBy) {
      try {
        const Notification = (await import('../../../../../models/Notification')).default;
        await Notification.create({
          employeeId: skill.createdBy.employeeId,
          title: "Self Evaluation Completed",
          message: `${skill.employeeId?.name || 'An employee'} has completed a self-evaluation for "${skill.skillName}" with a ${rating}-star rating.`,
          type: "info",
          isRead: false,
          createdAt: new Date()
        });
      } catch (notifErr) {
        console.error('Error creating notification:', notifErr);
      }
    }

    return NextResponse.json({ message: "Self evaluation saved successfully", skill });
  } catch (error) {
    console.error("Error saving self evaluation:", error);
    return NextResponse.json({ error: "Failed to save self evaluation" }, { status: 500 });
  }
}
