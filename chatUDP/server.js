const fs = require("fs");
const { spawnSync } = require( 'child_process' );
const dgram = require("dgram");
const server = dgram.createSocket({
    type: "udp4",
    reuseAddr: true
});

const host = "localhost";
const portServer = 6001;

let rooms = {}

// Checa se eh a primeira instancia do servidor na porta 6001
const checkInstanceServer = () => {
    lsof = spawnSync( 'lsof', [ '-i', 'udp:6001' ] );
    console.log(`${lsof.stdout}`);
    if (!lsof.stdout.toString().length) {
        fs.writeFileSync("rooms.json", "{}",{enconding:'utf-8',flag: 'w'}, (err) => {
            if (err) {
                console.log(err);
            }
        });
    } else {
        rooms = JSON.parse(fs.readFileSync("rooms.json", "utf-8"));
    }
}
checkInstanceServer();

// Grava os dados da sala em um arquivo JSON
const writeRooms = () => {
    fs.writeFile('rooms.json', JSON.stringify(rooms), 'utf8', (err) => {
        if (err) {
            console.log(err)
        }
    });
}

// Le sala do arquivo Json
const readRooms = () => {
    rooms = JSON.parse(fs.readFileSync("rooms.json", "utf-8"));
}

server.on("error", (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on("message", (msg, rinfo) => {
    readRooms();
    const message = Buffer.from(`${rinfo.address}:${rinfo.port}: ${msg.toString().split("|")[1]}`);
    console.log(`${message}`);
    const roomSelect = `${msg.toString().split("|")[0]}`;

    if(!rooms[roomSelect]) {
        rooms[roomSelect] = [rinfo.port];
        writeRooms();
    } else {
        if (rooms[roomSelect].indexOf(rinfo.port) === -1) {
            rooms[roomSelect].push(rinfo.port);
            writeRooms();
        }
        for (const user of rooms[roomSelect]) {
            if(user !== rinfo.port)
            server.send(message, user, host);
        }
    }

    if(msg.toString().split("|")[1] === "--- Saiu da Sala ---") {
        const index = rooms[roomSelect].indexOf(rinfo.port);
        rooms[roomSelect].splice(index, 1);
        writeRooms();
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
  