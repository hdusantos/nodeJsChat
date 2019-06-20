const express = require("express")
const chat = express();
const server = require("http").createServer(chat);
const io = require("socket.io")(server);

const port = 3000;

chat.use(express.static(`${__dirname}/assets`));

chat.get("/", (req, resp) => {
    resp.sendFile(`${__dirname}/client.html`);
});

io.on("connection", (socket) => {
    console.log("Nova conexao - ID:", socket.id);
    socket.on("newUser", (nickname, room) => {
        console.log(`${nickname} -> ${room}`);
        socket.nickname = nickname;
        socket.room = room;
        socket.join(room)
        socket.emit("info", `Voce esta na sala ${socket.room}`);
        socket.broadcast.to(room).emit("message", `${socket.nickname} acabou de entrar na sala`);
    });
    socket.on("message", (message) => {
        console.log(`${socket.nickname}: ${message}`);
        socket.broadcast.to(socket.room).emit("message", `${socket.nickname}: ${message}`);
    });
    socket.on("disconnect", () => {
        socket.broadcast.to(socket.room).emit("message", `${socket.nickname} saiu do chat`);
        console.log(`${socket.nickname} saiu do chat`);
        socket.leave(socket.room);
    });
});

server.listen(port, () => {
    console.log(`Server listening ${port}`);

});