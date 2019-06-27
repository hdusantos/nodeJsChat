// Uso do socket
const dgram = require("dgram");
const server = dgram.createSocket("udp4");


const host = "localhost";
let portServer = 6001;

const serverList = [6001, 6002, 6003, 6004, 6005, 6006, 6007, 6008]

const setPort = (port) => {
    const checkPort = dgram.createSocket("udp4");

    checkPort.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
            console.log(`Porta UDP ${port} em uso`);
            if(port >= 6008) {
                console.log("Nao ha mais portas disponiveis - 8 servidores ja estao online");
                checkPort.close();
                setTimeout(process.exit, 500);
            }
            setPort(port + 1);
        } else {
            console.log(`server error:\n${err.code}`);
            checkPort.close();
        }
    });
    checkPort.on("listening", () => {
        portServer = port;
        checkPort.close();
    });
    checkPort.bind({
        address: host,
        port: port
    }, () => console.log("BIND =>"))
}

const runServer = async() => {
    setPort(6001);
    await new Promise((done) => setTimeout(done, 2000));
    console.log("portServer:", portServer);
    serverChat();
}

const updateServers = (msg) => {
    const message = Buffer.from(msg);
    for (port of serverList) {
        if(port != portServer) {
            server.send(message, port, host);
        }
    }
}

const serverChat = () => {
    process.on('SIGINT', () => {
        console.log(" ~ Bye ~");
        server.close();
        setTimeout(process.exit, 500);
    });

    // Estrutura para armazenar sala e usuarios contidos em cada sala
    let rooms = {}

    // Metodos para uso do socket
    server.on("error", (err) => {
        console.log(`Server error: ${err.code}`);
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
                    rooms[newRoom] = new Set([newUser]);
                } else {
                    rooms[newRoom].add(newUser);
                }
                console.log(rooms);
            }
            else if (operation === "rmuser") {
                const room = `${msg.toString().split("|")[2]}`
                const user = parseInt(`${msg.toString().split("|")[3]}`, 10);
                rooms[room].delete(user);
                console.log(rooms);
            }
            else if (operation === "newserver") {
                for (const room of Object.keys(rooms)) {
                    for (const user of rooms[room]) {
                        const message = Buffer.from(`server|newuser|${room}|${user}`);
                        server.send(message, rinfo.port, host);
                    }
                }
            }
        }
        
        // Operacoes para comunicacao com o cliente
        else {
            const confirm = Buffer.from("ok");
            server.send(confirm, rinfo.port, rinfo.address);

            if(!rooms[roomSelect]) {
                rooms[roomSelect] = new Set([rinfo.port]);
                const message = Buffer.from(`server|newuser|${roomSelect}|${rinfo.port}`);
                updateServers(message);
                console.log(rooms);
            } 
            else {
                if (!rooms[roomSelect].has(rinfo.port)) {
                    rooms[roomSelect].add(rinfo.port);
                    const message = Buffer.from(`server|newuser|${roomSelect}|${rinfo.port}`);
                    updateServers(message);
                    console.log(rooms);
                }
                for (const user of rooms[roomSelect]) {
                    if(user !== rinfo.port)
                        server.send(message, user, host);
                }
            }

            if(msg.toString().split("|")[1] === "--- Saiu da Sala ---") {
                const message = Buffer.from(`server|rmuser|${roomSelect}|${rinfo.port}`);
                updateServers(message);
                rooms[roomSelect].delete(rinfo.port);
                console.log(rooms);
            }
        }
    });

    server.on("listening", () => {
        const address = server.address();
        console.log(`Server listening ${address.address}:${address.port}`);
    });

    server.bind({
        address: host,
        port: portServer
    })
    const connectServer = () => {
        const message = Buffer.from(`server|newserver|${portServer}`);
        updateServers(message);
    }
    console.log("connectServer");
    connectServer();
}

runServer();