const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  // itemNumber: {
  //   type: Number,
  //   required: true,
  // },
  // itemName: {
  //   type: String,
  //   required: true,
  // },
  // itemPrice: {
  //   type: Number,
  //   required: true,
  // },
  // itemQuantity: {
  //   type: Number,
  //   required: true,
  // },
  // itemTotalPrice: {
  //   type: Number,
  //   required: true,
  // },
  // parentTransactionId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Transaction",
  //   required: true,
  // },
});

const Purchase = mongoose.model("Purchase", purchaseSchema);
module.exports = Purchase;
