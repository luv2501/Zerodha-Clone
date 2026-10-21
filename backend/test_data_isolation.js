const mongoose = require("mongoose");
const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const authRoute = require("./routes/authRoute");
const { authMiddleware } = require("./middleware/authMiddleware");
const { UserModel } = require("./models/UserModel");
const { HoldingsModel } = require("./models/HoldingsModel");
const { PositionsModel } = require("./models/PositionsModel");
const { OrdersModel } = require("./models/OrdersModel");

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use("/auth", authRoute);

// Wire protected routes identical to index.js
app.get("/allHoldings", authMiddleware, async (req, res) => {
  try {
    const userHoldings = await HoldingsModel.find({ userId: req.user._id });
    res.json(userHoldings);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch holdings" });
  }
});

app.get("/allPositions", authMiddleware, async (req, res) => {
  try {
    const userPositions = await PositionsModel.find({ userId: req.user._id });
    res.json(userPositions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch positions" });
  }
});

app.get("/allOrders", authMiddleware, async (req, res) => {
  try {
    const userOrders = await OrdersModel.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(userOrders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

app.post("/newOrder", authMiddleware, async (req, res) => {
  try {
    const { name, qty, price, mode } = req.body;
    const userId = req.user._id;

    if (!name || !qty || Number(qty) <= 0) {
      return res.status(400).json({ message: "Invalid stock instrument or quantity" });
    }

    const orderQty = Number(qty);
    const orderPrice = Number(price) || 0;
    const orderMode = (mode || "BUY").toUpperCase();

    if (orderMode === "SELL") {
      const holding = await HoldingsModel.findOne({ name, userId });
      if (!holding) {
        return res.status(400).json({ message: "You don't own this stock!" });
      }
      if (holding.qty < orderQty) {
        return res.status(400).json({
          message: `Insufficient shares! Available quantity: ${holding.qty}`,
        });
      }
      holding.qty -= orderQty;
      if (holding.qty === 0) {
        await HoldingsModel.deleteOne({ _id: holding._id, userId });
      } else {
        await holding.save();
      }
    } else if (orderMode === "BUY") {
      const existingHolding = await HoldingsModel.findOne({ name, userId });
      if (existingHolding) {
        const newQty = existingHolding.qty + orderQty;
        const totalCost = (existingHolding.avg * existingHolding.qty) + (orderPrice * orderQty);
        const newAvg = totalCost / newQty;
        existingHolding.qty = newQty;
        existingHolding.avg = Number(newAvg.toFixed(2));
        existingHolding.price = orderPrice > 0 ? orderPrice : existingHolding.price;
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
    res.status(500).json({ message: "Something went wrong while placing order!" });
  }
});

async function runIsolationTests() {
  console.log("=== STARTING USER-SPECIFIC DATA ISOLATION TESTS ===");
  await mongoose.connect(process.env.MONGO_URL);
  console.log("✓ Connected to MongoDB");

  const timestamp = Date.now();
  const userA_email = `traderA_${timestamp}@zerodha.test`;
  const userB_email = `traderB_${timestamp}@zerodha.test`;
  const password = "SecurePassword@123";

  // Step 1: Register User A
  console.log("\n[Step 1] Registering Trader A: " + userA_email);
  let res = await request(app).post("/auth/signup").send({
    name: "Trader Alpha",
    email: userA_email,
    password,
    confirmPassword: password,
  });
  const cookieA = res.headers["set-cookie"];
  const userA_id = res.body.user.id;
  console.log(`✓ Trader A registered (ID: ${userA_id})`);

  // Step 2: Register User B
  console.log("\n[Step 2] Registering Trader B: " + userB_email);
  res = await request(app).post("/auth/signup").send({
    name: "Trader Beta",
    email: userB_email,
    password,
    confirmPassword: password,
  });
  const cookieB = res.headers["set-cookie"];
  const userB_id = res.body.user.id;
  console.log(`✓ Trader B registered (ID: ${userB_id})`);

  // Step 3: Verify Initial Zero Data Isolation
  console.log("\n[Step 3] Checking fresh accounts have zero holdings/orders");
  let resA = await request(app).get("/allHoldings").set("Cookie", cookieA);
  let resB = await request(app).get("/allHoldings").set("Cookie", cookieB);
  if (resA.body.length !== 0 || resB.body.length !== 0) {
    throw new Error("Fresh accounts must start with 0 user holdings");
  }
  console.log("✓ Trader A holdings: 0, Trader B holdings: 0 (Isolated)");

  // Step 4: Trader A places BUY order for 10 RELIANCE at 2500
  console.log("\n[Step 4] Trader A buys 10 RELIANCE at ₹2500");
  res = await request(app).post("/newOrder").set("Cookie", cookieA).send({
    name: "RELIANCE",
    qty: 10,
    price: 2500,
    mode: "BUY",
  });
  if (res.status !== 201) throw new Error("Trader A buy order failed");
  console.log("✓ Trader A BUY order placed successfully");

  // Step 5: Verify Trader A owns 10 RELIANCE, but Trader B sees 0
  console.log("\n[Step 5] Verify Data Isolation between Trader A and Trader B");
  resA = await request(app).get("/allHoldings").set("Cookie", cookieA);
  resB = await request(app).get("/allHoldings").set("Cookie", cookieB);
  if (resA.body.length !== 1 || resA.body[0].name !== "RELIANCE" || resA.body[0].qty !== 10) {
    throw new Error("Trader A should have 10 RELIANCE");
  }
  if (resB.body.length !== 0) {
    throw new Error("SECURITY BREACH: Trader B saw Trader A's holdings!");
  }
  console.log("✓ Trader A sees 10 RELIANCE. Trader B sees 0 holdings! (100% ISOLATED)");

  // Step 6: Verify Trader B cannot see Trader A's Orders
  console.log("\n[Step 6] Verify Orders Isolation");
  const ordersA = await request(app).get("/allOrders").set("Cookie", cookieA);
  const ordersB = await request(app).get("/allOrders").set("Cookie", cookieB);
  if (ordersA.body.length !== 1 || ordersA.body[0].name !== "RELIANCE") {
    throw new Error("Trader A should see their 1 order");
  }
  if (ordersB.body.length !== 0) {
    throw new Error("SECURITY BREACH: Trader B saw Trader A's orders!");
  }
  console.log("✓ Trader A has 1 order. Trader B has 0 orders! (100% ISOLATED)");

  // Step 7: Trader B attempts to SELL RELIANCE (which Trader A owns)
  console.log("\n[Step 7] Trader B attempts unauthorized SELL of Trader A's RELIANCE");
  res = await request(app).post("/newOrder").set("Cookie", cookieB).send({
    name: "RELIANCE",
    qty: 5,
    price: 2500,
    mode: "SELL",
  });
  if (res.status === 400 && res.body.message === "You don't own this stock!") {
    console.log("✓ Blocked! Trader B cannot sell Trader A's stock: " + res.body.message);
  } else {
    throw new Error("SECURITY FAILURE: Trader B was not blocked from selling stock they don't own!");
  }

  // Step 8: Trader B buys 5 INFY at ₹1500
  console.log("\n[Step 8] Trader B buys 5 INFY at ₹1500");
  res = await request(app).post("/newOrder").set("Cookie", cookieB).send({
    name: "INFY",
    qty: 5,
    price: 1500,
    mode: "BUY",
  });
  if (res.status !== 201) throw new Error("Trader B buy failed");
  console.log("✓ Trader B BUY placed");

  // Step 9: Re-verify Cross-Account Data Isolation
  console.log("\n[Step 9] Re-verify mutual isolation");
  resA = await request(app).get("/allHoldings").set("Cookie", cookieA);
  resB = await request(app).get("/allHoldings").set("Cookie", cookieB);
  if (resA.body.length !== 1 || resA.body[0].name !== "RELIANCE") throw new Error("Trader A holding altered");
  if (resB.body.length !== 1 || resB.body[0].name !== "INFY") throw new Error("Trader B holding incorrect");
  console.log("✓ Trader A holdings: [RELIANCE: 10 shares]");
  console.log("✓ Trader B holdings: [INFY: 5 shares]");
  console.log("✓ Mutual cross-account isolation confirmed!");

  // Step 10: Trader A buys 10 more RELIANCE at ₹2700 (Average cost calculation)
  console.log("\n[Step 10] Trader A buys 10 more RELIANCE at ₹2700 (Avg calculation)");
  res = await request(app).post("/newOrder").set("Cookie", cookieA).send({
    name: "RELIANCE",
    qty: 10,
    price: 2700,
    mode: "BUY",
  });
  resA = await request(app).get("/allHoldings").set("Cookie", cookieA);
  const updatedHolding = resA.body[0];
  if (updatedHolding.qty !== 20 || updatedHolding.avg !== 2600) {
    throw new Error(`Expected qty 20 and avg 2600, got qty ${updatedHolding.qty} avg ${updatedHolding.avg}`);
  }
  console.log(`✓ Weighted Average Cost verified: Qty = ${updatedHolding.qty}, Avg = ₹${updatedHolding.avg}`);

  // Step 11: Trader A partial SELL (5 shares)
  console.log("\n[Step 11] Trader A sells 5 shares of RELIANCE");
  res = await request(app).post("/newOrder").set("Cookie", cookieA).send({
    name: "RELIANCE",
    qty: 5,
    price: 2650,
    mode: "SELL",
  });
  resA = await request(app).get("/allHoldings").set("Cookie", cookieA);
  if (resA.body[0].qty !== 15) throw new Error("Expected 15 shares remaining");
  console.log(`✓ Partial SELL verified: Available Qty is now ${resA.body[0].qty}`);

  // Step 12: Trader A attempts to sell more than available (20 shares)
  console.log("\n[Step 12] Trader A attempts to sell 20 shares (available: 15)");
  res = await request(app).post("/newOrder").set("Cookie", cookieA).send({
    name: "RELIANCE",
    qty: 20,
    price: 2650,
    mode: "SELL",
  });
  if (res.status === 400 && res.body.message.includes("Insufficient shares")) {
    console.log("✓ Blocked! " + res.body.message);
  } else {
    throw new Error("Failed to block overselling");
  }

  // Step 13: Trader A sells all remaining 15 shares
  console.log("\n[Step 13] Trader A sells remaining 15 shares of RELIANCE");
  res = await request(app).post("/newOrder").set("Cookie", cookieA).send({
    name: "RELIANCE",
    qty: 15,
    price: 2650,
    mode: "SELL",
  });
  resA = await request(app).get("/allHoldings").set("Cookie", cookieA);
  if (resA.body.length !== 0) throw new Error("Holding should be deleted when qty reaches 0");
  console.log("✓ When quantity reaches 0, holding is cleanly deleted from portfolio");

  // Step 14: Trader B's portfolio remains intact
  resB = await request(app).get("/allHoldings").set("Cookie", cookieB);
  if (resB.body.length !== 1 || resB.body[0].name !== "INFY" || resB.body[0].qty !== 5) {
    throw new Error("Trader B's holding was affected by Trader A's actions!");
  }
  console.log("✓ Trader B portfolio unaffected: Still holds 5 INFY");

  // Cleanup test users and test records
  console.log("\n[Cleanup] Cleaning up test accounts from database...");
  await HoldingsModel.deleteMany({ userId: { $in: [userA_id, userB_id] } });
  await OrdersModel.deleteMany({ userId: { $in: [userA_id, userB_id] } });
  await UserModel.deleteMany({ _id: { $in: [userA_id, userB_id] } });
  console.log("✓ Test records cleaned up safely");

  await mongoose.disconnect();
  console.log("\n=======================================================");
  console.log("ALL USER-SPECIFIC DATA ISOLATION TESTS PASSED 100%!");
  console.log("=======================================================");
}

runIsolationTests().catch((err) => {
  console.error("Test Error:", err);
  process.exit(1);
});

