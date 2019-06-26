// Escalar aplicação
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;

// Uso do socket
const dgram = require("dgram");
const server = dgram.createSocket("udp4");


const host = "localhost";
const portServer = process.env.PORT_SERVER_CHAT || 6001;


// Estrutura para armazenar sala e usuarios contidos em cada sala
let rooms = {}
// Estrutura para armazenar os n servidores
let servers = [];

// Metodos para uso do socket
server.on("error", (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on("message", (msg, rinfo) => {
    const message = Buffer.from(`${rinfo.address}:${rinfo.port}: ${msg.toString().split("|")[1]}`);
    console.log(`${message}`);
    const param = `${msg.toString().split("|")[0]}`;
    const roomSelect = param;

    // Operacoes para comunicacao entre servidores
    if (param === "server") {
        const operation = `${msg.toString().split("|")[1]}`
        if ( operation === "newuser") {
            const newRoom = `${msg.toString().split("|")[2]}`
            const newUser = parseInt(`${msg.toString().split("|")[3]}`, 10);
            if (!rooms[newRoom]) {
                rooms[newRoom] = [newUser];
            } else {
                rooms[newRoom].push(newUser);
            }
            console.log(rooms);
        }
        else if (operation === "rmuser") {
            const room = `${msg.toString().split("|")[2]}`
            const user = parseInt(`${msg.toString().split("|")[3]}`, 10);

            const index = rooms[room].indexOf(user);
            rooms[room].splice(index, 1);
            console.log(rooms);
        }
        else if (operation === "newserver") {
            /* const newRoom = `${msg.toString().split("|")[2]}`
            const newUser = parseInt(`${msg.toString().split("|")[3]}`, 10); */
            servers.push(rinfo);
            console.log(servers);
        }
    }
    
    // Operacoes para comunicacao com o cliente
    else {
        const confirm = Buffer.from("ok");
        server.send(confirm, rinfo.port, rinfo.address);

        if(!rooms[roomSelect]) {
            rooms[roomSelect] = [rinfo.port];
            const message = Buffer.from(`server|newuser|${roomSelect}|${rinfo.port}`);
            server.send(message, portServer+1, host);
            console.log(rooms);
        } 
        else {
            if (rooms[roomSelect].indexOf(rinfo.port) === -1) {
                rooms[roomSelect].push(rinfo.port);
                const message = Buffer.from(`server|newuser|${roomSelect}|${rinfo.port}`);
                server.send(message, portServer+1, host);
                console.log(rooms);
            }
            for (const user of rooms[roomSelect]) {
                if(user !== rinfo.port)
                    server.send(message, user, host);
            }
        }

        if(msg.toString().split("|")[1] === "--- Saiu da Sala ---") {
            const message = Buffer.from(`server|rmuser|${roomSelect}|${rinfo.port}`);
            server.send(message, portServer+1, host);

            const index = rooms[roomSelect].indexOf(rinfo.port);
            rooms[roomSelect].splice(index, 1);
            console.log(rooms);
        }
    }
});

server.on("listening", () => {
    const address = server.address();
    console.log(`Server listening ${address.address}:${address.port} - Worker ${process.pid} started`);
});

server.bind({
    address: host,
    port: portServer
})

const connectServer = () => {
    if (portServer !== 6001) {
        const message = Buffer.from(`server|newserver|${portServer}`);
        server.send(message, portServer-1, host);
    }
}
connectServer();