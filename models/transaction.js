const mongoose = require("mongoose");
//import { Purchase } from "./purchase";
const transactionSchema = new mongoose.Schema(
  {
    transactionNumber: {
      // starts from 1 !
      type: Number,
      required: true,
    },
    customerName: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    transactionType: {
      type: String,
    },
    shopname:{
      type:String,
    },
    purchases: [
      {
        itemNumber: {
          type: String,
          required: true,
        },
        itemName: {
          type: String,
          required: true,
        },
        itemPrice: {
          type: Number,
          required: true,
        },
        itemQuantity: {
          type: Number,
          required: true,
        },
        itemTotalPrice: {
          type: Number,
          required: true,
        },
      },
    ],
    totalItems: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    gstAsPerfive: {
      type: Number,
    },
    gstAsPertwel: {
      type: Number,
    },
    netPrice: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
