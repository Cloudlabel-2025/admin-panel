import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import Payroll from "../../../../models/Payroll";
import connectMongoose from "@/app/utilis/connectMongoose";

// GET: Employee-specific payroll records
export async function GET(req, { params }) {
  try {
    await connectMongoose();
    const { employeeId } = await params;
    const { searchParams } = new URL(req.url);
    
    const payPeriod = searchParams.get("payPeriod");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit")) || 12;
    
    let query = { employeeId };
    if (payPeriod) query.payPeriod = payPeriod;
    if (status) query.status = status;
    
    const payrolls = await Payroll.find(query)
      .sort({ payPeriod: -1 })
      .limit(limit);
    
    // Calculate summary stats
    const totalPaid = payrolls
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + p.netPay, 0);
    
    const avgSalary = payrolls.length > 0 
      ? payrolls.reduce((sum, p) => sum + p.netPay, 0) / payrolls.length 
      : 0;
    
    return NextResponse.json({
      success: true,
      payrolls,
      summary: {
        totalRecords: payrolls.length,
        totalPaid: Math.round(totalPaid),
        avgSalary: Math.round(avgSalary),
        lastPayPeriod: payrolls[0]?.payPeriod || null
      }
    });
  } catch (error) {
    console.error('Employee payroll GET error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// DELETE: Delete specific payroll record
export async function DELETE(req, { params }) {
  try {
    await connectMongoose();
    const { employeeId } = await params;
    const { searchParams } = new URL(req.url);
    const payrollId = searchParams.get("payrollId");
    
    if (!payrollId) {
      return NextResponse.json({ 
        success: false, 
        error: "Payroll ID required" 
      }, { status: 400 });
    }
    
    const payroll = await Payroll.findOneAndDelete({ 
      _id: payrollId, 
      employeeId,
      status: { $ne: 'Paid' } // Cannot delete paid payrolls
    });
    
    if (!payroll) {
      return NextResponse.json({ 
        success: false, 
        error: "Payroll not found or cannot be deleted" 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Payroll deleted successfully" 
    });
  } catch (error) {
    console.error('Employee payroll DELETE error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}