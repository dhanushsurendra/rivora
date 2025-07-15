const express = require("express");
const http = require("http");
const cors = require("cors");

const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes.js');
const sessionRoutes = require('./routes/sessionRoutes.js');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
app.use(cors({
  origin: '*', 
  credentials: true               
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes)

const server = http.createServer(app);

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('MongoDB connected');
  // Start your Express server here
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
