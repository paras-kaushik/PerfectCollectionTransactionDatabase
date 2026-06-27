const PDFDocument = require("pdfkit");
const path = require("path");

/**
 * Generates a PDF buffer from transaction data.
 * Returns a Promise that resolves to a Buffer containing the PDF bytes.
 */
function generateInvoicePdf(transaction) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // --- Logo Placement ---
    try {
      const logoPath = path.join(__dirname, "../assets/images/Logo png Transparent.png");
      doc.image(logoPath, (595 - 75) / 2, 35, { width: 75 });
    } catch (err) {
      console.error("Error embedding logo in PDF:", err.message);
      // Fail-safe: continue PDF generation even if logo fails
    }

    // --- Header ---
    doc.fillColor("#0f172a"); // Dark slate
    doc.fontSize(14).font("Times-Roman").text("Perfect Collection Kurta Pajama & Sherwani House", 40, 120, { align: "center" });
    doc.moveDown(0.2);
    
    doc.fontSize(9.5).font("Times-Roman").text("SC-190, Jaipuria, behind BIKANERWALA, Ahinsa Khand 1, Indirapuram, Ghaziabad, Uttar Pradesh 201014", { align: "center" });
    doc.moveDown(0.2);
    
    doc.fontSize(10).font("Times-Roman").text("Kurta Pajama | Indo-Western | Sherwani | Half Jackets", { align: "center" });
    doc.moveDown(1.5);

    // --- Invoice Info (Columns) ---
    const infoY = doc.y;
    doc.fillColor("#0f172a");
    
    // Left Column: Invoice Title and Metadata
    doc.fontSize(12).font("Times-Italic").text("Estimate", 40, infoY);
    doc.moveDown(0.2);
    
    // Fix falsy 0 bug for Estimate Number
    const estNo = (transaction.transactionNumber !== undefined && transaction.transactionNumber !== null) ? String(transaction.transactionNumber) : "0";
    doc.fontSize(9.5).font("Times-Bold").text("Estimate No: ", 40, doc.y, { continued: true })
       .font("Times-Roman").text(estNo);
    
    const dateStr = transaction.createdAt ? String(transaction.createdAt).substring(0, 10) : new Date().toISOString().substring(0, 10);
    doc.font("Times-Bold").text("Date: ", 40, doc.y, { continued: true })
       .font("Times-Roman").text(dateStr);
       
    doc.font("Times-Bold").text("Payment: ", 40, doc.y, { continued: true })
       .font("Times-Roman").text(transaction.transactionType || "CASH");
       
    if (transaction.customerName && transaction.customerName !== "Customer" && transaction.customerName.trim() !== "") {
      doc.font("Times-Bold").text("Customer: ", 40, doc.y, { continued: true })
         .font("Times-Roman").text(transaction.customerName);
    }

    const bottomOfLeftColumnY = doc.y;

    // Right Column: Contact & Socials
    const rightColumnY = infoY + 16;
    doc.fontSize(9.5);
    doc.font("Times-Roman").text("Contact: +91-9899258797", 300, rightColumnY, { width: 255, align: "right" });
    doc.text("Website: Kurtastore.in", 300, doc.y, { width: 255, align: "right" });
    doc.text("Instagram: Perfectcollection_clothing", 300, doc.y, { width: 255, align: "right" });

    // Restore y coordinate below columns
    doc.y = Math.max(bottomOfLeftColumnY, doc.y) + 15;

    // --- Tagline ---
    doc.fontSize(10.5).font("Times-Roman").text("Perfect Kurtas for your Precious Day", { align: "center" });
    doc.moveDown(0.4);

    // Draw separator line below tagline
    doc.strokeColor("#e2e8f0").lineWidth(1);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    // Start table section below the metadata
    const tableTop = doc.y;
    
    // --- Items table header ---
    doc.strokeColor("#94a3b8").lineWidth(0.5);
    doc.moveTo(40, tableTop - 5).lineTo(555, tableTop - 5).stroke();
    
    doc.font("Times-Bold").fontSize(10).fillColor("#1e293b");
    doc.text("Item", 40, tableTop, { width: 280 });
    doc.text("Price", 320, tableTop, { width: 75, align: "right" });
    doc.text("Qty", 395, tableTop, { width: 60, align: "right" });
    doc.text("Total", 455, tableTop, { width: 100, align: "right" });
    
    doc.moveTo(40, tableTop + 14).lineTo(555, tableTop + 14).stroke();
    doc.y = tableTop + 18;

    doc.font("Times-Roman").fontSize(9.5).fillColor("#334155");
    for (const item of transaction.purchases) {
      const y = doc.y;
      doc.text(item.itemName, 40, y, { width: 280 });
      doc.text(String(item.itemPrice), 320, y, { width: 75, align: "right" });
      doc.text(String(item.itemQuantity), 395, y, { width: 60, align: "right" });
      doc.text(String(item.itemTotalPrice), 455, y, { width: 100, align: "right" });
      doc.moveDown(0.4);
    }

    const bottomLineY = doc.y + 4;
    doc.strokeColor("#94a3b8").lineWidth(0.5);
    doc.moveTo(40, bottomLineY).lineTo(555, bottomLineY).stroke();
    doc.y = bottomLineY + 10;

    // --- Totals ---
    doc.font("Times-Bold").fontSize(11).fillColor("#1e293b");
    doc.text(`Total Items: ${transaction.totalItems}`, { align: "right" });
    doc.fontSize(12).fillColor("#0f172a");
    doc.text(`Net Total: Rs.${transaction.netPrice}`, { align: "right" });
    doc.moveDown(1.5);

    // --- Footer ---
    doc.strokeColor("#cbd5e1").lineWidth(0.5);
    doc.moveTo(100, doc.y).lineTo(495, doc.y).stroke();
    doc.moveDown(0.5);
    
    doc.fontSize(10).font("Times-Bold").fillColor("#0f172a").text("FIXED PRICE SHOP", { align: "center" });
    doc.fontSize(9).font("Times-Roman").fillColor("#475569").text("Thank you for your purchase!", { align: "center" });

    doc.end();
  });
}

module.exports = { generateInvoicePdf };

