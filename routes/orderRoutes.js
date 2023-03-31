const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const ROLES_LIST = require("../config/roles_list");
const verifyRoles = require("../midleware/verifyRoles");

router
  .route("/")
  .post(verifyRoles(ROLES_LIST.User), orderController.createOrder)
  .patch(verifyRoles(ROLES_LIST.User), orderController.closeOrder)
  .delete(verifyRoles(ROLES_LIST.User), orderController.deleteOrder);

router
  .route("/:username")
  .get(verifyRoles(ROLES_LIST.User), orderController.getTempOrder);

router
  .route("/all/:username")
  .get(verifyRoles(ROLES_LIST.User), orderController.getAllOrders);

router
  .route("/admin")
  .get(verifyRoles(ROLES_LIST.Admin), orderController.getAllOrdersOfAllUsers);

router
  .route("/item")
  .post(verifyRoles(ROLES_LIST.User), orderController.addItemsToTempOrder)
  .patch(verifyRoles(ROLES_LIST.User), orderController.updateItemInOrder)
  .delete(verifyRoles(ROLES_LIST.User), orderController.deleteItemFromOrder);

module.exports = router;
