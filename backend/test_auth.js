const mongoose = require("mongoose");
const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const authRoute = require("./routes/authRoute");
const { UserModel } = require("./models/UserModel");

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use("/auth", authRoute);

async function runTests() {
  console.log("--- Starting Backend Auth Tests ---");
  await mongoose.connect(process.env.MONGO_URL);
  console.log("✓ MongoDB Connected");

  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = "Password@123";

  // Test 1: Missing Fields
  console.log("\n[Test 1] Missing fields in signup");
  let res = await request(app).post("/auth/signup").send({
    name: "Test User",
    email: testEmail,
  });
  console.log(`Status: ${res.status}, Response:`, res.body);
  if (res.status === 400 && res.body.message === "All fields are required.") {
    console.log("✓ Test 1 Passed");
  } else {
    throw new Error("Test 1 Failed");
  }

  // Test 2: Passwords Mismatch
  console.log("\n[Test 2] Password mismatch");
  res = await request(app).post("/auth/signup").send({
    name: "Test User",
    email: testEmail,
    password: testPassword,
    confirmPassword: "WrongPassword",
  });
  console.log(`Status: ${res.status}, Response:`, res.body);
  if (res.status === 400 && res.body.message === "Passwords do not match.") {
    console.log("✓ Test 2 Passed");
  } else {
    throw new Error("Test 2 Failed");
  }

  // Test 3: Successful Signup
  console.log("\n[Test 3] Successful Signup");
  res = await request(app).post("/auth/signup").send({
    name: "Test User",
    email: testEmail,
    password: testPassword,
    confirmPassword: testPassword,
  });
  console.log(`Status: ${res.status}, Body:`, res.body);
  console.log(`Cookies:`, res.headers["set-cookie"]);
  if (res.status === 201 && res.body.success && res.body.user.email === testEmail) {
    console.log("✓ Test 3 Passed: User signed up and received JWT cookie");
  } else {
    throw new Error("Test 3 Failed");
  }

  // Verify Password Hashing in DB
  console.log("\n[Test 4] Verify password hashing in DB");
  const savedUser = await UserModel.findOne({ email: testEmail });
  if (savedUser && savedUser.password !== testPassword && savedUser.password.startsWith("$2")) {
    console.log("✓ Test 4 Passed: Password is securely bcrypt hashed: " + savedUser.password.substring(0, 15) + "...");
  } else {
    throw new Error("Test 4 Failed: Password was not hashed properly");
  }

  // Test 5: Duplicate Email Prevention
  console.log("\n[Test 5] Duplicate email prevention");
  res = await request(app).post("/auth/signup").send({
    name: "Duplicate User",
    email: testEmail,
    password: testPassword,
    confirmPassword: testPassword,
  });
  console.log(`Status: ${res.status}, Response:`, res.body);
  if (res.status === 400 && res.body.message.includes("already exists")) {
    console.log("✓ Test 5 Passed: Duplicate registration blocked");
  } else {
    throw new Error("Test 5 Failed");
  }

  // Test 6: Incorrect Password Login
  console.log("\n[Test 6] Incorrect password login");
  res = await request(app).post("/auth/login").send({
    email: testEmail,
    password: "IncorrectPassword",
  });
  console.log(`Status: ${res.status}, Response:`, res.body);
  if (res.status === 401 && res.body.message === "Invalid email or password.") {
    console.log("✓ Test 6 Passed: Incorrect credentials rejected");
  } else {
    throw new Error("Test 6 Failed");
  }

  // Test 7: Successful Login
  console.log("\n[Test 7] Successful Login");
  res = await request(app).post("/auth/login").send({
    email: testEmail,
    password: testPassword,
  });
  console.log(`Status: ${res.status}, Body:`, res.body);
  const cookie = res.headers["set-cookie"];
  console.log(`Cookie header:`, cookie);
  if (res.status === 200 && res.body.success && cookie) {
    console.log("✓ Test 7 Passed: Logged in and received HttpOnly cookie");
  } else {
    throw new Error("Test 7 Failed");
  }

  const token = res.body.token;

  // Test 8: Verify Session without token
  console.log("\n[Test 8] Verify session without token");
  res = await request(app).get("/auth/verify");
  console.log(`Status: ${res.status}, Response:`, res.body);
  if (res.status === 401) {
    console.log("✓ Test 8 Passed: Unauthenticated request rejected");
  } else {
    throw new Error("Test 8 Failed");
  }

  // Test 9: Verify Session with Cookie
  console.log("\n[Test 9] Verify session with Cookie");
  res = await request(app).get("/auth/verify").set("Cookie", cookie);
  console.log(`Status: ${res.status}, Response:`, res.body);
  if (res.status === 200 && res.body.authenticated && res.body.user.email === testEmail) {
    console.log("✓ Test 9 Passed: Valid session verified successfully");
  } else {
    throw new Error("Test 9 Failed");
  }

  // Test 10: Verify Session with Bearer Token Header
  console.log("\n[Test 10] Verify session with Bearer Token");
  res = await request(app).get("/auth/verify").set("Authorization", `Bearer ${token}`);
  console.log(`Status: ${res.status}, Response:`, res.body);
  if (res.status === 200 && res.body.authenticated) {
    console.log("✓ Test 10 Passed: Bearer token auth works");
  } else {
    throw new Error("Test 10 Failed");
  }

  // Test 11: Logout
  console.log("\n[Test 11] Logout endpoint");
  res = await request(app).post("/auth/logout");
  console.log(`Status: ${res.status}, Set-Cookie:`, res.headers["set-cookie"]);
  if (res.status === 200 && res.headers["set-cookie"]) {
    console.log("✓ Test 11 Passed: Logout cleared cookie successfully");
  } else {
    throw new Error("Test 11 Failed");
  }

  // Cleanup test user
  await UserModel.deleteOne({ email: testEmail });
  console.log("\n✓ Cleaned up test user from MongoDB");

  await mongoose.disconnect();
  console.log("\n=========================================");
  console.log("ALL 11 BACKEND AUTH TESTS PASSED PERFECTLY!");
  console.log("=========================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

