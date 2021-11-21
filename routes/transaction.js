const express = require("express");
const router = express.Router();

const transactionConrtoller = require("../controllers/transaction_controller");

router.post("/create", transactionConrtoller.create); //
//http://localhost:8000/transaction/create

module.exports = router;
