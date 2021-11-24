const express = require("express");
const router = express.Router();

const transactionConrtoller = require("../controllers/transaction_controller");
router.post("/create", transactionConrtoller.create);
module.exports = router;
