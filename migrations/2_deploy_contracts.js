const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');
const Web3 = require("web3");

let Config = JSON.parse(fs.readFileSync("../src/server/config.json"));
let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));


module.exports = function(deployer, network, accounts) {
    deployer.deploy(FlightSuretyData, {value: web3.utils.toWei("10", "ether") })
        .then(() => {
            return deployer.deploy(FlightSuretyApp, FlightSuretyData.address);
        })
        .then(deployer => {
        return FlightSuretyData.deployed();
        }).then(dataInstance => {
            return dataInstance.setIsAuthorizedCaller(FlightSuretyApp.address, true);
        }).then(result => {
            let config = {
                localhost: {
                    url: 'http://localhost:8545',
                    dataAddress: FlightSuretyData.address,
                    appAddress: FlightSuretyApp.address
                }
            };
            fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
            fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
        }).catch(err =>{
            console.log(err);
        });
}