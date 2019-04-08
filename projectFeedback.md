## Instructions to run dapp from README.md do not work.

I have executed
1. `npm install`
2. `truffle compile`
3. `ganache-cli`
4. `truffle migrate`

First time i got the error about gas limit. 
OK, i fixed that by restarting ganache with:
```bash
ganache-cli -l 9999999
```
 Then I got this:
 ```bash
 Starting migrations...
 ======================
 > Network name:    'development'
 > Network id:      1554442072744
 > Block gas limit: 9999999
 
 
 1_initial_migration.js
 ======================
 
    Deploying 'Migrations'
    ----------------------
 Error:  *** Deployment Failed ***
 
 "Migrations" could not deploy due to insufficient funds
    * Account:  0x627306090abaB3A6e1400e9345bC60c78a8BEf57
    * Balance:  0 wei
    * Message:  sender doesn't have enough funds to send tx. The upfront cost is: 199999980000000000 and the sender's account only has: 0
    * Try:
       + Using an adequately funded account
       + If you are using a local Geth node, verify that your node is synced.
 
     at /usr/local/lib/node_modules/truffle/build/webpack:/packages/truffle-deployer/src/deployment.js:364:1
     at <anonymous>
     at process._tickCallback (internal/process/next_tick.js:188:7)
 Truffle v5.0.7 (core: 5.0.7)
 Node v8.9.4
 ```
 
 Alright, I've seen it before. It is ganache mnemonic issue.
 
 I fixed it by restarting ganache with
 ```bash
 ganache-cli -l 9999999 -m "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"
 ```
 
 Now. Two questions.
 1. Is there any reason, that I miss? Why do you set up truffle development environment with hardcoded mnemonic?
 Below configuration works perfectly fine with:
     ```bash
     > ganache-cli
     > truffle compile
     ```
    the contents of `truffle.js`:
    ```javascript
        module.exports = {
            networks: {
                development: {
                    host: "127.0.0.1",
                    port: 8545,
                    network_id: "*",
                    websockets: true
                }
            }
        }
    ```
2. If there are dependencies like that from ganache that I need to run
locally, and there is a good reason to use specific mnemonic, then
why not including the requirements to ganache to the project README?

## Finding. 'the tx doesn't have correct nonce error' in the truffle test
I have caught this error:
```bash
  1) Contract: Flight Surety. Airlines Resource
       "before each" hook for "Throws an Error, when transaction sender <is not regestered airline>":
     Error: the tx doesn't have the correct nonce. account has nonce of: 42 tx has nonce of: 41
```

Then I commented out all my empty `describe` blocks and the error disappeared!

Code that does not work:
```javascript
const FlightSuretyData  = artifacts.require("FlightSuretyData");
const FlightSuretyApp  = artifacts.require("FlightSuretyApp");

contract("Flight Surety. Airlines Resource", async accounts => {
    const TEST = require("./TestConstants")(accounts, web3);

    let flightSuretyDataContract, flightSuretyAppContract;
    beforeEach(async () =>{
        console.log("beforeEach");
        flightSuretyDataContract = await FlightSuretyData.new(
            {from: TEST.contractOwner}
        );
        flightSuretyAppContract = await FlightSuretyApp.new(
            flightSuretyDataContract.address,
            {from: TEST.contractOwner}
        );
    });

    describe("1. Initial state after contract is deployed", async function(){
        beforeEach(async () =>{

            flightSuretyDataContract = await FlightSuretyData.new(
                {from: TEST.contractOwner}
            );
            flightSuretyAppContract = await FlightSuretyApp.new(
                flightSuretyDataContract.address,
                {from: TEST.contractOwner}
            );
        });
        it("Data Contract state is operational", async function(){
            try {
                let state = await flightSuretyDataContract.getOperationalStatus();
                assert.equal(state, true, "Unexpected contact operational state");
            } catch (e) {
                assert.fail(e.message);
            }
        });
        it("App Contract state is operational", async function(){
            try {
                let state = await flightSuretyAppContract.getOperationalStatus();
                assert.equal(state, true, "Unexpected contact operational state");
            } catch (e) {
                assert.fail(e.message);
            }
        });
        it("There is one airline already registered", async function(){
            try {
                let firstAirline = await flightSuretyAppContract.getAirline(TEST.contractOwner);
                assert.equal(firstAirline.airlineAddress, TEST.contractOwner, "Unexpected airline address");
                assert.equal(firstAirline.id.toNumber(), 1, "Unexpected airline id");
                assert.equal(firstAirline.isVoter, true, "Unexpected airline isVoter");
            } catch (e) {
                assert.fail(e.message);
            }
        });
    });

    describe("2. <Airlines> Transactions (change the state)", async function() {
        describe("<1> <registerAirline> Transaction. The number of registered airlines is less than 5", async function () {

            describe("Access Control Errors", async function() {
                it("Throws an Error, when contract <is not operational>", async function () {
                    await flightSuretyAppContract.setOperationalStatus(false, {from: TEST.contractOwner});
                    try {
                        await flightSuretyAppContract.registerAirline(TEST.secondAirline, {from: TEST.firstAirline});
                        assert.fail("Contract is no operational, so registerAirline call must fail, but it has just passed.");
                    } catch (e) {
                        assert.equal(e.message.includes("Contract is currently not operational"), true);
                    }
                });
                it("Throws an Error, when transaction sender <is not regestered airline>", async function () {

                });
            });
        });
    });
});
```

