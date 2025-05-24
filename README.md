# rivora
Rivora — Where conversations flow effortlessly. A seamless platform for recording, streaming, and merging multi-user video and audio sessions into one polished experience.


TO DO
RIVORA MVP
1. User Flow & Features
Two users join a shared session (room) via unique link/ID.

Real-time video/audio streaming between users using WebRTC.

Each user can record their own local video/audio stream.

After recording, users upload their raw recordings to the backend.

Backend merges the two recordings into a single combined video (side-by-side layout) using FFmpeg.

Users can play back the combined final video inside the app.

2. Frontend (React + Redux)
Video call UI with two video windows (host and guest).

WebRTC peer connection setup for streaming.

MediaRecorder API to record local streams.

Recording controls: Start, Stop, Upload.

Playback component for the final merged video.

Redux to manage session state, recording status, and uploaded files.

3. Backend (Node.js + Express)
API to create/join sessions.

Endpoint to accept raw recording file uploads with metadata.

Run FFmpeg to sync and merge recordings into one video.

Store raw and processed videos (AWS S3 or local).

Endpoint to fetch combined final video URL.

4. Database (MongoDB)
Store sessions with user info.

Save file paths and processing status.

5. Tech Stack Summary
React + Redux (Frontend)

Node.js + Express (Backend)

MongoDB (Database)

WebRTC + MediaRecorder API (Streaming & recording)

FFmpeg (Video processing)

AWS S3 or local storage (Files)