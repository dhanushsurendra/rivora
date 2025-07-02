# 🎥 Rivora – Riverside.fm Clone (MERN + 100ms + Cloudinary)

Rivora is a full-featured video recording platform inspired by [Riverside.fm](https://riverside.fm). It allows creators to host high-quality remote studio sessions with real-time video, chat, and multi-track recording support.

---

## 🚀 Features

- 🔐 **Authentication**
  - Email/password registration & login
  - OAuth via Google

- 🏗️ **Studio Management**
  - Create studios
  - Schedule recordings
  - Invite guests via unique links

- 🎥 **Recording System**
  - Host & guests can join studios
  - Uses `MediaRecorder API` to capture video locally
  - Video chunks are uploaded to **Cloudinary** in real-time

- 🛠️ **Post-Processing**
  - Once recording ends and all chunks are uploaded:
    - Chunks are combined per user (host & guest)
    - A final merged video is created using **FFmpeg**

- 💬 **Real-Time Communication**
  - Built using **100ms SDK**
  - Real-time video conferencing & chat

---

## 🧰 Tech Stack

| Category       | Technology              |
|----------------|--------------------------|
| Frontend       | React.js, Tailwind CSS   |
| Backend        | Node.js, Express.js      |
| Auth           | Firebase Auth / OAuth    |
| DB             | MongoDB + Mongoose       |
| Real-time      | 100ms SDK                |
| File Uploads   | Cloudinary               |
| Video Merge    | FFmpeg (server-side)     |

---

## 📸 Studio Flow Overview

1. **User Sign-Up/Login** (OAuth available)
2. **Create a Studio** → Set date/time
3. **Invite Guests** → Share the generated link
4. **Join Session** → Real-time video using 100ms
5. **Record** → MediaRecorder captures local stream, uploads chunks
6. **Processing** → Merge chunks using FFmpeg into:
   - Host video
   - Guest video
   - Final merged video
7. **Ready to Publish!**

---

## 🛠️ Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/rivora.git
cd rivora

# 2. Install backend dependencies
cd server
npm install

# 3. Set up environment variables (.env)
# Example:
PORT=5000
MONGO_URI=your_mongo_uri
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# 4. Install frontend dependencies
cd ../client
npm install

# 5. Start development
npm run dev   # Or use concurrently to start both
