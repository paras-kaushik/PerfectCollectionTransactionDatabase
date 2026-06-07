const PDFDocument = require("pdfkit");

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

    // --- Header ---
    doc.fontSize(20).font("Helvetica-Bold").text("Perfect Collection", { align: "center" });
    doc.fontSize(10).font("Helvetica").text("(9899258797)", { align: "center" });
    doc.fontSize(9).text("SC-190, Jaipuria Sunrise Plaza, Indirapuram, GIZB, UP", { align: "center" });
    doc.moveDown();

    // --- Invoice info ---
    doc.fontSize(11).font("Helvetica-Bold").text(`Estimate No: ${transaction.transactionNumber}`);
    doc.font("Helvetica").text(`Date: ${transaction.createdAt}`);
    doc.text(`Payment: ${transaction.transactionType}`);
    if (transaction.customerName) {
      doc.text(`Customer: ${transaction.customerName}`);
    }
    doc.moveDown();

    // --- Items table ---
    doc.font("Helvetica-Bold");
    const tableTop = doc.y;
    doc.text("Item", 40, tableTop, { width: 150 });
    doc.text("Price", 190, tableTop, { width: 80, align: "right" });
    doc.text("Qty", 270, tableTop, { width: 60, align: "right" });
    doc.text("Total", 330, tableTop, { width: 80, align: "right" });
    doc.moveTo(40, doc.y + 2).lineTo(410, doc.y + 2).stroke();
    doc.moveDown(0.5);

    doc.font("Helvetica");
    for (const item of transaction.purchases) {
      const y = doc.y;
      doc.text(item.itemName, 40, y, { width: 150 });
      doc.text(String(item.itemPrice), 190, y, { width: 80, align: "right" });
      doc.text(String(item.itemQuantity), 270, y, { width: 60, align: "right" });
      doc.text(String(item.itemTotalPrice), 330, y, { width: 80, align: "right" });
      doc.moveDown(0.3);
    }

    doc.moveTo(40, doc.y + 2).lineTo(410, doc.y + 2).stroke();
    doc.moveDown();

    // --- Totals ---
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text(`Total Items: ${transaction.totalItems}`, { align: "right" });
    doc.text(`Net Total: Rs.${transaction.netPrice}`, { align: "right" });
    doc.moveDown(2);

    // --- Footer ---
    doc.fontSize(10).font("Helvetica").text("FIXED PRICE SHOP", { align: "center" });
    doc.text("Thank you for your purchase!", { align: "center" });

    doc.end();
  });
}

module.exports = { generateInvoicePdf };
