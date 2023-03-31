const { getDb } = require("../config/connectDB");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) {
    return res.sendStatus(401);
  }
  const refreshToken = cookies.jwt;

  const db = getDb();
  const user = await db.collection("users").findOne({ refreshToken });
  if (!user) return res.status(403).json({ message: "Forbidden", status: 401 });

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err || user.username !== decoded.username) {
      console.log("here");
      return res.status(403).json({ message: "Forbidden", status: 401 });
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
    res.json({ accessToken, username: user.username, roles: user.roles });
  });
});

module.exports = { handleRefreshToken };
