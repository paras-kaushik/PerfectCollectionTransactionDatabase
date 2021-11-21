const { json } = require("express");
const Transaction = require("../models/transaction");

module.exports.create = function (req, res) {
  var x = JSON.parse(req.body.completeTransactionJson);
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

  console.log(myPurchases);

  Transaction.create(
    {
      transactionNumber: parseInt(x.transactionNumber),
      transactionName: "TBD",
      purchases: myPurchases,
      totalItems: parseInt(x.totalItems),
      totalPrice: parseInt(x.totalPrice),
      netPrice: parseInt(x.netPrice),
    },
    function (err, post) {
      if (err) {
        console.log("error in creating a transaction");
        console.log(err);
        return;
      }
      if (post) {
        console.log("Greate success");
        return res.redirect("back");
      }
    }
  );
};
