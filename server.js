require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const PORT = process.env.PORT || 3500;

const { logger, logEvents } = require("./midleware/logger");
const errorHandler = require("./midleware/errorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const { connectToDb, getDb } = require("./config/connectDB");
const credentials = require("./midleware/credentials");
const verifyJWT = require("./midleware/verifyJWT");

app.use(logger);

app.use(credentials);

app.use(cors(corsOptions));

app.use(express.json());

app.use(cookieParser());

app.use("/register", require("./routes/register"));
app.use("/auth", require("./routes/auth"));
app.use("/refresh", require("./routes/refresh"));
app.use("/logout", require("./routes/logout"));

app.use("/categories", require("./routes/categoryRoutes"));

app.use(verifyJWT);
app.use("/users", require("./routes/userRoutes"));
app.use("/categories-private", require("./routes/categoryPrivateRoutes"));
app.use("/categories-subs", require("./routes/subCategoryRoutes"));
app.use("/categories-item", require("./routes/itemRoutes"));
app.use("/order", require("./routes/orderRoutes"));

app.use(errorHandler);
connectToDb((err) => {
  if (!err) {
    app.listen(PORT, (err) => {
      if (err) console.log(err);
      console.log("Running");
    });
  } else {
    console.log(err);
  }
});
