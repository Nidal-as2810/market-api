const { ObjectId } = require("mongodb");
const { getDb } = require("../config/connectDB");

const createItem = async (req, res) => {
  const {
    categoryId,
    subId,
    name,
    description,
    price,
    quantity,
    unit,
    images,
  } = req.body;

  if (!categoryId || !subId || !name || !price || !quantity) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  if (!images) images = [];

  validateIDS([subId, categoryId], res);

  const sub = await getNeededSub(categoryId, subId, res);
  if (!sub)
    return res.status(401).json({ message: "This subcategory doesn't exist!" });
  if (!sub.items) sub.items = [];

  const item = {
    name,
    description,
    price,
    quantity,
    unit,
    images,
    categoryId,
    subId,
    _id: new ObjectId(),
  };
  sub.items.push(item);
  saveChanges(categoryId, sub, res);
};

const updateItem = async (req, res) => {
  const {
    categoryId,
    subId,
    name,
    description,
    price,
    quantity,
    unit,
    images,
    _id,
    soldQTY,
  } = req.body;

  if (!_id || !categoryId || !subId || !name || !price || !quantity) {
    console.log("here");
    return res.status(400).json({ message: "All fields are required!" });
  }

  validateIDS([_id, categoryId, subId], res);

  const sub = await getNeededSub(categoryId, subId, res);

  const items = sub.items?.filter((item) => item._id != _id);

  const item = {
    categoryId,
    subId,
    name,
    description,
    price,
    quantity,
    unit,
    images,
    _id: new ObjectId(_id),
    soldQTY,
  };
  items.push(item);
  sub.items = items;
  saveChanges(categoryId, sub, res);
};

const deleteItem = async (req, res) => {
  const { categoryId, subId, _id } = req.body;

  if (!_id || !categoryId || !subId) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  validateIDS([categoryId, subId, _id], res);

  const sub = await getNeededSub(categoryId, subId, res);

  const items = sub.items?.filter((item) => item._id != _id);
  sub.items = items;
  saveChanges(categoryId, sub, res);
};

module.exports = {
  createItem,
  updateItem,
  deleteItem,
};

const findCategory = async (categoryId, res) => {
  const db = getDb();
  const category = await db
    .collection("categories")
    .findOne({ _id: new ObjectId(categoryId) });

  if (!category) {
    return res
      .status(500)
      .json({ message: "incorrect item category or subcategory!" });
  }

  return category;
};

const validateIDS = (idArray, res) => {
  idArray.forEach((id) => {
    if (!ObjectId.isValid(id)) {
      return res
        .status(500)
        .json({ message: "incorrect item category or subcategory!" });
    }
  });
};

const getNeededSub = async (categoryId, subId, res) => {
  const category = await findCategory(categoryId, res);
  const sub = category.subs.filter((sub) => sub._id == subId)[0];
  if (!sub) {
    return res
      .status(500)
      .json({ message: "incorrect item category or subcategory!" });
  }

  return sub;
};

const saveChanges = async (categoryId, sub, res) => {
  const category = await findCategory(categoryId, res);
  const subs = category.subs.filter(
    (s) => s._id.toString() != sub._id.toString()
  );

  subs.push(sub);

  const db = getDb();
  const result = await db
    .collection("categories")
    .updateOne({ _id: new ObjectId(categoryId) }, { $set: { subs } });

  if (result.acknowledged) {
    return res.status(200).json(result);
  } else {
    return res.status(500).json({ message: "Error" });
  }
};
