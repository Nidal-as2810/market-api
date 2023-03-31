const { ObjectId } = require("mongodb");
const { getDb } = require("../config/connectDB");

const createSubCategory = (req, res) => {
  const db = getDb();
  const { categoryId, nameEn, nameAr, nameHe } = req.body;

  if (!categoryId || !nameEn) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  if (ObjectId.isValid(categoryId)) {
    const sub = {
      nameEn,
      nameAr,
      nameHe,
      items: [],
      _id: new ObjectId(),
    };

    db.collection("categories")
      .findOne({ _id: new ObjectId(categoryId) })
      .then((result) => {
        if (result == null) {
          return res
            .status(404)
            .json({ message: "this category doesn't exist!" });
        } else {
          const subs = result.subs?.length > 0 ? result.subs : [];
          subs.push(sub);
          db.collection("categories")
            .updateOne({ _id: new ObjectId(categoryId) }, { $set: { subs } })
            .then((updateResult) => {
              return res.status(200).json(updateResult);
            })
            .catch((err) => {
              return res.status(500).json({ error: err });
            });
        }
      })
      .catch((err) => {
        return res.status(500).json({ error: err });
      });
  } else {
    return res.status(500).json({ error: "not valid category!" });
  }
};

const updateSubCategory = (req, res) => {
  const db = getDb();
  const { categoryId, _id, nameEn, nameAr, nameHe } = req.body;

  if (!categoryId || !nameEn) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  if (ObjectId.isValid(categoryId)) {
    db.collection("categories")
      .findOne({ _id: new ObjectId(categoryId) })
      .then((result) => {
        if (result == null) {
          return res
            .status(404)
            .json({ message: "this category doesn't exist!" });
        } else {
          const subs = result.subs;
          const currentSub = subs.filter((sub) => sub._id == _id);
          const otherSubs = subs.filter((sub) => sub._id != _id);

          currentSub[0].nameAr = nameAr;
          currentSub[0].nameEn = nameEn;
          currentSub[0].nameHe = nameHe;

          const updatedSubs = [...otherSubs, currentSub[0]];

          db.collection("categories")
            .updateOne(
              { _id: new ObjectId(categoryId) },
              { $set: { subs: updatedSubs } }
            )
            .then((updateResult) => {
              return res.status(200).json(updateResult);
            })
            .catch((err) => {
              return res.status(500).json({ error: err });
            });
        }
      })
      .catch((err) => {
        return res.status(500).json({ error: err });
      });
  } else {
    return res.status(500).json({ error: "not valid category!" });
  }
};

const deleteSubCategory = (req, res) => {
  const db = getDb();
  const { categoryId, _id } = req.body;

  if (!categoryId || !_id) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  if (ObjectId.isValid(categoryId)) {
    db.collection("categories")
      .findOne({ _id: new ObjectId(categoryId) })
      .then((result) => {
        if (result == null) {
          return res
            .status(404)
            .json({ message: "this category doesn't exist!" });
        } else {
          const subs = result.subs;
          const newSubs = subs.filter((sub) => sub._id != _id);

          db.collection("categories")
            .updateOne(
              { _id: new ObjectId(categoryId) },
              { $set: { subs: newSubs } }
            )
            .then((updateResult) => {
              return res.status(200).json(updateResult);
            })
            .catch((err) => {
              return res.status(500).json({ error: err });
            });
        }
      })
      .catch((err) => {
        return res.status(500).json({ error: err });
      });
  } else {
    return res.status(500).json({ error: "not valid category!" });
  }
};
module.exports = { createSubCategory, updateSubCategory, deleteSubCategory };
