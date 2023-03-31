const { getDb } = require("../config/connectDB");
const asyncHandler = require("express-async-handler");
const { ObjectId } = require("mongodb");

const handleLogout = asyncHandler(async (req, res) => {
  const cookies = req.cookies;
  console.log(cookies);
  if (!cookies?.jwt) {
    console.log("here");
    return res.status(204).json({ message: "Logged Out", status: 204 });
  }

  const refreshToken = cookies.jwt;
  console.log(refreshToken);
  const db = getDb();
  const user = await db.collection("users").findOne({ refreshToken });
  console.log(user);
  if (!user) {
    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
    return res.status(204).json({ message: "Logged Out", status: 204 });
  }

  user.refreshToken = "";
  const loggedOutUser = await db
    .collection("users")
    .updateOne(
      { _id: new ObjectId(user._id) },
      { $set: { refreshToken: user.refreshToken } }
    );
  console.log(loggedOutUser);
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  return res.status(204).json({ message: "Logged Out", status: 204 });
});

module.exports = { handleLogout };
