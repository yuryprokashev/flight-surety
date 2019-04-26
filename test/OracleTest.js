const FlightSuretyData  = artifacts.require("FlightSuretyData");
const FlightSuretyApp  = artifacts.require("FlightSuretyApp");
const OracleApp = require("../src/server/OracleApp");

contract("FlightSuretyApp", async function(accounts){
    let TEST;
    try {
        TEST = require("./TestConstants")(accounts, web3);
    } catch (e) {
        console.log(`TEST setup failed\n${e.message}`);
    }
    let flightSuretyDataContract, flightSuretyAppContract, oracleApp;

    before(async function () {
        console.log("        Log: FlightSuretyData is re-instantiated");
        flightSuretyDataContract = await FlightSuretyData.new(
            {from: TEST.contractOwner, value: web3.utils.toWei("10", "ether")}
        );
        flightSuretyAppContract = await FlightSuretyApp.new(
            flightSuretyDataContract.address,
            {from: TEST.contractOwner}
        );
        try {
            await flightSuretyDataContract.setIsAuthorizedCaller(flightSuretyAppContract.address, {from: TEST.contractOwner});
        } catch (e) {
            console.log(e);
        }
        console.log("        Log: Oracle App started");
        oracleApp = new OracleApp(TEST.oracleAppConfig, flightSuretyAppContract, web3);
        await oracleApp.init();

        console.log("        Log: Oracle App listening for OracleRequest from FlightSuretyApp");

        flightSuretyAppContract.OracleRequest()
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
                    await flightSuretyAppContract.submitOracleResponse(
                        response.index,
                        response.airline,
                        response.flight,
                        response.timestamp,
                        response.statusCode,
                        {from: response.address});
                });
            })
            .on("error", err => {
                console.log(`OracleRequest processed with Error: \n${err}`);
            });

        console.log("        Log: One Flight registered");
        await flightSuretyAppContract.registerFlight(
            TEST.flightOne.flight, TEST.flightOne.departure, TEST.firstAirline, {from: TEST.firstAirline},
        );

        console.log("    Log: Insurances for Flight Bought");
        [TEST.insuranceOne, TEST.insuranceFour].forEach(async insurance => {
            await flightSuretyAppContract.buyInsurance(
                insurance.flightId, insurance.paid, {from: insurance.passenger, value: insurance.paid}
            );
        });
    });

    describe("fetchFlightStatus/submitOracleResponse/ processFlightStatus", async function(){
        it("FetchFlightStatus resolved in LATE_AIRLINE results in change of Flight Status Code and Flight availability for insurance", async function(){
            await flightSuretyAppContract.fetchFlightStatus(
                TEST.firstAirline, TEST.flightOne.flight, TEST.flightOne.departure, {from: TEST.whomever}
            );
            let flight = await flightSuretyAppContract.getFlight(1);
            let key = await flightSuretyDataContract.createFlightKey(TEST.firstAirline, TEST.flightOne.flight, TEST.flightOne.departure, {from: TEST.whomever});

            TEST.assertFlight(
                {
                    id: 1,
                    flight: TEST.flightOne.flight,
                    key: key,
                    airline: TEST.firstAirline,
                    departure: TEST.flightOne.departure,
                    departureStatusCode: TEST.FLIGHT_STATUS_CODE.LATE_AIRLINE,
                    state: TEST.FLIGHT_STATE.UNAVAILABLE
                },
                flight
            );
        });

        it("FetchFlightStatus resolved in LATE_AIRLINE results in 2 insurances credited", async function(){
            let insuraceOne = await flightSuretyAppContract.getInsurance(1);
            let insuranceFour = await flightSuretyAppContract.getInsurance(2);
            TEST.assertInsurance(
                {
                    id: 1,
                    flightId: TEST.insuranceOne.flightId,
                    amountPaid: TEST.insuranceOne.paid,
                    owner: TEST.insuranceOne.passenger,
                    state: TEST.INSURANCE_STATE.CREDITED
                },
                insuraceOne
            );
            TEST.assertInsurance(
                {
                    id: 2,
                    flightId: TEST.insuranceFour.flightId,
                    amountPaid: TEST.insuranceFour.paid,
                    owner: TEST.insuranceFour.passenger,
                    state: TEST.INSURANCE_STATE.CREDITED
                },
                insuranceFour
            );
        });

        it("FetchFlightStatus resolved in LATE_AIRLINE results in two passengers have credited amounts", async function(){
            let amountOne = await flightSuretyAppContract.getCreditedAmount(TEST.insuranceOne.passenger);
            let amountTwo = await flightSuretyAppContract.getCreditedAmount(TEST.insuranceFour.passenger);
            let k = await flightSuretyAppContract.getInsurancePremiumMultiplier();
            let expectedAmountOne = TEST.toBN(TEST.insuranceOne.paid).mul(k.numerator).div(k.denominator);
            let expectedAmountTwo = TEST.toBN(TEST.insuranceFour.paid).mul(k.numerator).div(k.denominator);
            assert.equal(amountOne.eq(expectedAmountOne), true, "Unexpected amount credited for insurance one");
            assert.equal(amountTwo.eq(expectedAmountTwo), true, "Unexpected amount credited for insurance four");
        });
    });
});