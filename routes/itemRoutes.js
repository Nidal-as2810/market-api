const express = require("express");
const router = express.Router();
const itemController = require("../controllers/itemController");
const ROLES_LIST = require("../config/roles_list");
const verifyRoles = require("../midleware/verifyRoles");

router
  .route("/")
  .post(
    verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor),
    itemController.createItem
  )
  .patch(
    verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor),
    itemController.updateItem
  );

router.route("/delete").delete(itemController.deleteItem);

module.exports = router;
