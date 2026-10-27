
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const axios = require("axios");

const { HoldingsModel } = require("./models/HoldingsModel");
const { PositionsModel } = require("./models/PositionsModel");
const { OrdersModel } = require("./models/OrdersModel");
const authRoute = require("./routes/authRoute");
const { authMiddleware } = require("./middleware/authMiddleware");

const PORT = process.env.PORT || 3002;
const uri = process.env.MONGO_URL;

const app = express();

// Allowed frontend and dashboard origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.FRONTEND_URL,
  process.env.DASHBOARD_URL,
].filter(Boolean);

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.json());
app.use(cookieParser());

// Authentication routes
app.use("/auth", authRoute);

// Live stock quotes API
app.get("/stock/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol;

    const response = await axios.get(
      "https://www.alphavantage.co/query",
      {
        params: {
          function: "GLOBAL_QUOTE",
          symbol: `${symbol}.BSE`,
          apikey: process.env.ALPHA_VANTAGE_API_KEY,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Stock API error:", error.message);
    res.status(500).json({ message: "Stock API failed" });
  }
});

// User-specific holdings
app.get("/allHoldings", authMiddleware, async (req, res) => {
  try {
    const userHoldings = await HoldingsModel.find({
      userId: req.user._id,
    });

    res.json(userHoldings);
  } catch (error) {
    console.error("Holdings fetch error:", error);
    res.status(500).json({
      message: "Failed to fetch holdings",
    });
  }
});

// User-specific positions
app.get("/allPositions", authMiddleware, async (req, res) => {
  try {
    const userPositions = await PositionsModel.find({
      userId: req.user._id,
    });

    res.json(userPositions);
  } catch (error) {
    console.error("Positions fetch error:", error);
    res.status(500).json({
      message: "Failed to fetch positions",
    });
  }
});

// User-specific orders
app.get("/allOrders", authMiddleware, async (req, res) => {
  try {
    const userOrders = await OrdersModel.find({
      userId: req.user._id,
    }).sort({
      createdAt: -1,
    });

    res.json(userOrders);
  } catch (error) {
    console.error("Orders fetch error:", error);
    res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
});

// User-specific order execution
app.post("/newOrder", authMiddleware, async (req, res) => {
  try {
    const { name, qty, price, mode } = req.body;
    const userId = req.user._id;

    if (!name || !qty || Number(qty) <= 0) {
      return res.status(400).json({
        message: "Invalid stock instrument or quantity",
      });
    }

    const orderQty = Number(qty);
    const orderPrice = Number(price) || 0;
    const orderMode = (mode || "BUY").toUpperCase();

    if (orderMode === "SELL") {
      const holding = await HoldingsModel.findOne({
        name,
        userId,
      });

      if (!holding) {
        return res.status(400).json({
          message: "You don't own this stock!",
        });
      }

      if (holding.qty < orderQty) {
        return res.status(400).json({
          message: `Insufficient shares! Available quantity: ${holding.qty}`,
        });
      }

      holding.qty -= orderQty;

      if (holding.qty === 0) {
        await HoldingsModel.deleteOne({
          _id: holding._id,
          userId,
        });
      } else {
        await holding.save();
      }
    } else if (orderMode === "BUY") {
      const existingHolding = await HoldingsModel.findOne({
        name,
        userId,
      });

      if (existingHolding) {
        const newQty = existingHolding.qty + orderQty;

        const totalCost =
          existingHolding.avg * existingHolding.qty +
          orderPrice * orderQty;

        const newAvg = totalCost / newQty;

        existingHolding.qty = newQty;
        existingHolding.avg = Number(newAvg.toFixed(2));

        existingHolding.price =
          orderPrice > 0
            ? orderPrice
            : existingHolding.price;

        await existingHolding.save();
      } else {
        const newHolding = new HoldingsModel({
          userId,
          name,
          qty: orderQty,
          avg: orderPrice,
          price: orderPrice,
          net: "+0.00%",
          day: "+0.00%",
        });

        await newHolding.save();
      }
    } else {
      return res.status(400).json({
        message: "Invalid order mode",
      });
    }

    const newOrder = new OrdersModel({
      userId,
      name,
      qty: orderQty,
      price: orderPrice,
      mode: orderMode,
      createdAt: new Date(),
    });

    await newOrder.save();

    res.status(201).json({
      message: `${orderMode} order placed successfully!`,
      order: newOrder,
    });
  } catch (error) {
    console.error("Order processing error:", error);

    res.status(500).json({
      message: "Something went wrong while placing order!",
    });
  }
});

// MongoDB connection and server startup
mongoose
  .connect(uri)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`App started on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
