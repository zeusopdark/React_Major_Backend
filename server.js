require('dotenv').config()
const express = require("express")
const app = express();
const connectDB = require('./config/dbConn');
const mongoose = require('mongoose');
const errorHandler = require('./middlewares/error')
const product = require("./routes/productRoutes")
const user = require("./routes/userRoutes")
const order = require("./routes/orderRoutes")
const { logger } = require('./middlewares/logger')
const cookieParser = require("cookie-parser")
const cors = require("cors");
const cloudinary = require("cloudinary")
const fileUpload = require("express-fileupload");
const payment = require("./routes/paymentRoute")
const path = require("path");
connectDB()
app.use(cors());
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


app.use(express.json())
app.use(cookieParser());
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));
app.use(logger)
// app.use(express.static(path.join(__dirname, "../Frontend/myapp/build")))

// app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "../Frontend/myapp/build/index.html"));
// });

//Route 
app.use("/api/v1", product)
app.use("/api/v1", user)
app.use("/api/v1", order);
app.use("/api/v1", payment);

//Middleware for error
app.use(errorHandler);



mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB')
    app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`))
});
mongoose.connection.on('error', err => {
    console.log(err);
});



