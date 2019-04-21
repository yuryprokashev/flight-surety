const fs = require("fs");
const Web3 = require("web3");
const OracleApp = require("./OracleApp");
const TruffleContract = require("truffle-contract");
const express = require("express");

let FlightSuretyApp = JSON.parse(fs.readFileSync('../../build/contracts/FlightSuretyApp.json'));
let Config = JSON.parse(fs.readFileSync("./config.json"));
let config = Config['localhost'];
let web3Provider = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = TruffleContract(FlightSuretyApp);
flightSuretyApp.setProvider(web3Provider);
flightSuretyApp.at(config.appAddress);

let oracleApp = new OracleApp({
    numOracles: 20,
    statusCodes: [0, 10, 20, 30, 40, 50],
}, flightSuretyApp, new Web3(web3Provider));

oracleApp.init().then(result=> console.log("Oracle App initialized")).catch(err => console.log(err));

flightSuretyApp.deployed().then(instance => {
    instance
        .OracleRequest()
        .on("data", async event => {
            let flightStatusRequest = {
                index: event.returnValues.index,
                airline: event.returnValues.airline,
                flight: event.returnValues.flight,
                timestamp: event.returnValues.timestamp
            };

            let flightStatusResponses = await oracleApp.getFlightStatus(flightStatusRequest);
            console.log(flightStatusResponses);
            flightStatusResponses.forEach(async response => {
                await flightSuretyApp.submitOracleResponse(
                    response.index,
                    response.airline,
                    response.flight,
                    response.timestamp,
                    response.statusCode,
                    {from: response.address});
            });
        })
        .on("error", err => {
            console.log(err);
        });
});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
});

export default app;


