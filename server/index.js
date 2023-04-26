// const {
//     Client,
//     PrivateKey,
//     AccountCreateTransaction,
//     AccountBalanceQuery,
//     Hbar,
//     TransferTransaction
// } = require("@hashgraph/sdk");
// require("dotenv").config();

// async function main() {


//     //Grab your Hedera testnet account ID and private key from your .env file
//     const myAccountId = process.env.MY_ACCOUNT_ID;
//     const myPrivateKey = process.env.MY_PRIVATE_KEY;

//     // If we weren't able to grab it, we should throw a new error
//     if (myAccountId == null || myPrivateKey == null) {
//         throw new Error("Environment variables myAccountId and myPrivateKey must be present");
//     }

//     // Create our connection to the Hedera network
//     // The Hedera JS SDK makes this really easy!
//     const client = Client.forTestnet();

//     client.setOperator(myAccountId, myPrivateKey);

//     //Create new keys
//     const newAccountPrivateKey = PrivateKey.generateED25519();
//     const newAccountPublicKey = newAccountPrivateKey.publicKey;

//     //Create a new account with 1,000 tinybar starting balance
//     const newAccountTransactionResponse = await new AccountCreateTransaction()
//         .setKey(newAccountPublicKey)
//         .setInitialBalance(Hbar.fromTinybars(1000))
//         .execute(client);

//     // Get the new account ID
//     const getReceipt = await newAccountTransactionResponse.getReceipt(client);
//     const newAccountId = getReceipt.accountId;

//     console.log("The new account ID is: " + newAccountId);

//     //Verify the account balance
//     const accountBalance = await new AccountBalanceQuery()
//         .setAccountId(newAccountId)
//         .execute(client);

//     console.log("The new account balance is: " + accountBalance.hbars.toTinybars() + " tinybars.");

//     //Create the transfer transaction
//     const sendHbar = await new TransferTransaction()
//         .addHbarTransfer(myAccountId, Hbar.fromTinybars(-1000))
//         .addHbarTransfer(newAccountId, Hbar.fromTinybars(1000))
//         .execute(client);

//     //Verify the transaction reached consensus
//     const transactionReceipt = await sendHbar.getReceipt(client);
//     console.log("The transfer transaction from my account to the new account was: " + transactionReceipt.status.toString());

//     //Request the cost of the query
//     const queryCost = await new AccountBalanceQuery()
//         .setAccountId(newAccountId)
//         .getCost(client);

//     console.log("The cost of query is: " + queryCost);

//     //Check the new account's balance
//     const getNewBalance = await new AccountBalanceQuery()
//         .setAccountId(newAccountId)
//         .execute(client);

//     console.log("The account balance after the transfer is: " + getNewBalance.hbars.toTinybars() + " tinybars.");
// }

// main();

const path = require('path');
const express = require("express");
const cors = require("cors");
const http = require("http");
const socketio = require("socket.io");
const libSocket = require("./sockets");
const db = require("./models");
const initDataDev = require("./init/dev");


const PORT = process.env.PORT || 3001;

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    maxHttpBufferSize: 1e8, pingTimeout: 60000 // à changer !!! : https://stackoverflow.com/questions/12977719/how-much-data-can-i-send-through-a-socket-emit
});

app.use(cors());

app.use(express.static(path.resolve(__dirname, '../build')));
app.use(express.json());
app.use("/data/img", express.static(path.join(__dirname, "data/img")));

libSocket.socketConnection(io);

const isDev = process.env.REACT_APP_ENV === 'dev';
db.sequelize.sync({ force: isDev }).then(async () => {
    //ici créer des utilisateurs pour ne pas avoir à faire l'inscription à chaque fois
    // et lancer l'environnement de developpement du réseau hedera
    // et mettre les données fictives dans cette ce réseau aussi
    initDataDev();
});

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../build', 'index.html'));
});

server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});
