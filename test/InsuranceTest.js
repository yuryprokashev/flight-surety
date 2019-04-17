const FlightSuretyData  = artifacts.require("FlightSuretyData");
const FlightSuretyApp  = artifacts.require("FlightSuretyApp");

contract("Flight Surety. Insurance Resource", async accounts => {
    const TEST = require("./TestConstants")(accounts, web3);

    let flightSuretyDataContract, flightSuretyAppContract;

    beforeEach(async ()=> {
        console.log("contracts re-instantiated");
        flightSuretyDataContract = await FlightSuretyData.new(
            {from: TEST.contractOwner}
        );
        flightSuretyAppContract = await FlightSuretyApp.new(
            flightSuretyDataContract.address,
            {from: TEST.contractOwner}
        );
    });

    describe("1. <Insurance> Transactions (change the state)", async function() {
        describe("<1> <purchaseInsurance> Transaction.", async function () {

            describe("Access Control Errors", async function() {
                it("Does not have access restrictions", async function () {

                });
                it("Throws an Error, when transaction sender <condition>", async function () {

                });
            });

            describe("Successful Case", async function () {
                it("<purchaseInsurance> Transaction successful + <getInsurance> Call successful", async function () {

                });
            });

            describe("Invalid Input Errors", async function () {
                it("Does not check input", async function () {

                });
                it("Throws an Error, when <condition>", async function () {

                });
            });
        });
        describe("<2> <creditInsurance> Transaction.", async function () {

            describe("Access Control Errors", async function() {
                it("Does not have access restrictions", async function () {

                });
                it("Throws an Error, when transaction sender <condition>", async function () {

                });
            });

            describe("Successful Case", async function () {
                it("<creditInsurance> Transaction successful + <getCreditedAmount> Call successful", async function () {

                });
            });

            describe("Invalid Input Errors", async function () {
                it("Does not check input", async function () {

                });
                it("Throws an Error, when <condition>", async function () {

                });
            });
        });
    });
});