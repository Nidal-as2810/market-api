const express = require("express");
const router = express.Router();
const categoryContoller = require("../controllers/categoryController");
const ROLES_LIST = require("../config/roles_list");
const verifyRoles = require("../midleware/verifyRoles");

router.route("/").get(categoryContoller.getAllCategories);

router.route("/:nameEn").get(categoryContoller.getCategoryByName);

module.exports = router;
