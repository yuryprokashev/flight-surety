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
                    try {
                        await flightSuretyAppContract.registerAirline(TEST.secondAirline, {from: TEST.notRegisteredAirline});
                        assert.fail("The airline, that is not registered, can not register new airline, but it has just happened.")
                    } catch (e){
                        assert.equal(e.message.includes("Current caller can not invoke this operation, b/c it is not registered airline"), true);
                    }
                });
            });

            // describe("Successful Case", async function () {
            //     it("<registerAirline> Transaction successful + <getAirline> Call successful", async function () {
            //
            //     });
            // });

            // describe("Invalid Input Errors", async function () {
            //     it("Does not check input", async function () {
            //
            //     });
            //     it("Throws an Error, when <condition>", async function () {
            //
            //     });
            // });
        });
        // describe("<2> <registerAirline> Transaction. The number of registered airlines is more than 4. Multi Party consensus.", async function () {
        //
        //     describe("Access Control Errors", async function() {
        //         it("Throws an Error, when contract <is not operational>", async function () {
        //
        //         });
        //         it("Throws an Error, when transaction sender <does not have ability to vote>", async function () {
        //
        //         });
        //         it("Throws an Error, when transaction sender <has already voted>", async function () {
        //
        //         });
        //     });
        //
        //     describe("Successful Case", async function () {
        //         it("<registerAirline> Transaction successful increases the vote count, when the consensus is not yet reached", async function () {
        //
        //         });
        //         it("<registerAirline> Transaction registers the airline, when the consensus is reached", async function () {
        //
        //         });
        //     });
        //
        //     describe("Invalid Input Errors", async function () {
        //         it("Does not check input.", async function () {
        //
        //         });
        //     });
        // });
    });


    // describe("2. <Resource Name> Calls (read the state)", async function() {
    //     describe("<index> <Name> Call.", async function () {
    //         describe("Access Control Errors", async function() {
    //             it("Does not have access restrictions", async function () {
    //
    //             });
    //             it("Throws an Error, when transaction sender <condition>", async function () {
    //
    //             });
    //         });
    //
    //         describe("Successful Case", async function () {
    //             it("Transaction is accepted by the Network", async function () {
    //
    //             });
    //             it("Transaction <attribute> = <value>", async function () {
    //
    //             });
    //         });
    //
    //         describe("Invalid Input Errors", async function () {
    //             it("Does not check input", async function () {
    //
    //             });
    //             it("Throws an Error, when <condition>", async function () {
    //
    //             });
    //         });
    //     });
    // });


});