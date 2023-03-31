const express = require("express");
const router = express.Router();
const categoryContoller = require("../controllers/categoryController");
const ROLES_LIST = require("../config/roles_list");
const verifyRoles = require("../midleware/verifyRoles");

router
  .route("/")
  .post(
    verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor),
    categoryContoller.createCategory
  )
  .patch(
    verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor),
    categoryContoller.updateCategory
  );

router
  .route("/:id")
  .delete(verifyRoles(ROLES_LIST.Admin), categoryContoller.deleteCategory);

module.exports = router;
