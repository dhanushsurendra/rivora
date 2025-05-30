const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes.js');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true               // Allow cookies
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:5713", // Adjust this to your frontend URL
    methods: ["GET", "POST"]
  }
});

// Use a Set to store connected user IDs for efficient lookup and uniqueness
const connectedUsers = new Set();
const MAX_USERS = 2; // Define the maximum number of users allowed for active peering

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('MongoDB connected');
  // Start your Express server here
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});

io.on("connection", socket => {
  console.log(`[${socket.id}] New user connected.`);
  
  // Removed the immediate "room full" check here.
  // This allows a refreshing user's new socket to connect.
  // The 'join-room' logic and the natural disconnect of the old socket
  // will manage the active 1:1 connection.

  connectedUsers.add(socket.id); // Add the new user to the set
  console.log(`[${socket.id}] User added. Current users: ${connectedUsers.size}`);

  // Inform the client if the room is already full *after* they connect,
  // but before they try to join a room. This is a softer rejection.
  // This check is now primarily for new users trying to join an already active 2-person call.
  if (connectedUsers.size > MAX_USERS) {
    console.log(`[${socket.id}] Room is already actively full. Notifying client.`);
    socket.emit("room-full"); // Tell the client the room is full
    // We don't immediately disconnect here, relying on the client to handle 'room-full'
    // by stopping its media and potentially disconnecting itself.
    // This allows for a smoother refresh experience if the old socket hasn't disconnected yet.
  }

  socket.on("join-room", () => {
    console.log(`[${socket.id}] received 'join-room' event. Current users: ${connectedUsers.size}`);

    // Find another user (excluding self) to connect with
    let otherUserSocketId = null;
    for (const userId of connectedUsers) {
      if (userId !== socket.id) {
        otherUserSocketId = userId;
        break;
      }
    }

    if (otherUserSocketId) {
      console.log(`[${socket.id}] Found other user: ${otherUserSocketId}`);
      const otherUserSocket = io.sockets.sockets.get(otherUserSocketId);
      if (otherUserSocket) {
        socket.emit("other-user", otherUserSocket.id); // Tell new user about existing user
        otherUserSocket.emit("user-joined", socket.id); // Tell existing user about new user
      } else {
        // This case indicates a stale ID in connectedUsers, remove it.
        console.warn(`[${socket.id}] Found stale ID ${otherUserSocketId} in set. Removing.`);
        connectedUsers.delete(otherUserSocketId);
        // Re-attempt to find another user if any
        let newOtherUserSocketId = null;
        for (const userId of connectedUsers) {
          if (userId !== socket.id) {
            newOtherUserSocketId = userId;
            break;
          }
        }
        if (newOtherUserSocketId) {
            const newOtherUserSocket = io.sockets.sockets.get(newOtherUserSocketId);
            if (newOtherUserSocket) {
                console.log(`[${socket.id}] Found new other user after cleanup: ${newOtherUserSocket.id}`);
                socket.emit("other-user", newOtherUserSocket.id);
                newOtherUserSocket.emit("user-joined", socket.id);
            }
        } else {
            console.log(`[${socket.id}] No other user found after cleanup. Waiting.`);
        }
      }
    } else {
      console.log(`[${socket.id}] No other user found yet. Waiting for a second user.`);
    }
  });

  socket.on("signal", ({ userToSignal, signal, from }) => {
    console.log(`[${socket.id}] received 'signal' for ${userToSignal} from ${from}.`);
    const targetSocket = io.sockets.sockets.get(userToSignal);
    if (targetSocket) {
      targetSocket.emit("signal", { signal, from });
      console.log(`[${socket.id}] Signal forwarded to ${userToSignal}.`);
    } else {
      console.warn(`[${socket.id}] Target socket ${userToSignal} not found for signal. It might have disconnected.`);
      // Optional: Inform the sender that the target is gone
      // socket.emit("target-disconnected", userToSignal);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`[${socket.id}] User disconnected. Reason: ${reason}`);
    connectedUsers.delete(socket.id); // Remove the disconnected user from the set
    console.log(`Current connected users after disconnect: ${connectedUsers.size}`);

    // If a user disconnects, and there was another user, they might need to be notified
    // if the peer connection doesn't automatically close. In a 1:1, simple-peer handles this.
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
