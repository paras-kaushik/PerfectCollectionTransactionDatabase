const { json } = require("express");
const Transaction = require("../models/transaction");
const { generateInvoicePdf } = require("../services/pdfGenerator");
const { sendInvoice } = require("../services/whatsapp");
var moment = require("moment");

module.exports.create = async function (req, res) {
  var x = req.body;
  var myPurchases = [];
  for (var i = 0; i < x.purchases.length; i++) {
    var ob = {};
    ob["itemNumber"] = x.purchases[i].itemNumber;
    ob["itemName"] = x.purchases[i].itemName;
    ob["itemPrice"] = x.purchases[i].itemPrice;
    ob["itemQuantity"] = x.purchases[i].itemQuantity;
    ob["itemTotalPrice"] = x.purchases[i].itemTotalPrice;
    myPurchases.push(ob);
  }

  try {
    var transaction = await Transaction.create({
      transactionNumber: parseInt(x.transactionNumber),
      transactionName: x.customerName || "TBD",
      customerName: x.customerName || "",
      phoneNumber: x.phoneNumber || "",
      transactionType: x.transactionType,
      remarks: x.remarks,
      shopname: x.shopname,
      purchases: myPurchases,
      totalItems: parseInt(x.totalItems),
      totalPrice: parseInt(x.totalPrice),
      netPrice: parseInt(x.netPrice),
      gstAsPerfive: x.gstAsPerfive ? parseFloat(x.gstAsPerfive) : 0,
      gstAsPertwel: x.gstAsPertwel ? parseFloat(x.gstAsPertwel) : 0,
      createdAt: moment(x.createdAt),
    });

    console.log("Transaction saved:", transaction.transactionNumber);

    // --- WhatsApp Invoice Sending ---
    var phoneNumber = x.phoneNumber;
    var skipWhatsApp =
      !phoneNumber || phoneNumber.toUpperCase() === "NA" || phoneNumber.trim() === "";

    var whatsappStatus = "skipped";

    if (!skipWhatsApp) {
      try {
        var pdfBuffer = await generateInvoicePdf({
          transactionNumber: transaction.transactionNumber,
          createdAt: x.createdAt,
          transactionType: x.transactionType,
          customerName: x.customerName,
          purchases: myPurchases,
          totalItems: transaction.totalItems,
          netPrice: transaction.netPrice,
        });

        var filename = "PerfectCollection_Invoice_" + transaction.transactionNumber + ".pdf";

        await sendInvoice(phoneNumber, pdfBuffer, filename, x.customerName || "Customer", transaction.transactionNumber);
        whatsappStatus = "sent";
        console.log("WhatsApp invoice sent to " + phoneNumber);
      } catch (waError) {
        whatsappStatus = "failed";
        console.error("WhatsApp send failed:", waError.response ? waError.response.data : waError.message);
        // Don't fail the whole transaction — invoice was still saved
      }
    }

    return res.json({
      success: true,
      transactionId: transaction._id,
      whatsappStatus: whatsappStatus,
    });
  } catch (err) {
    console.log("Error in creating a transaction:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
