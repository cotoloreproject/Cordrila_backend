const express = require("express");
const mongoose = require("mongoose");
const compression = require("compression");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(compression());

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: "Something went wrong!" });
});

// MongoDB connection
const dbName = "cordrillaDB";
const dbURI = process.env.MONGO_URL;

mongoose
  .connect(dbURI)
  .then(() => {
    console.log(`Connected to MongoDB database: ${dbName}`);
  })
  .catch((err) => {
    console.error("Connection error", err);
  });

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "cordrilaprimenow@gmail.com",
    pass: "jemu mhba cdbg sgqm",
  },
});

// Configure multer for file uploads to /tmp directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "/tmp");  // Use /tmp for temporary file storage
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// User Schema
const userSchema = new mongoose.Schema({
  "Emp/IC Code": {
    type: String,
    required: true,
    index: true,
  },
  "Employee Name": {
    type: String,
    required: true,
  },
  "Business Title": {
    type: String,
    required: true,
  },
  Category: {
    type: String,
    required: true,
  },
  "Station Code": {
    type: String,
    required: true,
  },
  "Location": {
    type: String,
    required: true,
  },
  "Mail ID": {
    type: String,
    required: true,
  },
  DOB: {
    type: String,
    required: true,
  },
  "PAN CARD": {
    type: String,
    required: true,
  },
  "Mobile Number": {
    type: Number,
    required: true,
  },
  Password: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("User", userSchema);

app.get("/", async (req, res) => {
  res.send("Express on Vercel");
});

// Routes
app.post("/users", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).send(user);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-__v");
    res.send(users);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

app.get("/users/byEmpIC/:empIC", async (req, res) => {
  try {
    const empIC = req.params.empIC;
    const user = await User.findOne({ "Emp/IC Code": empIC }).select("-__v");
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.send(user);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

app.put("/users/byEmpIC/:empIC", async (req, res) => {
  try {
    const empIC = req.params.empIC;
    const updatedUser = await User.findOneAndUpdate(
      { "Emp/IC Code": empIC },
      req.body,
      { new: true, runValidators: true }
    ).select("-__v");

    if (!updatedUser) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send(updatedUser);
  } catch (error) {
    console.error("Error:", error);
    res.status(400).send({ message: error.message });
  }
});

app.post("/send-email", async (req, res) => {
  const { subject, text } = req.body;

  const mailOptions = {
    from: "cordrilaprimenow@gmail.com",
    to: "hr@cordrila.com",
    subject: subject,
    text: text,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error:", error);
      return res.status(500).send({ message: error.toString() });
    }
    res.status(200).send({ message: "Email sent: " + info.response });
  });
});

// Route to handle job application with resume upload
app.post("/apply-job", upload.single("resume"), async (req, res) => {
  const { subject, text } = req.body;
  const resumePath = req.file.path;

  const mailOptions = {
    from: "cordrilaprimenow@gmail.com",
    to: "hr@cordrila.com",
    subject: subject,
    text: text,
    attachments: [
      {
        filename: req.file.originalname,
        path: resumePath,
      },
    ],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error:", error);
      return res.status(500).send({ message: error.toString() });
    }
    res.status(200).send({ message: "Email sent: " + info.response });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
