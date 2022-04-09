const express = require("express");
const router = express.Router();
const usersConrtoller = require("../controllers/users_controller");
router.get("/profile", usersConrtoller.profile);
router.get("/month", usersConrtoller.month);
router.get("/pop/:id", usersConrtoller.destroy);
router.get("/profile/:date", usersConrtoller.profilebydate);

module.exports = router;
