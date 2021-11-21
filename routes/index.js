const express = require("express");

const router = express.Router();
const homeController = require("../controllers/home_controller");

console.log("router loaded");

router.get("/", homeController.home);
// router.get("/transaction/create", function (req, res) {
//   console.log(req, res);
// });
router.use("/users", require("./users"));
router.use("/transaction", require("./transaction")); //

//http://localhost:8000/transaction/create

// for any further routes, access from here
// router.use('/routerName', require('./routerfile));

module.exports = router;
