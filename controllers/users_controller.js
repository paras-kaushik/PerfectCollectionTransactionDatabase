const Transaction = require("../models/transaction");
var moment = require("moment");
const today = moment().startOf("day");
module.exports.profile = function (req, res) {
  var todaysSale = 0;
  Transaction.aggregate(
    [
      {
        $match: {
          createdAt: {
            $gte: today.toDate(),
            $lte: moment(today).endOf("day").toDate(),
          },
        },
      },
      {
        $group: {
          _id: "",
          total: {
            $sum: "$netPrice",
          },
        },
      },
    ],
    function (err, obj) {
      console.log("***************************************", err, obj[0].total);
      if (obj && obj[0]) todaysSale = obj[0].total;
    }
  );

  Transaction.find({
    createdAt: {
      $gte: today.toDate(),
      $lte: moment(today).endOf("day").toDate(),
    },
  })
    .sort({ createdAt: "descending" })
    .exec(function (err, transactions) {
      return res.render("user_profile", {
        title: "User Profile",
        transactions: transactions,
        moment: moment,
        todaysSale: todaysSale,
      });
    });
};
