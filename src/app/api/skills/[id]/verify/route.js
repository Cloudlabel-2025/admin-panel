import { NextResponse } from "next/server";

import connectMongoose from "@/app/utilis/connectMongoose";
import Skill from "@/models/Skill";

export async function POST(req, { params }) {
  try {
    await connectMongoose();
    const { rating, feedback } = await req.json();
    const { id } = params;
    const verifiedByUserId = req.headers.get('x-user-id');

    const skill = await Skill.findByIdAndUpdate(
      id,
      {
        verifiedEvaluation: {
          rating,
          feedback,
          verifiedBy: verifiedByUserId,
          verifiedAt: new Date(),
        },
        selfEvaluation: null,
      },
      { new: true }
    ).populate('employeeId', 'name employeeId');

    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    // Send notification to employee about verified rating
    if (skill.employeeId) {
      try {
        const Notification = (await import('../../../../../models/Notification')).default;
        const ratingChanged = skill.selfEvaluation?.rating !== rating;
        await Notification.create({
          employeeId: skill.employeeId.employeeId,
          title: "Skill Evaluation Verified",
          message: `Your self-evaluation for "${skill.skillName}" has been verified with a final rating of ${rating}/5 stars.${ratingChanged ? ` (Adjusted from ${skill.selfEvaluation?.rating}/5)` : ''} ${feedback ? `Feedback: ${feedback}` : ''}`,
          type: "success",
          isRead: false,
          createdAt: new Date()
        });
      } catch (notifErr) {
        console.error('Error creating notification:', notifErr);
      }
    }

    return NextResponse.json({ message: "Evaluation verified successfully", skill });
  } catch (error) {
    console.error("Error verifying evaluation:", error);
    return NextResponse.json({ error: "Failed to verify evaluation" }, { status: 500 });
  }
}
