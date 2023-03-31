const express = require("express");
const router = express.Router();
const { updateUser, changePassword } = require("../controllers/userController");

router.route("/").patch(updateUser);

router.route("/change-password").put(changePassword);

module.exports = router;
