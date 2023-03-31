const { ObjectId } = require("mongodb");
const { getDb } = require("../config/connectDB");
const collectionName = "orders";

const createOrder = async (req, res) => {
  const { username, items } = req.body;

  if (!username) return res.status(403);

  const tempOrder = await checkTempOrderByUserName(username);

  if (!tempOrder) {
    if (items?.length > 0) updateItemsInStock("order", items);
    const order = {
      username,
      date: new Date(),
      total: items?.length > 0 ? orderTotal(items) : 0,
      totalItems: items?.length > 0 ? orderTotalItems(items) : 0,
      totalDifferentItems: items?.length || 0,
      items: items?.length > 0 ? items : [],
      temp: true,
    };
    const db = getDb();
    await db.collection(collectionName).insertOne(order);
    return res.status(200).json({ message: "Added!" });
  } else {
    req.body.order = tempOrder;
    addItemsToTempOrder(req, res);
  }
};

const addItemsToTempOrder = async (req, res) => {
  const { order, items } = req.body;

  if (!order) return createOrder(req, res);

  updateItemsInStock("order", items);
  const otherItems = preventDuplication(order.items, items);
  const newItems = [...otherItems, ...items];
  const total = orderTotal(newItems);
  const totalItems = orderTotalItems(newItems);
  const totalDifferentItems = newItems.length;

  const db = getDb();
  await db
    .collection(collectionName)
    .updateOne(
      { _id: new ObjectId(order._id) },
      { $set: { items: newItems, total, totalItems, totalDifferentItems } }
    );
  return res.status(200).json({ message: "Added!" });
};

const updateItemInOrder = async (req, res) => {
  const { orderId, item, username } = req.body;
  const order = await checkTempOrderByUserName(username);

  if (!order || order._id.toString() !== orderId)
    return res.status(401).json({ message: "You can't change this." });

  const oldItem = order.items.filter((i) => i._id == item._id);
  updateItemsInStock("return", oldItem);
  updateItemsInStock("order", [item]);
  const otherItems = order.items.filter((i) => i._id != item._id);
  const newItems = [...otherItems, item];
  const total = orderTotal(newItems);
  const totalItems = orderTotalItems(newItems);
  const totalDifferentItems = newItems.length;
  const db = getDb();
  const response = await db
    .collection(collectionName)
    .updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { items: newItems, total, totalItems, totalDifferentItems } }
    );
  res.status(200).json(response);
};

const deleteItemFromOrder = async (req, res) => {
  const { orderId, item, username } = req.body;
  const order = await checkTempOrderByUserName(username);

  if (!order || order._id.toString() !== orderId)
    return res.status(401).json({ message: "You can't change this." });

  updateItemsInStock("return", [item]);
  const newItems = order.items.filter((i) => i._id != item._id);
  const total = orderTotal(newItems);
  const totalItems = orderTotalItems(newItems);
  const totalDifferentItems = newItems.length;
  const db = getDb();
  const response = await db
    .collection(collectionName)
    .updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { items: newItems, total, totalItems, totalDifferentItems } }
    );
  res.status(200).json(response);
};

const closeOrder = async (req, res) => {
  const { orderId, username, info } = req.body;
  const order = await checkTempOrderByUserName(username);

  if (!order || order._id.toString() !== orderId)
    return res.status(401).json({ message: "You can't change this." });

  const db = getDb();
  const response = await db
    .collection(collectionName)
    .updateOne({ _id: new ObjectId(orderId) }, { $set: { info, temp: false } });
  res.status(200).json(response);
};

const deleteOrder = async (req, res) => {
  const { orderId, username } = req.body;
  const order = await checkTempOrderByUserName(username);

  if (!order || order._id.toString() !== orderId)
    return res.status(401).json({ message: "You can't delete this order." });

  updateItemsInStock("return", order.items);
  const db = getDb();
  const response = await db
    .collection(collectionName)
    .deleteOne({ _id: new ObjectId(orderId) });
  res.status(200).json(response);
};

