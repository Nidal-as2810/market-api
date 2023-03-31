const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const { getDb } = require("../config/connectDB");

const register = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "all fields are required." });
  }

  const duplicate = await getUserByUsername(username);
  if (duplicate) {
    return res
      .status(409)
      .json({ message: "This username has been taken.", status: 409 });
  }

  const encryptedPassword = await bcrypt.hash(password + "", 10);
  const user = {
    _id: new ObjectId(),
    username,
    password: encryptedPassword,
    active: true,
    roles: [3000],
    refreshToken: "",
  };

  const db = getDb();
  const response = await db.collection("users").insertOne(user);

  if (response.acknowledged) {
    res
      .status(201)
      .json({ message: `New user ${username} created.`, status: 201 });
  } else {
    res
      .status(500)
      .json({ message: `Invalid user data received.`, status: 500 });
  }
};

const updateUser = async (req, res) => {
  const { id, username, active, info } = req.body;

  if (!id || !username || typeof active !== "boolean") {
    return res.status(400).json({ message: "All fields are required!" });
  }

  const currentUser = await getUserByUsername(username);

  if (currentUser && currentUser?._id.toString() !== id) {
    return res.status(409).json({ message: "This username has been taken." });
  }

  currentUser.info = info;
  await saveChanges("update", currentUser, res).catch((err) => {
    return res.status(500).json({ message: "Error", error: err });
  });
};

const changePassword = async (req, res) => {
  const { id, username, active, password } = req.body;

  if (!id || !username || typeof active !== "boolean" || !password) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  const currentUser = await getUserByUsername(username);

  if (currentUser?._id.toString() !== id) {
    return res.status(409).json({ message: "This username is incorrect." });
  }

  const matchPassword = await bcrypt.compare(password, user.password);
  if (matchPassword) {
    return res
      .status(409)
      .json({ message: "You didn't change the actual password" });
  }

  currentUser.password = await bcrypt.hash(password, 10);
  await saveChanges("changePassword", currentUser, res).catch((err) => {
    return res.status(500).json({ message: "Error", error: err });
  });
};

const authenticate = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "all fields are required." });
  }

  const user = await getUserByUsername(username);
  if (!user) {
    return res.status(401).json({ message: "Unautherized!" });
  }

  const matchPassword = await bcrypt.compare(password, user.password);

  if (!matchPassword) {
    return res.status(401).json({ message: "Unautherized!" });
  }

  const accessToken = jwt.sign(
    {
      UserInfo: {
        username: user.username,
        roles: user.roles,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    {
      username: user.username,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "1d" }
  );

  user.refreshToken = refreshToken;
  await saveChanges("authenticate", user, res, accessToken).catch((err) => {
    return res.status(500).json({ message: "Error", error: err.message });
  });
};

module.exports = { register, updateUser, changePassword, authenticate };

const getUserByUsername = async (username) => {
  const db = getDb();
  return await db.collection("users").findOne({ username });
};

const saveChanges = async (type, user, res, data) => {
  const db = getDb();
  switch (type) {
    case "update":
      await db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(user._id) },
          { $set: { info: user.info } }
        );
      return res
        .status(200)
        .json({ message: `${updatedUser.username} is updated` });
    case "changePassword":
      await db.collection("users").updateOne(
        {
          _id: new ObjectId(user._id),
        },
        {
          $set: { password: user.password },
        }
      );
      return res
        .status(200)
        .json({ message: `${updatedUser.username} is updated` });
    case "authenticate":
      await db.collection("users").updateOne(
        {
          _id: new ObjectId(user._id),
        },
        {
          $set: { refreshToken: user.refreshToken },
        }
      );
      return res
        .cookie("jwt", user.refreshToken, {
          httpOnly: true,
          sameSite: "None",
          secure: true,
          maxAge: 24 * 60 * 60 * 1000,
        })
        .status(200)
        .json({
          token: data,
          status: 200,
          roles: user.roles,
          username: user.username,
        });
    default:
      return res.status(500).json({ message: "Error", error: err });
  }
};
