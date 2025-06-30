// server/sockets/socketHandlers.js

/**
 * Initializes the Socket.IO event handlers for session-based rooms.
 * This function should be called with the 'io' instance from your main app.
 * @param {SocketIO.Server} io The Socket.IO server instance.
 */
function socketHandlers(io) {
    io.on("connection", socket => {
        console.log(`[${socket.id}] New user connected.`);

        // --- Event: join-room ---
        // Expects the client to send an object with sessionId AND role
        socket.on("join-room", ({ sessionId, role }) => { // <--- MODIFIED: Accepts {sessionId, role}
            if (!sessionId) {
                console.warn(`[${socket.id}] Attempted to join room without a sessionId.`);
                socket.emit("error", "Session ID is required to join a room.");
                return;
            }

            // Basic validation for the role
            if (!role || (role !== 'host' && role !== 'guest')) {
                console.warn(`[${socket.id}] Attempted to join room ${sessionId} with an invalid or missing role: ${role}. Rejecting.`);
                socket.emit("error", "Invalid or missing role. Must be 'host' or 'guest'.");
                socket.disconnect(true); // Disconnect immediately if role is invalid
                return;
            }

            const room = io.sockets.adapter.rooms.get(sessionId);
            const numClients = room ? room.size : 0;

            console.log(`[${socket.id}] (Client-declared Role: ${role}) attempting to join room: ${sessionId}. Current clients in room: ${numClients}`);

            // Logic to enforce one host and one guest
            let hostExists = false;
            let guestExists = false;

            if (room) {
                for (const socketIdInRoom of room) {
                    const clientInRoom = io.sockets.sockets.get(socketIdInRoom);
                    if (clientInRoom && clientInRoom.data.role === 'host') {
                        hostExists = true;
                    }
                    if (clientInRoom && clientInRoom.data.role === 'guest') {
                        guestExists = true;
                    }
                }
            }

            // Check if the room is already full (2 clients)
            if (numClients >= 2) {
                console.log(`[${socket.id}] Room ${sessionId} is already full (${numClients} clients). Notifying client.`);
                socket.emit("room-full");
                // Do NOT join the room
                return;
            }

            // Check specific role conflicts
            if (role === 'host' && hostExists) {
                console.warn(`[${socket.id}] A host already exists in room ${sessionId}. Cannot join as host. Notifying client.`);
                socket.emit("room-full", "A host already exists in this session."); // Re-using room-full or create 'role-taken'
                // Or you could emit a specific error like 'role-taken'
                // socket.emit("role-taken", "Host role is already taken in this session.");
                return;
            }

            if (role === 'guest' && guestExists) {
                console.warn(`[${socket.id}] A guest already exists in room ${sessionId}. Cannot join as guest. Notifying client.`);
                socket.emit("room-full", "A guest already exists in this session."); // Re-using room-full
                return;
            }

            // If numClients is 1 and the incoming role matches the existing role (e.g., two hosts or two guests trying to join)
            if (numClients === 1) {
                const existingUserSocketId = Array.from(room).values().next().value;
                const existingUserSocket = io.sockets.sockets.get(existingUserSocketId);

                if (existingUserSocket && existingUserSocket.data.role === role) {
                    console.warn(`[${socket.id}] Cannot join as ${role}. A ${role} already exists in room ${sessionId}.`);
                    socket.emit("room-full", `A ${role} already exists in this session.`);
                    return;
                }
            }


            // Store the client-declared role and sessionId on the socket object
            socket.data.role = role;
            socket.data.sessionId = sessionId;

            // Join the Socket.IO room
            socket.join(sessionId);
            console.log(`[${socket.id}] (Client-declared Role: ${socket.data.role}) joined room: ${sessionId}.`);


            // Re-check clients in the room after joining
            const updatedRoom = io.sockets.adapter.rooms.get(sessionId);
            const updatedNumClients = updatedRoom ? updatedRoom.size : 0;
            console.log(`Clients in room ${sessionId} after ${socket.id} joined: ${updatedNumClients}`);

            // Find the other user in this specific room (if any)
            let otherUserSocketId = null;
            if (updatedNumClients === 2) {
                otherUserSocketId = Array.from(updatedRoom).find(id => id !== socket.id);
            }

            if (otherUserSocketId) {
                const otherUserSocket = io.sockets.sockets.get(otherUserSocketId);
                if (otherUserSocket) {
                    // Tell the new user about the existing user (with their role)
                    socket.emit("other-user", { id: otherUserSocket.id, role: otherUserSocket.data.role });
                    console.log(`[${socket.id}] emitted 'other-user' (${otherUserSocket.id}, Role: ${otherUserSocket.data.role})`);

                    // Tell the existing user about the new user (with their role)
                    otherUserSocket.emit("user-joined", { id: socket.id, role: socket.data.role });
                    console.log(`[${otherUserSocket.id}] emitted 'user-joined' (${socket.id}, Role: ${socket.data.role})`);
                } else {
                    console.warn(`[${socket.id}] Stale other user socket ${otherUserSocketId} found in room ${sessionId}. Removing.`);
                    updatedRoom.delete(otherUserSocketId); // Manually remove stale
                    console.log(`Room ${sessionId} size after stale cleanup: ${updatedRoom.size}`);
                }
            } else {
                console.log(`[${socket.id}] No other user found yet in room ${sessionId}. Waiting.`);
            }
        });

        // --- Event: signal ---
        socket.on("signal", ({ userToSignal, signal, from }) => {
            if (from !== socket.id) {
                console.warn(`[${socket.id}] Received signal with mismatched 'from' ID: ${from}`);
                return;
            }

            const targetSocket = io.sockets.sockets.get(userToSignal);

            if (targetSocket) {
                const senderSessionId = socket.data.sessionId;
                const targetSessionId = targetSocket.data.sessionId;

                if (senderSessionId && senderSessionId === targetSessionId) {
                    targetSocket.emit("signal", { signal, from });
                    console.log(`[${socket.id}] Signal forwarded to ${userToSignal} in room ${senderSessionId}.`);
                } else {
                    console.warn(`[${socket.id}] Target socket ${userToSignal} is not in the same session room (${senderSessionId}) as sender.`);
                }
            } else {
                console.warn(`[${socket.id}] Target socket ${userToSignal} not found for signal. It might have disconnected.`);
            }
        });

        // --- Event: leave-room ---
        socket.on("leave-room", () => {
            console.log(`[${socket.id}] received 'leave-room' event.`);
            const sessionIdToLeave = socket.data.sessionId;

            if (sessionIdToLeave) {
                socket.leave(sessionIdToLeave);
                console.log(`[${socket.id}] left room: ${sessionIdToLeave}.`);

                const remainingClients = io.sockets.adapter.rooms.get(sessionIdToLeave);
                if (remainingClients && remainingClients.size === 1) {
                    const otherUserSocketId = Array.from(remainingClients).pop();
                    if (otherUserSocketId) {
                        io.to(otherUserSocketId).emit("user-left", socket.id);
                        console.log(`[${otherUserSocketId}] notified that ${socket.id} left room ${sessionIdToLeave}.`);
                    }
                } else if (remainingClients && remainingClients.size === 0) {
                    console.log(`Room ${sessionIdToLeave} is now empty.`);
                }
                delete socket.data.sessionId;
                delete socket.data.role;
            } else {
                console.warn(`[${socket.id}] 'leave-room' called, but no sessionId stored on socket.`);
            }
        });

        // --- Event: disconnect ---
        socket.on("disconnect", (reason) => {
            console.log(`[${socket.id}] User disconnected. Reason: ${reason}`);
            const disconnectedSessionId = socket.data.sessionId;

            if (disconnectedSessionId) {
                setTimeout(() => {
                    const roomAfterDisconnect = io.sockets.adapter.rooms.get(disconnectedSessionId);
                    if (roomAfterDisconnect && roomAfterDisconnect.size === 1) {
                        const otherUserSocketId = Array.from(roomAfterDisconnect).pop();
                        if (otherUserSocketId) {
                            io.to(otherUserSocketId).emit("user-left", socket.id);
                            console.log(`[${otherUserSocketId}] notified that ${socket.id} disconnected from room ${disconnectedSessionId}.`);
                        }
                    } else if (roomAfterDisconnect && roomAfterDisconnect.size === 0) {
                        console.log(`Room ${disconnectedSessionId} is now empty due to disconnect.`);
                    }
                }, 100);
            } else {
                console.log(`[${socket.id}] Disconnected from a room without a stored sessionId.`);
            }
            delete socket.data.sessionId;
            delete socket.data.role;
        });
    });
}

module.exports = {
    socketHandlers
};