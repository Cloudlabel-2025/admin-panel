import connectMongoose from "@/app/utilis/connectMongoose";
import Invoice from "@/models/Invoice";
import { NextResponse } from "next/server";
import { requireRole } from "../../../../utilis/authMiddleware";
import jsPDF from 'jspdf';

function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  function convertHundreds(n) {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + ' ';
      n = 0;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result;
  }
  
  const crores = Math.floor(num / 10000000);
  const lakhs = Math.floor((num % 10000000) / 100000);
  const thousands = Math.floor((num % 100000) / 1000);
  const hundreds = num % 1000;
  
  let result = '';
  if (crores > 0) result += convertHundreds(crores) + 'Crore ';
  if (lakhs > 0) result += convertHundreds(lakhs) + 'Lakh ';
  if (thousands > 0) result += convertHundreds(thousands) + 'Thousand ';
  if (hundreds > 0) result += convertHundreds(hundreds);
  
  return result.trim();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export const GET = requireRole(["super-admin", "admin"])(async function(request, { params }) {
  try {
    await connectMongoose();
    const resolvedParams = await params;
    
    const invoice = await Invoice.findById(resolvedParams.id).populate('clientId');
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const doc = new jsPDF();
    
    // Company Header (Top Left)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CLOUDHEARD CONSULTANCY PRIVATE LIMITED', 20, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('NO 39/8, 12TH STREET, T.T. KULAM, CUDDALORE Tamil Nadu 625516, India', 20, 28);
    doc.text('GSTIN: 33AAKCC1715F1Z3', 20, 35);
    
    // TAX INVOICE Title (Top Right)
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', 140, 25);
    
    // Invoice Info (Right aligned)
    const invoiceDate = new Date(invoice.issueDate).toLocaleDateString('en-GB');
    const dueDate = new Date(invoice.dueDate).toLocaleDateString('en-GB');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No.: # ${invoice.invoiceNumber}`, 120, 45);
    doc.setFont('helvetica', 'bold');
    doc.text(`Balance Due: ₹${formatCurrency(invoice.total)}`, 120, 52);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice Date: ${invoiceDate}`, 120, 59);
    doc.text('Terms: Due on Receipt', 120, 66);
    doc.text(`Due Date: ${dueDate}`, 120, 73);
    doc.text(`P.O.#: ${invoice.poNumber || 'DLE42852P'}`, 120, 80);
    
    // Bill To Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, 100);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const clientName = invoice.clientId.company || invoice.clientId.name;
    doc.text(clientName, 20, 110);
    
    const address = invoice.clientId.address;
    if (address) {
      let addressText = '';
      if (address.street) addressText += address.street + ', ';
      if (address.city) addressText += address.city + ', ';
      if (address.state) addressText += address.state + ' ';
      if (address.zipCode) addressText += address.zipCode;
      doc.text(addressText, 20, 118);
    }
    
    if (invoice.clientId.gstin) {
      doc.text(`GSTIN: ${invoice.clientId.gstin}`, 20, 126);
    }
    
    // Ship To Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Ship To:', 120, 100);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Same as Bill To', 120, 110);
    doc.text(`Place of Supply: ${invoice.clientId.placeOfSupply || 'Telangana (36)'}`, 120, 118);
    
    // Items Table with borders
    const tableY = 150;
    const rowHeight = 10;
    
    // Table header with background
    doc.setFillColor(220, 220, 220);
    doc.rect(20, tableY, 170, rowHeight, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.rect(20, tableY, 170, rowHeight, 'S');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('#', 22, tableY + 6);
    doc.text('Item & Description', 30, tableY + 6);
    doc.text('HSN/SAC', 100, tableY + 6);
    doc.text('Qty', 120, tableY + 6);
    doc.text('Rate', 135, tableY + 6);
    doc.text('IGST', 155, tableY + 6);
    doc.text('Amount', 170, tableY + 6);
    
    // Table rows
    let currentY = tableY + rowHeight;
    doc.setFont('helvetica', 'normal');
    
    invoice.items.forEach((item, index) => {
      doc.rect(20, currentY, 170, rowHeight, 'S');
      doc.text((index + 1).toString(), 22, currentY + 6);
      doc.text(item.description.substring(0, 20), 30, currentY + 6);
      doc.text(item.hsnSac || '998311', 100, currentY + 6);
      doc.text(formatCurrency(item.quantity), 120, currentY + 6);
      doc.text(formatCurrency(item.rate), 135, currentY + 6);
      doc.text(item.igst || '18%', 155, currentY + 6);
      doc.text(formatCurrency(item.amount), 170, currentY + 6);
      currentY += rowHeight;
    });
    
    // Totals Section (Right aligned)
    const totalsY = currentY + 20;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Sub Total .................. ${formatCurrency(invoice.subtotal)}`, 120, totalsY);
    doc.text(`IGST18 (${invoice.taxPercent || 18}%) ............ ${formatCurrency(invoice.tax)}`, 120, totalsY + 8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total ......................... ₹${formatCurrency(invoice.total)}`, 120, totalsY + 16);
    
    // Balance Due Box
    doc.setDrawColor(0, 0, 0);
    doc.rect(120, totalsY + 20, 70, 10, 'S');
    doc.text(`Balance Due ......... ₹${formatCurrency(invoice.total)}`, 122, totalsY + 27);
    
    // Amount in Words
    const amountInWords = numberToWords(Math.floor(invoice.total));
    doc.setFont('helvetica', 'normal');
    doc.text(`Amount in Words: Indian Rupee ${amountInWords} Only`, 20, totalsY + 45);
    
    // Notes
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, totalsY + 60);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.notes || 'Thanks for your business.', 20, totalsY + 68);
    
    // Terms & Conditions
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', 20, totalsY + 85);
    doc.setFont('helvetica', 'normal');
    doc.text('ICICI Bank, CLOUDHEARD CONSULTANCY PRIVATE LIMITED', 20, totalsY + 93);
    doc.text('Account No: 186105005695, IFSC: ICIC0003816', 20, totalsY + 101);
    
    // Footer
    doc.text('Authorised Signature: _________________________', 20, totalsY + 120);
    
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
});