Code that works (notice comments in the last it block);
```javascript
const FlightSuretyData  = artifacts.require("FlightSuretyData");
const FlightSuretyApp  = artifacts.require("FlightSuretyApp");

contract("Flight Surety. Airlines Resource", async accounts => {
    const TEST = require("./TestConstants")(accounts, web3);

    let flightSuretyDataContract, flightSuretyAppContract;
    beforeEach(async () =>{
        console.log("beforeEach");
        flightSuretyDataContract = await FlightSuretyData.new(
            {from: TEST.contractOwner}
        );
        flightSuretyAppContract = await FlightSuretyApp.new(
            flightSuretyDataContract.address,
            {from: TEST.contractOwner}
        );
    });

    describe("1. Initial state after contract is deployed", async function(){
        beforeEach(async () =>{

            flightSuretyDataContract = await FlightSuretyData.new(
                {from: TEST.contractOwner}
            );
            flightSuretyAppContract = await FlightSuretyApp.new(
                flightSuretyDataContract.address,
                {from: TEST.contractOwner}
            );
        });
        it("Data Contract state is operational", async function(){
            try {
                let state = await flightSuretyDataContract.getOperationalStatus();
                assert.equal(state, true, "Unexpected contact operational state");
            } catch (e) {
                assert.fail(e.message);
            }
        });
        it("App Contract state is operational", async function(){
            try {
                let state = await flightSuretyAppContract.getOperationalStatus();
                assert.equal(state, true, "Unexpected contact operational state");
            } catch (e) {
                assert.fail(e.message);
            }
        });
        it("There is one airline already registered", async function(){
            try {
                let firstAirline = await flightSuretyAppContract.getAirline(TEST.contractOwner);
                assert.equal(firstAirline.airlineAddress, TEST.contractOwner, "Unexpected airline address");
                assert.equal(firstAirline.id.toNumber(), 1, "Unexpected airline id");
                assert.equal(firstAirline.isVoter, true, "Unexpected airline isVoter");
            } catch (e) {
                assert.fail(e.message);
            }
        });
    });

    describe("2. <Airlines> Transactions (change the state)", async function() {
        describe("<1> <registerAirline> Transaction. The number of registered airlines is less than 5", async function () {

            describe("Access Control Errors", async function() {
                it("Throws an Error, when contract <is not operational>", async function () {
                    await flightSuretyAppContract.setOperationalStatus(false, {from: TEST.contractOwner});
                    try {
                        await flightSuretyAppContract.registerAirline(TEST.secondAirline, {from: TEST.firstAirline});
                        assert.fail("Contract is no operational, so registerAirline call must fail, but it has just passed.");
                    } catch (e) {
                        assert.equal(e.message.includes("Contract is currently not operational"), true);
                    }
                });
                // it("Throws an Error, when transaction sender <is not regestered airline>", async function () {
                //
                // });
            });
        });
    });
});
```
__Looks, like there is some problem with `beforeEach` hook running for the empty `it` block.__