import connectMongoose from "@/app/utilis/connectMongoose";
import Invoice from "@/models/Invoice";
import { NextResponse } from "next/server";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export async function GET(request, { params }) {
  try {
    await connectMongoose();
    
    const invoice = await Invoice.findById(params.id).populate('clientId');
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const companyDetails = {
      name: "Your Company Name",
      address: {
        street: "123 Business Street",
        city: "City",
        state: "State",
        zipCode: "12345",
        country: "Country"
      },
      phone: "+1 (555) 123-4567",
      email: "info@yourcompany.com",
      taxId: "TAX123456789",
      website: "www.yourcompany.com"
    };

    // Create PDF
    const doc = new jsPDF();
    
    // Company Header
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('CLOUDHEARD CONSULTANCY PRIVATE LIMITED', 20, 20);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('NO 39/8, 12TH STREET, T.T. KULAM, CUDDALORE', 20, 30);
    doc.text('Tamil Nadu 625516, India', 20, 35);
    doc.text('GSTIN: 33AAKCC1715F1Z3', 20, 40);
    
    // TAX INVOICE Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('TAX INVOICE', 150, 25);
    
    // Invoice Info
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Invoice No.: # ${invoice.invoiceNumber}`, 150, 35);
    doc.setFont(undefined, 'bold');
    doc.text(`Balance Due: ₹${invoice.total.toLocaleString()}`, 150, 42);
    doc.setFont(undefined, 'normal');
    doc.text(`Invoice Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 150, 49);
    doc.text('Terms: Due on Receipt', 150, 56);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 150, 63);
    
    // Bill To
    doc.setFont(undefined, 'bold');
    doc.text('Bill To:', 20, 70);
    doc.setFont(undefined, 'normal');
    doc.text(invoice.clientId.name, 20, 77);
    if (invoice.clientId.company) doc.text(invoice.clientId.company, 20, 84);
    doc.text(invoice.clientId.email, 20, 91);
    if (invoice.clientId.phone) doc.text(invoice.clientId.phone, 20, 98);
    
    // Items Table
    const tableData = invoice.items.map((item, index) => [
      index + 1,
      item.description,
      '998311',
      item.quantity.toFixed(2),
      `₹${item.rate.toLocaleString()}`,
      '18%',
      `₹${item.amount.toLocaleString()}`
    ]);
    
    doc.autoTable({
      startY: 110,
      head: [['#', 'Item & Description', 'HSN/SAC', 'Qty', 'Rate', 'IGST', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
      styles: { fontSize: 9 }
    });
    
    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Sub Total: ₹${invoice.subtotal.toLocaleString()}`, 150, finalY);
    doc.text(`IGST18 (18%): ₹${invoice.tax.toLocaleString()}`, 150, finalY + 7);
    doc.setFont(undefined, 'bold');
    doc.text(`Total: ₹${invoice.total.toLocaleString()}`, 150, finalY + 14);
    doc.text(`Balance Due: ₹${invoice.total.toLocaleString()}`, 150, finalY + 21);
    
    // Notes
    if (invoice.notes) {
      doc.setFont(undefined, 'normal');
      doc.text(`Notes: ${invoice.notes}`, 20, finalY + 35);
    }
    
    // Terms
    doc.text('Terms & Conditions:', 20, finalY + 45);
    doc.text('ICICI Bank, CLOUDHEARD CONSULTANCY PRIVATE LIMITED', 20, finalY + 52);
    doc.text('Account No: 186105005695, IFSC: ICIC0003816', 20, finalY + 59);
    
    // Footer
    doc.text('Authorised Signature: _________________________', 20, finalY + 75);
    
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
      }
    });

  } catch (err) {
    console.error("Error generating PDF:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}