const FlightSuretyData  = artifacts.require("FlightSuretyData");
const FlightSuretyApp  = artifacts.require("FlightSuretyApp");

contract("Flight Surety. Airlines Resource", async accounts => {
    const TEST = require("./TestConstants")(accounts, web3);

    let flightSuretyDataContract, flightSuretyAppContract;

    describe("1. Initial state after contract is deployed", async function(){
        before(async() => {
            console.log("contracts re-instantiated");
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
        beforeEach(async() => {
            console.log("contracts re-instantiated");
            flightSuretyDataContract = await FlightSuretyData.new(
                {from: TEST.contractOwner}
            );
            flightSuretyAppContract = await FlightSuretyApp.new(
                flightSuretyDataContract.address,
                {from: TEST.contractOwner}
            );
        });
        describe("<1> <registerAirline> Transaction. The number of registered airlines is less than 5", async function () {

            describe("Access Control Errors", async function() {
                // it("Throws an Error, when contract <is not operational>", async function () {
                //     await flightSuretyAppContract.setOperationalStatus(false, {from: TEST.contractOwner});
                //
                //     try {
                //         await flightSuretyAppContract.registerAirline(TEST.secondAirline, {from: TEST.firstAirline});
                //
                //         assert.fail("Contract is no operational, so registerAirline call must fail, but it has just passed.");
                //     } catch (e) {
                //         assert.equal(e.message.includes("Contract is currently not operational"), true);
                //         try {
                //             await flightSuretyAppContract.registerAirline(TEST.secondAirline, {from: TEST.firstAirline});
                //         } catch (err) {
                //             console.log(err);
                //             assert.equal(err.message.includes("Contract is currently not operational"), true);
                //         }
                //     }
                // });
                it("Throws an Error, when transaction sender <is not regestered airline>", async function () {
                    try {
                        await flightSuretyAppContract.registerAirline(TEST.secondAirline, {from: TEST.notRegisteredAirline});
                        assert.fail("The airline, that is not registered, can not register new airline, but it has just happened.")
                    } catch (e){
                        assert.equal(e.message.includes("Airline with given address is not registered"), true);
                    }
                });
            });

            describe("Successful Case", async function () {
                it("<registerAirline> Transaction successful + <getAirline> Call successful", async function () {
                    let addresses = [TEST.secondAirline, TEST.thirdAirline, TEST.fourthAirline];

                    let eventCount = 0;
                    flightSuretyAppContract.AirlineRegistered().on("data", async event => {
                        assert.equal(event.returnValues.airlineAddress, addresses[eventCount], "Unexpected airline address");
                        eventCount++;
                    }).on("error", err => {
                        assert.fail(err.message);
                        console.log(err);
                    });

                    for(let i = 2; i < 5; i++){
                        let currentAirlineAddress = addresses[i - 2];
                        await flightSuretyAppContract.registerAirline(currentAirlineAddress, {from: TEST.firstAirline});
                        let dataContractBalanceBefore = await TEST.currentBalanceAsBN(flightSuretyDataContract.address);
                        await flightSuretyAppContract.payRegistrationFee({from: currentAirlineAddress, value: TEST.registrationFee});
                        let airline = await flightSuretyAppContract.getAirline(currentAirlineAddress);
                        assert.equal(airline.airlineAddress, currentAirlineAddress, "Unexpected airline address");
                        assert.equal(airline.id.toNumber(), i, "Unexpected airline id");
                        assert.equal(airline.isVoter, true, "Unexpected airline isVoter");
                        let dataContractBalanceAfter = await TEST.currentBalanceAsBN(flightSuretyDataContract.address);
                        assert.equal(
                            dataContractBalanceAfter.eq(dataContractBalanceBefore.add(TEST.toBN(TEST.registrationFee))),
                            true,
                            "Unexpected data contract balance"
                        );
                    }
                });
            });

            // describe("Invalid Input Errors", async function () {
            //     it("Does not check input", async function () {
            //
            //     });
            //     it("Throws an Error, when <condition>", async function () {
            //
            //     });
            // });
        });
        describe("<2> <registerAirline> Transaction. The number of registered airlines is more than 4. Multi Party consensus.", async function () {
            beforeEach("Registering 3 airlines and paying registration fees for first 2", async function(){
                let addresses = [TEST.secondAirline, TEST.thirdAirline, TEST.fourthAirline];
                for(let i = 0; i < 3; i++){
                    let currentAirlineAddress = addresses[i];
                    await flightSuretyAppContract.registerAirline(currentAirlineAddress, {from: TEST.firstAirline});
                    if(i !== 2) {
                        await flightSuretyAppContract.payRegistrationFee({from: currentAirlineAddress, value: TEST.registrationFee});
                    }
                }
            });
            describe("Access Control Errors", async function() {
                it("Throws an Error, when transaction sender <does not have ability to vote>", async function () {
                    try {
                        await flightSuretyAppContract.registerAirline(TEST.fifthAirline, {from: TEST.fourthAirline});
                        assert.fail("The airline registration requires voter to pay the registration fee. But it has just happened without it.");
                    } catch (e) {
                        assert.equal(e.message.includes("Airline has to pay registration fee to be able to vote"), true);
                    }
                });
                it("Throws an Error, when transaction sender <has already voted>", async function () {
                    try {
                        await flightSuretyAppContract.registerAirline(TEST.fifthAirline, {from: TEST.thirdAirline});
                        await flightSuretyAppContract.registerAirline(TEST.fifthAirline, {from: TEST.thirdAirline});
                        assert.fail("The fifth airline registration counts unique votes. But third voter just voted twice without a problem.");
                    } catch (e) {
                        console.log(e.message);
                        assert.equal(e.message.includes("The caller has already voted"), true);
                    }
                });
            });

            describe("Successful Case", async function () {
                beforeEach("Paying registration fee for fourth Airline", async function(){
                    await flightSuretyAppContract.payRegistrationFee({from: TEST.fourthAirline, value: TEST.registrationFee});
                });
                it("<registerAirline> Transaction successful increases the vote count, when the consensus is not yet reached", async function () {
                    let voteCount, isConsensusReached;
                    flightSuretyAppContract.VoteCounted().on("data", async event =>{
                        console.log("event catched");
                        isConsensusReached = event.returnValues.isConsensusReached;
                        voteCount = event.returnValues.voteCount;
                        assert.equal(isConsensusReached, false, "Unexpected success status");
                        assert.equal(parseInt(voteCount), 1, "Unexpected vote count");
                    }).on("error", err => {
                        assert.fail(err.message);
                    });
                    try {
                        await flightSuretyAppContract.registerAirline(TEST.fifthAirline, {from: TEST.firstAirline});
                        let airline = await flightSuretyAppContract.getAirline(TEST.fifthAirline);
                        assert.fail("The fifth airline requires multi-party consensus to register. But it has just happened without consensus");
                    } catch (e) {
                        assert.equal(e.message.includes("Airline with given address is not registered"), true);
                    }
                });
                it("<registerAirline> Transaction registers the airline, when the consensus is reached", async function () {
                    let voteCount, isConsensusReached;
                    flightSuretyAppContract.VoteCounted().on("data", async event =>{
                        console.log("event catched");
                        isConsensusReached = event.returnValues.isConsensusReached;
                        voteCount = event.returnValues.voteCount;
                    }).on("error", err => {
                        assert.fail(err.message);
                    });

                    await flightSuretyAppContract.registerAirline(TEST.fifthAirline, {from: TEST.firstAirline});
                    await flightSuretyAppContract.registerAirline(TEST.fifthAirline, {from: TEST.secondAirline});
                    assert.equal(isConsensusReached, true, "Unexpected success status");
                    assert.equal(parseInt(voteCount), 2, "Unexpected vote count");
                });
            });

            // describe("Invalid Input Errors", async function () {
            //     it("Does not check input.", async function () {
            //
            //     });
            // });
        });
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