const dgram = require("dgram");
const client = dgram.createSocket("udp4");

const host = "localhost";
const portServer = 6001;

client.bind({
    address: host
});

client.on("error", (err) => {
    console.log(`client error:\n${err.stack}`);
    client.close();
});

client.on("message", (msg, rinfo) => {
    console.log(`${msg}`);
});

client.on("listening", () => {
    const address = client.address();
    console.log(`Client: ${address.address}:${address.port}`);
    console.log("Digite 'exit' para sair\n");
});

const room = Buffer.from(process.argv[2]);
const roomSend = Buffer.from(`${room}|Entrou na Sala`);
client.send(roomSend, portServer, host);


process.stdin.on("data", (data) => {
    let message = data.toString().replace(/\n|\n/g, "");
    if (message == "exit") {
        const message = Buffer.from(`${room}|--- Saiu da Sala ---`);
        client.send(message, portServer, host, (err) => {
            client.close();
            process.exit();
        });
    } else {
        message = Buffer.from(`${room}|${message}`);
        client.send(message, portServer, host);
    }
});
