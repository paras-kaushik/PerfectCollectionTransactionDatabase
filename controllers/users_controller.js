const Transaction = require("../models/transaction");
var moment = require("moment");

module.exports.profile = function (req, res) {
  Transaction.find({})
    .sort({ createdAt: "descending" })
    .exec(function (err, transactions) {
      return res.render("user_profile", {
        title: "User Profile",
        transactions: transactions,
        moment: moment,
      });
    });
};
