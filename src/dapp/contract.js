import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
const TruffleContract = require("truffle-contract");

export default class Contract {
    constructor(network, callback) {

        this.config = Config[network];
        // let web3Provider = new Web3.providers.HttpProvider(config.url);
        let web3Provider = new Web3.providers.WebsocketProvider(this.config.url.replace('http', 'ws'));
        this.web3 = new Web3(web3Provider);
        // this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyApp = TruffleContract(FlightSuretyApp);
        this.flightSuretyApp.setProvider(web3Provider);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }

    async getContractInstance(){
        return await this.flightSuretyApp.at(this.config.appAddress);
    }

    async getOperationalStatus(request) {
        let self = this;
        let caller = request.from || self.owner;
        let instance = await this.getContractInstance();
        return await instance.getOperationalStatus({from: caller});
    }

    async fetchFlightStatus(request) {
        let caller = request.from || this.owner;
        let instance = await this.getContractInstance();
        instance.OracleRequest().on("data", async event => {
            console.log(event.returnValues);
        });
        instance.FlightStatusInfo().on("data", async event => {
            console.log(event.returnValues);
            return await event.returnValues;
        });
        await instance.fetchFlightStatus(request.airline, request.flight, request.departure, {from: caller});
    }
    async registerAirline(request) {
        let caller = request.from || this.owner;
        let instance = await this.getContractInstance();
        return await instance.registerAirline(request.airline, {from: caller});
    }
    async registerFlight(request){
        let caller = request.from || this.owner;
        let instance = await this.getContractInstance();
        return await instance.registerFlight(request.flight, request.departure, request.airline, {from: caller});
    }

    async getFlight(request){
        let caller = request.from || this.owner;
        let instance = await this.getContractInstance();
        let result = await instance.getFlight(request.flight, {from: caller});
        console.log(result);
        return result;
    }

    async buyInsurance(request){
        console.log(request);
        let caller = request.from || this.owner;
        let instance = await this.getContractInstance();
        let paid = this.web3.utils.toWei(request.paid.toString(), "ether");
        let gasEstimateUnits = await instance.buyInsurance.estimateGas(request.flight, paid, {from: caller, value: paid});
        console.log(gasEstimateUnits);
        console.log(paid);
        return await instance.buyInsurance(request.flight, paid, {from: caller, value: paid, gas: 999999999});
    }

    async getInsurance(request){
        console.log(request);
        let instance = await this.getContractInstance();
        let result = await instance.getInsurance(request.id);
        console.log(result);
        return result;
    }

    async getCreditedAmount(request){
        let instance = await this.getContractInstance();
        let result = await instance.getCreditedAmount(request.address);
        console.log(result);
        return result;
    }

    async withdrawAmount(request){
        let caller = request.from || request.address;
        let instance = await this.getContractInstance();
        let amount = this.web3.utils.toWei(request.amount.toString(), "ether");
        return await instance.withdrawCreditedAmount(amount, request.address, {from: caller});
    }
}