const getTempOrder = async (req, res) => {
  const username = req.params.username;

  if (!username) return res.sendStatus(403);

  const order = await checkTempOrderByUserName(username);

  return res.status(200).json(order);
};

const getAllOrders = async (req, res) => {
  const username = req.params.username;
  if (!username) return res.sendStatus(403);

  const orders = [];
  const db = getDb();
  await db
    .collection(collectionName)
    .find({ username })
    .sort({ date: -1 })
    .forEach((order) => {
      orders.push(order);
    });

  return res.status(200).json(orders);
};

const getAllOrdersOfAllUsers = async (req, res) => {
  const orders = [];
  const db = getDb();
  await db
    .collection(collectionName)
    .find()
    .sort({ date: -1 })
    .forEach((order) => {
      orders.push(order);
    });

  return res.status(200).json(orders);
};
module.exports = {
  createOrder,
  addItemsToTempOrder,
  updateItemInOrder,
  deleteItemFromOrder,
  closeOrder,
  deleteOrder,
  getTempOrder,
  getAllOrders,
  getAllOrdersOfAllUsers,
};

const checkTempOrderByUserName = async (username) => {
  const db = getDb();

  return await db.collection(collectionName).findOne({ username, temp: true });
};

const orderTotal = (items) => {
  let total = 0;
  items.forEach((item) => {
    total += item.orderQTY * item.price;
  });
  return total;
};

const orderTotalItems = (items) => {
  let total = 0;
  items.forEach((item) => {
    total += item.orderQTY * 1;
  });
  console.log(total);
  return total;
};

const preventDuplication = (oldItems, items) => {
  let newArr = oldItems;
  items.forEach((element) => {
    newArr = newArr.filter((item) => item._id != element._id);
  });

  return newArr;
};

const updateItemsInStock = async (type, items) => {
  switch (type) {
    case "return":
      increaseStock(items);
      break;
    case "order":
      decreaseFromStock(items);
      break;
  }
};

const increaseStock = async (items) => {
  items.forEach(async (item) => {
    const stockItem = await getItemFromStock(item);

    const updatedItem = {
      categoryId: item.categoryId,
      subId: item.subId,
      name: item.name,
      description: item.description,
      price: item.price,
      quantity: stockItem.quantity + item.orderQTY,
      unit: item.unit,
      images: item.images,
      _id: item._id,
      soldQTY: stockItem.soldQTY ? stockItem.soldQTY - item.orderQTY : 0,
    };

    saveChanges(updatedItem);
  });
};
const decreaseFromStock = async (items) => {
  items.forEach(async (item) => {
    const stockItem = await getItemFromStock(item);

    const updatedItem = {
      categoryId: item.categoryId,
      subId: item.subId,
      name: item.name,
      description: item.description,
      price: item.price,
      quantity: stockItem.quantity - item.orderQTY,
      unit: item.unit,
      images: item.images,
      _id: item._id,
      soldQTY: stockItem.soldQTY
        ? stockItem.soldQTY + item.orderQTY
        : item.orderQTY,
    };

    saveChanges(updatedItem);
  });
};

const saveChanges = async (item) => {
  const db = getDb();
  const category = await db
    .collection("categories")
    .findOne({ _id: new ObjectId(item.categoryId) });

  const sub = category.subs.filter((s) => s._id == item.subId)[0];
  const otherSubs = category.subs.filter((s) => s._id != item.subId);
  const otherItems = sub.items.filter((i) => i._id != item._id);
  otherItems.push(item);
  sub.items = otherItems;
  otherSubs.push(sub);

  await db
    .collection("categories")
    .updateOne(
      { _id: new ObjectId(item.categoryId) },
      { $set: { subs: otherSubs } }
    );
};

const getItemFromStock = async (item) => {
  const db = getDb();

  const category = await db
    .collection("categories")
    .findOne({ _id: new ObjectId(item.categoryId) });

  const sub = category.subs.filter((s) => s._id == item.subId)[0];
  const stockItem = sub.items.filter((i) => i._id == item._id)[0];

  return stockItem;
};
