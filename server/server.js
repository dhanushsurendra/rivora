const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes.js');
const sessionRoutes = require('./routes/sessionRoutes.js');
const mongoose = require('mongoose');
const { socketHandlers } = require("./sockets/index.js");

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true               // Allow cookies
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes)

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:5713", // Adjust this to your frontend URL
    methods: ["GET", "POST"]
  }
});

socketHandlers(io)

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('MongoDB connected');
  // Start your Express server here
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});



const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
