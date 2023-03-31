const { ObjectId } = require("mongodb");
const { getDb } = require("../config/connectDB");

const getAllCategories = (req, res) => {
  const db = getDb();
  const categories = [];

  db.collection("categories")
    .find()
    .forEach((category) => {
      categories.push(category);
    })
    .then(() => {
      return res.status(201).json(categories);
    })
    .catch((err) => {
      return res.status(500).json({ error: "Can't reach the data." });
    });
};

const getCategoryByName = (req, res) => {
  const nameEn = req.params.nameEn;
  const db = getDb();

  db.collection("categories")
    .findOne({ nameEn })
    .then((result) => {
      return res.status(201).json(result);
    })
    .catch((err) => {
      return res.status(500).json({ message: "Can't reach database!" });
    });
};

const createCategory = (req, res) => {
  const { nameEn, nameAr, nameHe } = req.body;
  const db = getDb();

  db.collection("categories")
    .findOne({ nameEn })
    .then((result) => {
      if (result != null) {
        return res.status(409).json({ message: "This category exists!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ message: "Can't reach database!" });
    });

  db.collection("categories")
    .insertOne({ nameEn, nameAr, nameHe })
    .then((result) => {
      res.status(201).json(result);
    })
    .catch(() => {
      res.status(500).json({ err: "Could not create" });
    });
};

const updateCategory = (req, res) => {
  const db = getDb();

  const { _id, nameAr, nameEn, nameHe } = req.body;

  if (!_id)
    return res.status(400).json({ message: "All fields are required!" });

  db.collection("categories")
    .updateOne({ _id: new ObjectId(_id) }, { $set: { nameAr, nameEn, nameHe } })
    .then((result) => {
      return res.status(201).json(result);
    })
    .catch((err) => {
      return res.status(500).json({ error: err });
    });
};

const deleteCategory = (req, res) => {
  const db = getDb();
  const id = req.params.id;

  db.collection("categories")
    .deleteOne({ _id: new ObjectId(id) })
    .then((result) => {
      return res.status(201).json(result);
    })
    .catch((err) => {
      return res.status(500).json({ error: err });
    });
};

module.exports = {
  getAllCategories,
  createCategory,
  getCategoryByName,
  updateCategory,
  deleteCategory,
};
