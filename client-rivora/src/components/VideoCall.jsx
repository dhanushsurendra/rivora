import React, { useRef, useEffect, useState, useCallback } from "react";
import Peer from "simple-peer";
import io from "socket.io-client";

// Socket connection should be outside the component to avoid re-creating on re-renders
// IMPORTANT: Replace "http://localhost:5000" with your computer's local IP address
// if testing on different devices (e.g., "http://192.168.1.100:5000")
const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});

// Define STUN servers for WebRTC NAT traversal
// These are public STUN servers provided by Google.
// These are crucial for WebRTC to work across different networks (not just localhost).
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  // Add TURN servers here if STUN is not sufficient for your network
  // { urls: 'turn:YOUR_TURN_SERVER_IP:PORT', username: 'YOUR_USERNAME', credential: 'YOUR_PASSWORD' }
];

const VideoCall = () => {
  const [stream, setStream] = useState(null); // Stores the local media stream
  const [otherUserId, setOtherUserId] = useState(null); // Stores the ID of the other connected user
  const [roomFull, setRoomFull] = useState(false); // NEW: State to indicate if the room is full

  const userVideo = useRef(); // Reference to the video element for the local stream
  const peerVideo = useRef(); // Reference to the video element for the remote stream
  const peerRef = useRef(); // Stores the simple-peer instance for the WebRTC connection

  // Function to create a new peer connection as the initiator
  // Memoized with useCallback to prevent unnecessary re-creation on renders
  const createPeer = useCallback((userToSignal, callerId, currentStream) => {
    console.log(`[createPeer] Creating peer as initiator to signal ${userToSignal} with stream:`, currentStream);
    const peer = new Peer({
      initiator: true, // This peer will send the initial offer
      trickle: false, // Send all ICE candidates in one go (simpler signaling)
      stream: currentStream, // Attach the local media stream to the peer connection
      iceServers: iceServers, // Include STUN/TURN servers
    });

    // Event listener for when the peer generates a WebRTC signal (offer/answer/ICE candidate)
    peer.on("signal", signal => {
      console.log("[createPeer] Emitting 'signal' (initiator) to server. Signal type:", signal.type);
      // Send the signal to the other user via the signaling server
      socket.emit("signal", { userToSignal, signal, from: callerId });
    });

    // Event listener for when the remote stream becomes available
    peer.on("stream", remoteStream => {
      console.log("[createPeer] Received remote stream (initiator side).");
      // Attach the remote stream to the peer's video element
      if (peerVideo.current) {
        peerVideo.current.srcObject = remoteStream;
      }
    });

    // Event listener for when the peer connection closes
    peer.on("close", () => {
      console.log("[createPeer] Peer connection closed (initiator side).");
      setOtherUserId(null); // Clear the other user ID
      peerRef.current = null; // Clear the peer reference
    });

    // Event listener for peer connection errors
    peer.on("error", err => {
      console.error("[createPeer] Peer error (initiator):", err);
      alert(`Peer connection error (initiator): ${err.message}`);
    });

    return peer;
  }, [setOtherUserId]); // Dependencies for useCallback

  // Function to add a peer connection as the receiver
  // Memoized with useCallback to prevent unnecessary re-creation on renders
  const addPeer = useCallback((incomingSignal, currentStream, fromId) => {
    console.log(`[addPeer] Adding peer as receiver from ${fromId} with stream:`, currentStream);
    console.log(`[addPeer] Incoming signal type for receiver: ${incomingSignal.type || 'unknown'}`);

    const peer = new Peer({
      initiator: false, // This peer will receive the initial offer
      trickle: false, // Send all ICE candidates in one go
      stream: currentStream, // Attach the local media stream
      iceServers: iceServers, // Include STUN/TURN servers
    });

    // Event listener for when the peer generates a WebRTC signal (answer/ICE candidate)
    peer.on("signal", signal => {
      console.log("[addPeer] Emitting 'signal' (receiver) to server. Signal type:", signal.type);
      // Send the signal back to the initiator
      socket.emit("signal", { userToSignal: fromId, signal, from: socket.id });
    });

    // Event listener for when the remote stream becomes available
    peer.on("stream", remoteStream => {
      console.log("[addPeer] Received remote stream (receiver side).");
      // Attach the remote stream to the peer's video element
      if (peerVideo.current) {
        peerVideo.current.srcObject = remoteStream;
      }
    });

    // Event listener for when the peer connection closes
    peer.on("close", () => {
      console.log("[addPeer] Peer connection closed (receiver side).");
      setOtherUserId(null); // Clear the other user ID
      peerRef.current = null; // Clear the peer reference
    });

    // Event listener for peer connection errors
    peer.on("error", err => {
      console.error("[addPeer] Peer error (receiver):", err);
      alert(`Peer connection error (receiver): ${err.message}`);
    });

    // Apply the incoming signal to the peer connection
    try {
        console.log(`[addPeer] Calling peer.signal() with type: ${incomingSignal.type}`);
        peer.signal(incomingSignal);
    } catch (e) {
        console.error("[addPeer] Error during peer.signal():", e);
        alert(`Error processing signal: ${e.message}`);
    }

    return peer;
  }, [setOtherUserId]); // Dependencies for useCallback

  // Effect to get user media (camera and microphone access)
  useEffect(() => {
    console.log("[useEffect-getUserMedia] Requesting user media...");
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(currentStream => {
        setStream(currentStream); // Set the local stream in state
        if (userVideo.current) {
          userVideo.current.srcObject = currentStream; // Display local stream in user's video element
        }
        console.log("[useEffect-getUserMedia] Got user media successfully.");
        // Emit join-room AFTER stream is set, so the server knows we're ready
        socket.emit("join-room");
        console.log("Emitted 'join-room' event to signaling server.");
      })
      .catch(err => {
        console.error("[useEffect-getUserMedia] Failed to get media:", err);
        // Display an error message using the custom modal
        alert("Please allow camera and microphone access to use this video call. Error: " + err.name);
      });
  }, []); // This effect runs only once when the component mounts

  // Effect for Socket.IO event listeners and managing peer connection state
  // This effect depends on 'stream', 'createPeer', and 'addPeer' to ensure
  // that the callbacks always have access to the latest values.
  useEffect(() => {
    console.log("[useEffect-socket] Setting up socket listeners.");

    // Socket 'connect' event: emitted when the client successfully connects to the server
    const onConnect = () => {
      console.log("[socket.on.connect] Socket connected with id:", socket.id);
      // 'join-room' is now emitted after stream is acquired in the other useEffect
    };

    // Socket 'connect_error' event: handle connection failures
    const onConnectError = (err) => {
      console.error("[socket.on.connect_error] Connection error:", err);
      alert("Could not connect to the signaling server. Please ensure the server is running.");
    };

    // Socket 'other-user' event: received when another user is already in the room
    const onOtherUser = (userId) => {
      console.log("[socket.on.other-user] Received 'other-user':", userId);
      setOtherUserId(userId); // Update state, which will trigger the peer initiation logic
      // If we are the initiator (smaller ID) and stream is ready, create peer
      if (stream && !peerRef.current && socket.id < userId) {
        console.log(`[socket.on.other-user] Initiating peer with ${userId} because my ID (${socket.id}) is smaller.`);
        const peer = createPeer(userId, socket.id, stream);
        peerRef.current = peer;
      } else if (stream && !peerRef.current && socket.id > userId) {
        console.log(`[socket.on.other-user] Waiting for ${userId} to initiate peer (my ID ${socket.id} is larger).`);
      }
    };

    // Socket 'user-joined' event: received when a new user joins the room
    const onUserJoined = (userId) => {
      console.log("[socket.on.user-joined] Received 'user-joined':", userId);
      setOtherUserId(userId); // Update state, which will trigger the peer initiation logic
      // If we are the initiator (smaller ID) and stream is ready, create peer
      if (stream && !peerRef.current && socket.id < userId) {
        console.log(`[socket.on.user-joined] Initiating peer with ${userId} because my ID (${socket.id}) is smaller.`);
        const peer = createPeer(userId, socket.id, stream);
        peerRef.current = peer;
      } else if (stream && !peerRef.current && socket.id > userId) {
        console.log(`[socket.on.user-joined] Waiting for ${userId} to initiate peer (my ID ${socket.id} is larger).`);
      }
    };

    // NEW: Socket 'room-full' event: received when trying to join a full room
    const onRoomFull = () => {
      console.warn("[socket.on.room-full] Room is full. Cannot join.");
      setRoomFull(true); // Set state to indicate room is full
      if (peerRef.current) {
        peerRef.current.destroy(); // Destroy any existing peer connection
        peerRef.current = null;
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop()); // Stop local media stream
        setStream(null);
      }
      setOtherUserId(null);
      alert("The video call room is currently full (2 users). Please try again later.");
    };

    // Socket 'signal' event: received when a WebRTC signal (offer, answer, ICE candidate) comes from another user
    const onSignal = ({ signal, from }) => {
      console.log(`[socket.on.signal] Received 'signal' from: ${from}. Signal type: ${signal.type || 'unknown'}`);
      // Prevent processing signals from self (can happen if server broadcasts to all)
      if (from === socket.id) {
        console.log("[socket.on.signal] Ignoring signal from self.");
        return;
      }

      // If no peer connection exists yet AND the signal is an 'offer' AND local stream is available
      // This ensures we only create a new peer as a receiver when an offer comes in.
      if (!peerRef.current && signal.type === 'offer' && stream) {
        console.log("[socket.on.signal] Creating new peer as receiver based on incoming OFFER.");
        const peer = addPeer(signal, stream, from);
        peerRef.current = peer;
      } else if (peerRef.current) {
        // If a peer connection already exists, apply the signal to it
        console.log("[socket.on.signal] Signaling existing peer with incoming signal.");
        try {
            peerRef.current.signal(signal);
        } catch (e) {
            console.error("[socket.on.signal] Error signaling existing peer:", e);
            alert(`Error signaling existing peer: ${e.message}`);
        }
      } else {
        console.warn("[socket.on.signal] Ignoring signal. No peer exists or stream not ready, or not an offer to initiate.");
      }
    };

    // Socket 'disconnect' event: handle disconnection from the signaling server
    const onDisconnect = (reason) => {
      console.warn("[socket.on.disconnect] Socket disconnected:", reason);
      if (peerRef.current) {
        peerRef.current.destroy(); // Clean up the WebRTC peer connection
        peerRef.current = null;
      }
      setOtherUserId(null); // Clear the other user ID
      // Only show disconnect alert if not already told room is full
      if (!roomFull) {
        alert("Disconnected from the signaling server.");
      }
    };

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("other-user", onOtherUser);
    socket.on("user-joined", onUserJoined);
    socket.on("room-full", onRoomFull); // NEW: Listen for room-full event
    socket.on("signal", onSignal); // Direct reference to onSignal
    socket.on("disconnect", onDisconnect);

    // Cleanup function: runs when the component unmounts or dependencies change
    return () => {
      console.log("[useEffect-socket] Cleaning up socket listeners.");
      // Remove all specific socket event listeners
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("other-user", onOtherUser);
      socket.off("user-joined", onUserJoined);
      socket.off("room-full", onRoomFull); // NEW: Clean up room-full listener
      socket.off("signal", onSignal);
      socket.off("disconnect", onDisconnect);
      // Destroy the peer connection if it still exists
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [stream, createPeer, addPeer, socket.id, roomFull]); // Dependencies: stream, memoized peer functions, socket.id, and roomFull

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "30px" }}>
      <div style={{ display: "flex", justifyContent: "space-around", width: "90%" }}>
        {roomFull ? ( // NEW: Display room full message if true
          <div style={{
            width: "90%", // Takes full width when room is full
            height: "300px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            border: "2px solid red",
            borderRadius: "8px",
            fontSize: "24px",
            color: "red",
            textAlign: "center",
            padding: "20px",
            fontWeight: "bold"
          }}>
            Room is Full! Please try again later.
          </div>
        ) : (
          <>
            <video ref={userVideo} autoPlay muted playsInline style={{ width: "45%", border: '1px solid blue' }} />
            {otherUserId ? (
              <video ref={peerVideo} autoPlay playsInline style={{ width: "45%", border: '1px solid green' }} />
            ) : (
              <div style={{
                width: "45%",
                height: "300px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                border: "2px dashed gray",
                borderRadius: "8px",
                fontSize: "18px",
                color: "gray",
                textAlign: "center",
                padding: "20px"
              }}>
                Waiting for another user to join...
              </div>
            )}
          </>
        )}
      </div>
      {!roomFull && stream && ( // Only show status if room is not full
        <p style={{ marginTop: '20px', color: 'darkgreen' }}>
          Local stream is active. Socket ID: {socket.id}
        </p>
      )}
      {!roomFull && otherUserId && ( // Only show status if room is not full
        <p style={{ color: 'darkblue' }}>
          Connected to other user: {otherUserId}
        </p>
      )}
      {!roomFull && !stream && ( // Only show status if room is not full
        <p style={{ marginTop: '20px', color: 'red' }}>
          Awaiting camera/microphone access or access denied.
        </p>
      )}
    </div>
  );
};

export default VideoCall;