const express = require("express");
const router = express.Router();
const subCategoryController = require("../controllers/subCategoryConroller");
const verifyRoles = require("../midleware/verifyRoles");

router
  .route("/")
  .post(verifyRoles(1000, 2000), subCategoryController.createSubCategory)
  .patch(subCategoryController.updateSubCategory);

router.route("/delete").delete(subCategoryController.deleteSubCategory);

module.exports = router;
