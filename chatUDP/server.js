const dgram = require("dgram");
const server = dgram.createSocket("udp4");

const host = "localhost";
const portServer = 6001;

let rooms = {}


server.on("error", (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on("message", (msg, rinfo) => {
    const message = Buffer.from(`${rinfo.address}:${rinfo.port}: ${msg.toString().split("|")[1]}`);
    console.log(`${message}`);
    const roomSelect = `${msg.toString().split("|")[0]}`;

    if(!rooms[roomSelect]) {
        rooms[roomSelect] = [rinfo.port];
    } else {
        if (rooms[roomSelect].indexOf(rinfo.port) === -1) {
            rooms[roomSelect].push(rinfo.port);
        }
        for (const user of rooms[roomSelect]) {
            if(user !== rinfo.port)
            server.send(message, user, host);
        }
    }

    if(msg.toString().split("|")[1] === "--- Saiu da Sala ---") {
        const index = rooms[roomSelect].indexOf(rinfo.port);
        rooms[roomSelect].splice(index, 1);
    }
});

server.on("listening", () => {
    const address = server.address();
    console.log(`Server listening ${address.address}:${address.port}`);
});
server.bind({
    address: host,
    port: portServer
});
  