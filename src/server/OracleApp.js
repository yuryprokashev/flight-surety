module.exports = class OracleApp {
    /**
     *
     * @param config
     * @param {number} config.numOracles - the number of Oracles to spawn at startup
     * @param {number []} config.statusCodes - the array of flight status codes to randomize.
     * @param {number} config.airlineStatusCodeProbability - the ratio of oracles, that will
     * report status code 20 (the flight delayed due to airline)
     * @param {object} flightSuretyApp - the FlightSuretyApp contract
     * @param {object} web3 - Web3 instance
     *
     */
    constructor(config, flightSuretyApp, web3){
        this._numOracles = config.numOracles;
        this._statusCodes = config.statusCodes;
        this._airlineStatusCodePropability = config.airlineStatusCodeProbability;
        this._contract = flightSuretyApp;
        this._oracles = [];
        this.web3 = web3;
    }

    async init(){
        // this._contract = await this.flightSuretyApp.deployed();
        let accounts = await this.web3.eth.getAccounts();
        for(let i = 0; i < this._numOracles; i++){
            let address = accounts[9 + i];
            let isAlwaysAirlineStatusCode = false;
            if(i <= this._numOracles * this._airlineStatusCodePropability) {
                isAlwaysAirlineStatusCode = true;
            }
            this._oracles.push(
                await this.createOracle(address, isAlwaysAirlineStatusCode)
            );
        }
        return true;
    }

    async createOracle(address, isAlwaysAirlineStatusCode){
        try {
            await this._contract.registerOracle(
                {from: address, value: this.web3.utils.toWei("1", "ether")}
                );
        } catch (e) {
            console.log(`Failed to register oracle ${e.message}`);
        }
        let indexesBN = await this._contract.getMyIndexes({from: address});
        let indexes = indexesBN.map(item =>{
            return item.toNumber();
        });
        return new Oracle(address, indexes, isAlwaysAirlineStatusCode);
    }

    async getFlightStatus(request){
        let response = {};
        response.index = request.index;
        response.airline = request.airline;
        response.flight = request.flight;
        response.timestamp = request.timestamp;

        let reportedStatuses = [];
        this._oracles.forEach(oracle => {
            let status = oracle.getFlightStatus(request);
            if(status) reportedStatuses.push(status);
        });

        return reportedStatuses;
    }
};

class Oracle {
    constructor(address, indexes, isAlwaysAirlineStatusCode){
        this._address = address;
        this._indexes = indexes;
        this._isAlwaysAirlineStatusCode = isAlwaysAirlineStatusCode;
    }
    getFlightStatus(request){
        let isMyIndex = this.findIndex(parseInt(request.index), this._indexes);
        if(isMyIndex) {
            if(this._isAlwaysAirlineStatusCode){
                return this.createResponse(request, {
                    code: 20,
                    address: this._address
                });
            }
            else {
                let randomNumber = Math.ceil(Math.random()*1000000);
                return this.createResponse(request, {
                    code: (randomNumber % 6) * 10,
                    address: this._address
                });
            }
        }
    }
    findIndex(index, arr) {
        return arr.find(item => {
            return item === index;
        });
    }
    createResponse(request, status) {
        return {
            index: request.index,
            airline: request.airline,
            flight: request.flight,
            timestamp: request.timestamp,
            statusCode: status.code,
            address: status.address
        }
    }
}