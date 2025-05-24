const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')

const app = express()
app.use(cors())

const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: '*',
  },
})

let users = {}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id)

    socket.on('join-room', () => {
        const otherUser = Object.keys(users).find(id => id !== socket.id)
        
        if (otherUser) {
            socket.emit('other-user', otherUser)
            io.to(otherUser).emit('user-joined', socket.id)
        }

        users[socket.id] = socket.id
        console.log('Current users:', users)
    })

    socket.on('signal', ({userToSignal, signal, from}) => {
        io.to(userToSignal).emit('signal', {signal, from})
    })

    socket.on('disconnect', () => {
        delete users[socket.id]
        console.log('User disconnected:', socket.id)
    })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})