const express= require('express');
const app= express();
const mongoose = require("mongoose");
require('./config/db')
const chapterRouter = require('./routes/chapter');


require('dotenv').config()


const connectDB=require("./config/db")
const cookieParser=require('cookie-parser');


const port=process.env.PORT;

app.use(express.json());
app.use(cookieParser());


const isVercel = !!process.env.VERCEL; 



app.use(async (req, res, next) => {
  if (mongoose.connection.readyState === 0) {
    try {
      await connectDB();
    } catch (err) {
      console.error("Database Connection Failed:", err);
      return res.status(500).json({ error: "Database Connection Failed" });
    }
  }
  next();
});


app.use(express.json()); 

app.get("/", (req, res) => {
  res.send("All is Well!");
});

app.use('/', chapterRouter);


if (isVercel) {
  module.exports = async (req, res) => {
    try {
      if (mongoose.connection.readyState === 0) await connectDB();
      return app(req, res);
    } catch (err) {
      console.error("Vercel API Error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
} else {

  connectDB()
    .then(() => {
      console.log("MongoDB Connected Successfully");
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    })
    .catch((err) => {
      console.error("Cannot connect to DB:", err);
      process.exit(1);
    });
}











