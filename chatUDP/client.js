const dgram = require("dgram");
const client = dgram.createSocket("udp4");

const host = "localhost";
let portServer = 6001;

const dataSend = [];

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
        //console.log("dataSend confirm: ", dataSend);
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
        //console.log("dataSend: ", dataSend);
        setTimeout(checkResponseServer, 1000);
    }
});


const checkResponseServer = () => {
    if(dataSend.length !== 0) {        
        //console.log("X, nao foi recebida");
        portServer += 1;
        for (message of dataSend) {
            client.send(message, portServer, host);
        }
    }
}
