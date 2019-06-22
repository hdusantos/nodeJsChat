// Escalar aplicação
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;

// Utilizado para I/O do arquivo json
const fs = require("fs");
const { spawnSync } = require( 'child_process' );

// Uso do socket
const dgram = require("dgram");
const server = dgram.createSocket({
    type: "udp4",
    reuseAddr: true
});

// Escala a aplicação para o numero de CPUs
if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });
} else {
    const host = "localhost";
    const portServer = 6001;

    // Estrutura para armazenar sala e usuarios contidos em cada sala
    let rooms = {}

    // Checa se eh a primeira instancia do servidor na porta 6001
    const checkInstanceServer = () => {
        lsof = spawnSync( 'lsof', [ '-i', 'udp:6001' ] );
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

    // Metodos para uso do socket
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
        console.log(`Server listening ${address.address}:${address.port} - Worker ${process.pid} started`);
    });
    server.bind({
        address: host,
        port: portServer
    });
}