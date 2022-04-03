const Transaction = require("../models/transaction");
var moment = require("moment");
const today = moment().startOf("day");
module.exports.profile = async function (req, res) {
  var todaysSale = 0;
  await Transaction.aggregate(
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
      if (obj && obj[0]) todaysSale = obj[0].total;
    }
  );

  await Transaction.find({
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
module.exports.month = async function (req, res) {
  var thirty_days_ago = moment().subtract(730, "days").toDate();

  Transaction.aggregate([
    {
      $match: {
        createdAt: {
          $gte: thirty_days_ago,
          $lte: moment(today).endOf("day").toDate(),
        },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        sum: { $sum: "$netPrice" },
      },
    },
  ])
    .sort({ _id: "ascending" })
    .exec(function (err, transactions) {
      console.log(transactions);
      return res.render("month", {
        title: "Last 730 days ",
        transactions: transactions,
        moment: moment,
      });
    });
};
module.exports.destroy = async function (req, res) {
  await Transaction.findById(req.params.id, function (err, post) {
    post.remove();
    return res.redirect("back");
  });
};
