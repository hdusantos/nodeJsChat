const dgram = require("dgram");
const client = dgram.createSocket("udp4");

const host = "localhost";
let portServer = 6001;

const timeResponse = 500

const dataSend = [];
const checkResponseServer = () => {
    if(dataSend.length !== 0) {
        portServer += 1;
        for (message of dataSend) {
            client.send(message, portServer, host);
        }
        setTimeout(checkResponseServer, timeResponse);
    }
}

client.bind({
    address: host
});

client.on("error", (err) => {
    console.log(`client error:\n${err.stack}`);
    client.close();
});

client.on("message", (msg, rinfo) => {
    if(msg != "ok") {
        console.log(`${msg}`);
        process.stdout.write("> ");
    } else {
        dataSend.pop();
    }
});

client.on("listening", () => {
    const address = client.address();
    console.log(`Client: ${address.address}:${address.port}`);
    console.log("Digite '/exit' para sair\n");
});

const room = Buffer.from(process.argv[2]);
const roomSend = Buffer.from(`${room}|Entrou na Sala`);
client.send(roomSend, portServer, host, () => {
    process.stdout.write("> ");
});
dataSend.push(roomSend.toString());
setTimeout(checkResponseServer, timeResponse);

process.stdin.on("data", (data) => {
    let message = data.toString().replace(/\n|\n/g, "");
    if (message == "/exit") {
        message = Buffer.from(`${room}|--- Saiu da Sala ---`);
        client.send(message, portServer, host, (err) => {
            client.close();
            process.exit();
        });
    } else if (message.length > 0){
        message = Buffer.from(`${room}|${message}`);
        client.send(message, portServer, host);
        process.stdout.write("> ");
        
        dataSend.push(message.toString());
        setTimeout(checkResponseServer, timeResponse);
    }
});
