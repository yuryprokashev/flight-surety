const fs = require("fs");
const Web3 = require("web3");
const OracleApp = require("./OracleApp");
const TruffleContract = require("truffle-contract");
const express = require("express");

let FlightSuretyApp = JSON.parse(fs.readFileSync('../../build/contracts/FlightSuretyApp.json'));
let Config = JSON.parse(fs.readFileSync("./config.json"));
let config = Config['localhost'];
let web3Provider = new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws'));
// web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = TruffleContract(FlightSuretyApp);
flightSuretyApp.setProvider(web3Provider);


(async ()=>{
    let instance, oracleApp;
    try {
        instance = await flightSuretyApp.at(config.appAddress);
        oracleApp = new OracleApp({
            numOracles: 20,
            statusCodes: [0, 10, 20, 30, 40, 50],
            airlineStatusCodeProbability: 0.8
        }, instance, new Web3(web3Provider));
        await oracleApp.init();
    } catch (e) {
        console.log(e);
    }

    instance
        .OracleRequest()
        .on("data", async event => {
            let flightStatusRequest = {
                index: event.returnValues.index,
                airline: event.returnValues.airline,
                flight: event.returnValues.flight,
                timestamp: event.returnValues.timestamp
            };

            let flightStatusResponses;
            try {
                flightStatusResponses = await oracleApp.getFlightStatus(flightStatusRequest);
            } catch (e) {
                console.log(e);
            }

            console.log(flightStatusResponses);
            flightStatusResponses.forEach(async response => {
                try {
                    await instance.submitOracleResponse(
                        response.index,
                        response.airline,
                        response.flight,
                        response.timestamp,
                        response.statusCode,
                        {from: response.address,  gas: 999999999});
                } catch (e) {
                    console.log(e);
                }

            });
        })
        .on("error", err => {
            console.log(err);
        });
})();

// const app = express();
// app.get('/api', (req, res) => {
//     res.send({
//       message: 'An API for use with your Dapp!'
//     })
// });

// export default app;


