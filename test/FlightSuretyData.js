const FlightSuretyData  = artifacts.require("FlightSuretyData");
const FlightSuretyApp  = artifacts.require("FlightSuretyApp");

contract("Flight Surety Data Unit Tests", async accounts => {
    let TEST;
    try {
        TEST = require("./TestConstants")(accounts, web3);
    } catch (e) {
        console.log(`TEST setup failed\n${e.message}`);
    }


    let flightSuretyDataContract, flightSuretyAppContract;

    beforeEach(async () => {
        console.log("        Log:FlightSuretyData is re-instantiated");
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
    });

    describe("Contract.getOperationalStatus/ setOperationalStatus", async function(){
        it("Everybody can get operational status without access restrictions", async function () {
            let status = await flightSuretyDataContract.getOperationalStatus({from: TEST.whomever});
            assert.equal(status, true, "Unexpected operational status");
        });
        it("Everybody can get operational status even when contract is not operational", async function () {
            await flightSuretyDataContract.setOperationalStatus(false, {from: TEST.contractOwner});
            let status = await flightSuretyDataContract.getOperationalStatus({from: TEST.whomever});
            assert.equal(status, false, "Unexpected operational status");
        });
        it("Only contract owner can set operational status", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.setOperationalStatus,
                [false, {from: TEST.whomever}],
                TEST.ERROR.CALLER_NOT_CONTRACT_OWNER
            )
        });
    });

    describe("Contract.getIsAuthorizedCaller/ setIsAuthorizedCaller", async function(){
        it("Everybody can get authorization status for address without access restrictions", async function () {
            let status = await flightSuretyDataContract.getIsAuthorizedCaller(flightSuretyAppContract.address, {from: TEST.whomever});
            assert.equal(status, true, "Unexpected authorization status");
        });
        it("Nobody can get authorization status for address when contract is not operational", async function () {
            await flightSuretyDataContract.setOperationalStatus(false, {from: TEST.contractOwner});
            await TEST.asyncTestForError(
                flightSuretyDataContract.getIsAuthorizedCaller,
                [flightSuretyAppContract.address, {from: TEST.whomever}],
                TEST.ERROR.CONTRACT_NOT_OPERATIONAL
            );
        });
        it("Only contract owner can set the authorization status for another address", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.setIsAuthorizedCaller,
                [flightSuretyAppContract.address, {from: TEST.whomever}],
                TEST.ERROR.CALLER_NOT_CONTRACT_OWNER
            );
        });
        it("Setting authorization status for address requires contract to be operational", async function () {
            let status = await flightSuretyDataContract.setOperationalStatus(false, {from: TEST.contractOwner});
            await TEST.asyncTestForError(
                flightSuretyDataContract.setIsAuthorizedCaller,
                [flightSuretyAppContract.address, {from: TEST.contractOwner}],
                TEST.ERROR.CONTRACT_NOT_OPERATIONAL
            )
        });
    });

    describe("Airlines.createAirline / getAirline", async function(){
        it("Creating Airline requires contract to be operational", async function () {
            let status = await flightSuretyDataContract.setOperationalStatus(false, {from: TEST.contractOwner});
            await TEST.asyncTestForError(
                flightSuretyDataContract.createAirline,
                [TEST.secondAirline, true, {from: flightSuretyAppContract.address}],
                TEST.ERROR.CONTRACT_NOT_OPERATIONAL
            )
        });
        it("Creating Airline requires caller address to be authorized", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.createAirline,
                [TEST.secondAirline, true, {from: TEST.whomever}],
                TEST.ERROR.CALLER_NOT_AUTHORIZED
            )
        });
        it("Airline can be created and can be read when caller is authorized and contract is operational", async function () {
            await flightSuretyDataContract.createAirline.apply(null, [TEST.secondAirline, true, {from: TEST.contractOwner}]);
            let airline = await flightSuretyDataContract.getAirline(TEST.secondAirline, {from: TEST.whomever});
            TEST.assertAirline(
                {
                    airlineAddress: TEST.secondAirline,
                    id: '2',
                    isVoter: true
                },
                airline);
        });

        it("Airline can not be read, if the contract is not operational", async function () {
            await flightSuretyDataContract.createAirline.apply(null, [TEST.secondAirline, true, {from: TEST.contractOwner}]);
            await flightSuretyDataContract.setOperationalStatus(false, {from: TEST.contractOwner});
            await TEST.asyncTestForError(
                flightSuretyDataContract.getAirline,
                [TEST.secondAirline, true, {from: TEST.whomever}],
                TEST.ERROR.CONTRACT_NOT_OPERATIONAL
            )
        });

        it("Airline can not be read, if it does not exists", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.getAirline,
                [TEST.secondAirline, true, {from: TEST.whomever}],
                TEST.ERROR.AIRLINE_NOT_EXIST
            )
        });
    });

    describe("Airlines.getAirlinesCount", async function(){
        it("Airline Count can not be read, if the contract is not operational", async function () {
            await flightSuretyDataContract.setOperationalStatus(false, {from: TEST.contractOwner});
            await TEST.asyncTestForError(
                flightSuretyDataContract.getAirlinesCount,
                [{from: TEST.whomever}],
                TEST.ERROR.CONTRACT_NOT_OPERATIONAL
            )
        });
        it("Airline Count can be read by whomever, if the contract is operational", async function () {
            let airlineCount = await flightSuretyDataContract.getAirlinesCount();
            assert.equal(airlineCount, 1, "Unexpected airline count");
        });
    });

    describe("Airlines.setAirlineIsVoter", async function(){
        it("Airline can not be set as voter, if the contract is not operational", async function () {
            await flightSuretyDataContract.setOperationalStatus(false, {from: TEST.contractOwner});
            await TEST.asyncTestForError(
                flightSuretyDataContract.setAirlineIsVoter,
                [TEST.firstAirline, false, {from: TEST.contractOwner}],
                TEST.ERROR.CONTRACT_NOT_OPERATIONAL
            )
        });
        it("Airline can not be set as voter, if the caller is not authorized", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.setAirlineIsVoter,
                [TEST.firstAirline, false, {from: TEST.whomever}],
                TEST.ERROR.CALLER_NOT_AUTHORIZED
            );
        });
        it("Airline can not be set as voter, if it does not exists", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.setAirlineIsVoter,
                [TEST.notRegisteredAirline, false, {from: TEST.contractOwner}],
                TEST.ERROR.AIRLINE_NOT_EXIST
            );
        });
        it("Airline can be set as voter when the contract is operational, the caller is authorized and airline exists", async function () {
            await flightSuretyDataContract.setAirlineIsVoter(TEST.firstAirline, false, {from: TEST.contractOwner});
            let airline = await flightSuretyDataContract.getAirline(TEST.firstAirline, {from: TEST.whomever});
            TEST.assertAirline(
                {
                    airlineAddress: TEST.firstAirline,
                    id: "1",
                    isVoter: false
                },
                airline
            );
        });
    });

    describe("Flights.createFlight /getFlight", async function(){
        it("Flight can not be created when the contract is not operational", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.createFlight,
                [TEST.flightOne.flight, TEST.flightOne.departure, TEST.firstAirline, {from: TEST.contractOwner}],
                TEST.ERROR.CONTRACT_NOT_OPERATIONAL
            );
        });
        it("Flight can not be created when the caller is not authorized", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.createFlight,
                [TEST.flightOne.flight, TEST.flightOne.departure, TEST.firstAirline, {from: TEST.whomever}],
                TEST.ERROR.CALLER_NOT_AUTHORIZED
            );
        });
        it("Flight can not be created when the airline does not exists", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.createFlight,
                [TEST.flightOne.flight, TEST.flightOne.departure, TEST.firstAirline, {from: TEST.contractOwner}],
                TEST.ERROR.AIRLINE_NOT_EXIST
            );
        });
        it("Flight can not be created when it has departed already", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.createFlight,
                [TEST.flightThatHasDeparted.flight, TEST.flightThatHasDeparted.departure, TEST.firstAirline, {from: TEST.contractOwner}],
                TEST.ERROR.FLIGHT_DEPARTED
            );
        });
        it("Flight can be created when the contract is operational, and the caller is authorized, and the airline exists, and the it has not yet departed", async function () {
            let newFlightId;
            flightSuretyDataContract.FlightAvailableForInsurance().on("data", event => {
                newFlightId = event.returnValues.id
            });
            await flightSuretyDataContract.createFlight(
                TEST.flightOne.flight,
                TEST.flightOne.departure,
                TEST.firstAirline,
                {from: TEST.contractOwner}
            );
            let flight = await flightSuretyDataContract.getFlight(newFlightId, {from: TEST.whomever});
            let key = await flightSuretyDataContract.createFlightKey(TEST.firstAirline, TEST.flightOne.flight, TEST.flightOne.departure, {from: TEST.contractOwner});
            TEST.assertFlight(
                {
                    id: "1",
                    flight: TEST.flightOne.flight,
                    key: key,
                    airline: TEST.firstAirline,
                    departureStatusCode: 0,
                    departure: TEST.flightOne.departure,
                    state: "Available For Insurance"
                },
                flight
            );
        });
        it("Flight can not be read, when the contract is not operational", async function () {
            await flightSuretyDataContract.setOperationalStatus(false, {from: TEST.contractOwner});
            await TEST.asyncTestForError(
                flightSuretyDataContract.getFlight,
                [1, {from: TEST.contractOwner}],
                TEST.ERROR.CONTRACT_NOT_OPERATIONAL
            );
        });
        it("Flight can not be read, when the flight does not exist", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.getFlight,
                [1, {from: TEST.contractOwner}],
                TEST.ERROR.FLIGHT_NOT_EXIST
            );
        });

    });

    describe("Flights.getFlightIdByKey", async function(){
        it("Flight id can not be read by key, when the contract is not operational", async function () {
            await flightSuretyDataContract.setOperationalStatus(false, {from: TEST.contractOwner});
            let key = await flightSuretyDataContract.createFlightKey(TEST.firstAirline, TEST.flightOne.flight, TEST.flightOne.departure, {from: TEST.contractOwner});
            await TEST.asyncTestForError(
                flightSuretyDataContract.getFlightIdByKey,
                [key, {from: TEST.contractOwner}],
                TEST.ERROR.CONTRACT_NOT_OPERATIONAL
            );
        });
        it("Flight id can not be read by key, when the flight does not exists", async function () {
            let key = await flightSuretyDataContract.createFlightKey(TEST.firstAirline, TEST.flightOne.flight, TEST.flightOne.departure, {from: TEST.contractOwner});
            await TEST.asyncTestForError(
                flightSuretyDataContract.getFlightIdByKey,
                [key, {from: TEST.contractOwner}],
                TEST.ERROR.FLIGHT_NOT_EXIST
            );
        });
        it("Flight id can be read by key, when the contract is operational and the flight exists", async function () {
            await flightSuretyDataContract.createFlight(
                TEST.flightOne.flight,
                TEST.flightOne.departure,
                TEST.firstAirline,
                {from: TEST.contractOwner}
            );
            let key = await flightSuretyDataContract.createFlightKey(TEST.firstAirline, TEST.flightOne.flight, TEST.flightOne.departure, {from: TEST.contractOwner});
            let flightId = await flightSuretyDataContract.getFlightIdByKey(
                key,
                {from: TEST.contractOwner}
                );
            assert.equal(flightId, 1, "Unexpected flight id");
        });
    });

    describe("Flights.setUnavailableForInsurance", async function(){
        beforeEach(async ()=>{
            console.log("        Log: New flight is created");
            await flightSuretyDataContract.createFlight(
                TEST.flightOne.flight,
                TEST.flightOne.departure,
                TEST.firstAirline,
                {from: TEST.contractOwner}
            );
        });
        it("Flight can not be set unavailable for insurance, when the contract is not operational", async function () {
            await flightSuretyDataContract.setOperationalStatus(false, {from: TEST.contractOwner});
            await TEST.asyncTestForError(
                flightSuretyDataContract.setUnavailableForInsurance,
                [1, {from: TEST.contractOwner}],
                TEST.ERROR.CONTRACT_NOT_OPERATIONAL
            );
        });
        it("Flight can not be set unavailable for insurance, when the caller is not authorized", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.setUnavailableForInsurance,
                [2, {from: TEST.whomever}],
                TEST.ERROR.CALLER_NOT_AUTHORIZED
            );
        });
        it("Flight can not be set unavailable for insurance, when the flight does not exists", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.setUnavailableForInsurance,
                [2, {from: TEST.contractOwner}],
                TEST.ERROR.FLIGHT_NOT_EXIST
            );
        });
        it("Flight can  be set unavailable for insurance, when the contract is operational, the caller is authorized and the flight exists", async function () {
            flightSuretyDataContract.FlightIsNotAvailableForInsurance().on("data", async event => {
                let actual = await flightSuretyDataContract.getFlight(1);
                let key = await flightSuretyDataContract.createFlightKey(TEST.firstAirline, TEST.flightOne.flight, TEST.flightOne.departure, {from: TEST.contractOwner});
                TEST.assertFlight(
                    {
                        id: "1",
                        flight: TEST.flightOne.flight,
                        key: key,
                        airline: TEST.firstAirline,
                        departureStatusCode: 0,
                        departure: TEST.flightOne.departure,
                        state: "Unavailable For Insurance"
                    },
                    actual
                );
            });
            await flightSuretyDataContract.setUnavailableForInsurance(1, {from: TEST.contractOwner});
        });
    });

    describe("Flights.setAvailableForInsurance", async function(){
        beforeEach(async ()=>{
            console.log("        Log: New flight is created");
            await flightSuretyDataContract.createFlight(
                TEST.flightOne.flight,
                TEST.flightOne.departure,
                TEST.firstAirline,
                {from: TEST.contractOwner}
            );
            console.log("        Log: flight is set unavailable for insurance");
            await flightSuretyDataContract.setUnavailableForInsurance(1, {from: TEST.contractOwner});
        });
        it("Flight can not be set available for insurance, when the contract is not operational", async function () {
            await flightSuretyDataContract.setOperationalStatus(false, {from: TEST.contractOwner});
            await TEST.asyncTestForError(
                flightSuretyDataContract.setAvailableForInsurance,
                [1, {from: TEST.contractOwner}],
                TEST.ERROR.CONTRACT_NOT_OPERATIONAL
            );
        });
        it("Flight can not be set uvailable for insurance, when the caller is not authorized", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.setAvailableForInsurance,
                [2, {from: TEST.whomever}],
                TEST.ERROR.CALLER_NOT_AUTHORIZED
            );
        });
        it("Flight can not be set available for insurance, when the flight does not exists", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.setAvailableForInsurance,
                [2, {from: TEST.contractOwner}],
                TEST.ERROR.FLIGHT_NOT_EXIST
            );
        });
        it("Flight can  be set available for insurance, when the contract is operational, the caller is authorized and the flight exists", async function () {
            flightSuretyDataContract.FlightAvailableForInsurance().on("data", async event => {
                let actual = await flightSuretyDataContract.getFlight(1);
                let key = await flightSuretyDataContract.createFlightKey(TEST.firstAirline, TEST.flightOne.flight, TEST.flightOne.departure, {from: TEST.contractOwner});
                TEST.assertFlight(
                    {
                        id: "1",
                        flight: TEST.flightOne.flight,
                        key: key,
                        airline: TEST.firstAirline,
                        departureStatusCode: 0,
                        departure: TEST.flightOne.departure,
                        state: "Available For Insurance"
                    },
                    actual
                );
            });
            await flightSuretyDataContract.setAvailableForInsurance(1, {from: TEST.contractOwner});
        });
    });

    describe("Flights.setDepartureStatusCode", async function(){
        beforeEach(async ()=>{
            console.log("        Log: New flight is created");
            await flightSuretyDataContract.createFlight(
                TEST.flightOne.flight,
                TEST.flightOne.departure,
                TEST.firstAirline,
                {from: TEST.contractOwner}
            );
        });
        it("Flight departure status code can not be set, when the contract is not operational", async function () {
            await flightSuretyDataContract.setOperationalStatus(false, {from: TEST.contractOwner});
            await TEST.asyncTestForError(
                flightSuretyDataContract.setDepartureStatusCode,
                [1, TEST.FLIGHT_STATUS_CODE.ON_TIME, {from: TEST.contractOwner}],
                TEST.ERROR.CONTRACT_NOT_OPERATIONAL
            );
        });
        it("Flight departure status code can not be set, when the caller is not authorized", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.setDepartureStatusCode,
                [1, TEST.FLIGHT_STATUS_CODE.LATE_OTHER, {from: TEST.whomever}],
                TEST.ERROR.CALLER_NOT_AUTHORIZED
            );
        });
        it("Flight departure status code can not be set, when the flight does not exists", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.setDepartureStatusCode,
                [1, TEST.FLIGHT_STATUS_CODE.LATE_OTHER, {from: TEST.contractOwner}],
                TEST.ERROR.FLIGHT_NOT_EXIST
            );
        });
        it("Flight departure status code can be set, when the contract is operational, the caller is authorized and the flight exists", async function () {
            flightSuretyDataContract.FlightAvailableForInsurance().on("data", async event => {
                let actual = await flightSuretyDataContract.getFlight(1);
                let key = await flightSuretyDataContract.createFlightKey(TEST.firstAirline, TEST.flightOne.flight, TEST.flightOne.departure, {from: TEST.contractOwner});
                TEST.assertFlight(
                    {
                        id: "1",
                        flight: TEST.flightOne.flight,
                        key: key,
                        airline: TEST.firstAirline,
                        departureStatusCode: TEST.FLIGHT_STATUS_CODE.LATE_OTHER,
                        departure: TEST.flightOne.departure,
                        state: "Available For Insurance"
                    },
                    actual
                );
            });
            await flightSuretyDataContract.setDepartureStatusCode(1, TEST.FLIGHT_STATUS_CODE.LATE_OTHER, {from: TEST.contractOwner});
        });
    });

    describe("Insurances.createInsurance/ getInsurace", async function(){
        beforeEach(async ()=>{
            console.log("        Log: New flight is created");
            await flightSuretyDataContract.createFlight(
                TEST.flightOne.flight,
                TEST.flightOne.departure,
                TEST.firstAirline,
                {from: TEST.contractOwner}
            );
        });
        it("Insurance can not be created, when the contract is not operational", async function () {
            await flightSuretyDataContract.setOperationalStatus(false, {from: TEST.contractOwner});
            await TEST.asyncTestForError(
                flightSuretyDataContract.createInsurance,
                [TEST.insuranceOne.flightId, TEST.insuranceOne.paid, TEST.insuranceOne.passenger, {from: TEST.contractOwner}],
                TEST.ERROR.CONTRACT_NOT_OPERATIONAL
            );
        });
        it("Insurance can not be created, when the caller is not authorized", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.createInsurance,
                [TEST.insuranceOne.flightId, TEST.insuranceOne.paid, TEST.insuranceOne.passenger, {from: TEST.contractOwner}],
                TEST.ERROR.CALLER_NOT_AUTHORIZED
            );
        });
        it("Insurance can not be created, when the flight does not exists", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.createInsurance,
                [2, TEST.insuranceOne.paid, TEST.insuranceOne.passenger, {from: TEST.contractOwner}],
                TEST.ERROR.FLIGHT_NOT_EXIST
            );
        });
        it("Insurance can not be created, when the flight is not available for insurance", async function () {
            await flightSuretyDataContract.setUnavailableForInsurance(1, {from: TEST.contractOwner});
            await TEST.asyncTestForError(
                flightSuretyDataContract.createInsurance,
                [TEST.insuranceOne.flightId, TEST.insuranceOne.paid, TEST.insuranceOne.passenger, {from: TEST.contractOwner}],
                TEST.ERROR.FLIGHT_NOT_AVAILABLE_FOR_INSURANCE
            );
        });
        it("Insurance can be created, when the contract is operational, the caller is authorized, the flight exists and is available for insurance", async function () {
            let newInsuranceId;
            flightSuretyDataContract.InsuranceActive().on("data", event => {
                newInsuranceId = event.returnValues.id
            });
            await flightSuretyDataContract.createInsurance(
                TEST.insuranceOne.flightId, TEST.insuranceOne.paid, TEST.insuranceOne.passenger, {from: TEST.contractOwner}
            );
            let insurance = await flightSuretyDataContract.getInsurance(newInsuranceId, {from: TEST.whomever});
            TEST.assertInsurance(
                {
                    id: 1,
                    flightId: 1,
                    amountPaid: TEST.insuranceOne.paid,
                    owner: TEST.insuranceOne.passenger,
                    state: "Active"
                },
                insurance
            );
        });
        it("Insurance can not be read, when the contract is not operational", async function () {
            await flightSuretyDataContract.createInsurance(
                TEST.insuranceOne.flightId, TEST.insuranceOne.paid, TEST.insuranceOne.passenger, {from: TEST.contractOwner}
            );
            await flightSuretyDataContract.setOperationalStatus(false, {from: TEST.contractOwner});
            await TEST.asyncTestForError(
                flightSuretyDataContract.getInsurance,
                [1, {from: TEST.contractOwner}],
                TEST.ERROR.CONTRACT_NOT_OPERATIONAL
            );
        });
        it("Insurance can not be read, when it does not exist", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.getInsurance,
                [1, {from: TEST.contractOwner}],
                TEST.ERROR.INSURANCE_NOT_EXIST
            );
        });
    });

    describe("Insurances.getInsurancesByFlight/ getInsurancesByPassenger", async function(){
        beforeEach(async ()=>{
            console.log("        Log: New flight is created");
            await flightSuretyDataContract.createFlight(
                TEST.flightOne.flight,
                TEST.flightOne.departure,
                TEST.firstAirline,
                {from: TEST.contractOwner}
            );
            await flightSuretyDataContract.createFlight(
                TEST.flightTwo.flight,
                TEST.flightTwo.departure,
                TEST.firstAirline,
                {from: TEST.contractOwner}
            );
            console.log("        Log: Insurances created");
            let insurances = [TEST.insuranceOne, TEST.insuranceTwo, TEST.insuranceThree, TEST.insuranceFour]
            insurances.forEach(async insurance =>{
                await flightSuretyDataContract.createInsurance(
                    insurance.flightId, insurance.paid, insurance.passenger,
                    {from: TEST.contractOwner}
                )
            });
        });

        it("Insurances can not be read, when the contract is not operational", async function () {
            await flightSuretyDataContract.setOperationalStatus(false, {from: TEST.contractOwner});
            await TEST.asyncTestForError(
                flightSuretyDataContract.getInsurancesByFlight,
                [TEST.insuranceOne.flightId, {from: TEST.contractOwner}],
                TEST.ERROR.CONTRACT_NOT_OPERATIONAL
            );
            await TEST.asyncTestForError(
                flightSuretyDataContract.getInsurancesByPassenger,
                [TEST.insuranceOne.passenger, {from: TEST.contractOwner}],
                TEST.ERROR.CONTRACT_NOT_OPERATIONAL
            );
        });

        it("Insurances can be read by flight or passenger, when the contract is operational", async function () {
            let byFlightId = await flightSuretyDataContract.getInsurancesByFlight(TEST.insuranceOne.flightId, {from: TEST.whomever});
            let byPassenger = await flightSuretyDataContract.getInsurancesByPassenger(TEST.insuranceThree.passenger, {from: TEST.whomever});
            let expectedIdsByFlightId = [1, 4];
            let expectedIdsByPassengerId = [3, 4];
            byFlightId.forEach((insuranceId, index) => {
                assert.equal(insuranceId.toNumber(), expectedIdsByFlightId[index], "Unexpected Insurance Id found");
            });
            byPassenger.forEach((insuranceId, index) => {
                assert.equal(insuranceId.toNumber(), expectedIdsByPassengerId[index], "Unexpected Insurance Id found");
            });
        });
    });

    describe("Insurance.creditInsurance/ CreditedAmount.getCreditedAmount", async function(){
        beforeEach(async ()=>{
            console.log("        Log: New flight is created");
            await flightSuretyDataContract.createFlight(
                TEST.flightOne.flight,
                TEST.flightOne.departure,
                TEST.firstAirline,
                {from: TEST.contractOwner}
            );
            await flightSuretyDataContract.createInsurance(
                TEST.insuranceOne.flightId, TEST.insuranceOne.paid, TEST.insuranceOne.passenger,
                {from: TEST.contractOwner}
                );
        });
        it("Insurance can not be credited, when the contract is not operational", async function () {
            await flightSuretyDataContract.setOperationalStatus(false, {from: TEST.contractOwner});
            await TEST.asyncTestForError(
                flightSuretyDataContract.creditInsurance,
                [1, TEST.insuranceOne.credit, {from: TEST.contractOwner}],
                TEST.ERROR.CONTRACT_NOT_OPERATIONAL
            );
        });
        it("Insurance can not be credited, when the caller is not authorized", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.creditInsurance,
                [1, TEST.insuranceOne.credit,{from: TEST.whomever}],
                TEST.ERROR.CALLER_NOT_AUTHORIZED
            );
        });
        it("Insurance can not be credited, when it does not exist", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.creditInsurance,
                [5, TEST.insuranceOne.credit,{from: TEST.contractOwner}],
                TEST.ERROR.INSURANCE_NOT_EXIST
            );
        });
        it("Insurance can not be credited, when it is not Active", async function () {
            await flightSuretyDataContract.creditInsurance(1, TEST.insuranceOne.credit, {from: TEST.contractOwner});
            await TEST.asyncTestForError(
                flightSuretyDataContract.creditInsurance,
                [1, TEST.insuranceOne.credit, {from: TEST.contractOwner}],
                TEST.ERROR.INSURANCE_NOT_ACTIVE
            );
        });
        it("Insurance can be credited, when the contract is operational, the called is authorized, the insurance exists, the insurance is Active " , async function () {
            await flightSuretyDataContract.creditInsurance(1, TEST.insuranceOne.credit, {from: TEST.contractOwner});
            let actual = await flightSuretyDataContract.getInsurance(1, {from: TEST.whomever});
            TEST.assertInsurance(
                {
                    id: 1,
                    flightId: TEST.insuranceOne.flightId,
                    amountPaid: TEST.insuranceOne.paid,
                    owner: TEST.insuranceOne.passenger,
                    state: "Credited"
                },
                actual);
            let creditedAmount = await flightSuretyDataContract.getCreditedAmount(TEST.insuranceOne.passenger, {from: TEST.whomever});
            let expectedCreditedAmount = TEST.toBN(TEST.insuranceOne.paid).mul(TEST.toBN(3)).div(TEST.toBN(2));
            let isEqual = TEST.toBN(creditedAmount).eq(expectedCreditedAmount);
            assert.equal(isEqual, true, "Unexpected credited amount");
        });
        it("Credited Amount can not be read, when the contract is not operational", async function () {
            await flightSuretyDataContract.setOperationalStatus(false, {from: TEST.contractOwner});
            await TEST.asyncTestForError(
                flightSuretyDataContract.getCreditedAmount,
                [TEST.insuranceOne.passenger, {from: TEST.contractOwner}],
                TEST.ERROR.CONTRACT_NOT_OPERATIONAL
            );
        });
    });

    describe("CreditedAmount.withdrawCreditedAmount", async function(){
        beforeEach(async ()=>{
            console.log("        Log: New flight is created");
            await flightSuretyDataContract.createFlight(
                TEST.flightOne.flight,
                TEST.flightOne.departure,
                TEST.firstAirline,
                {from: TEST.contractOwner}
            );
            await flightSuretyDataContract.createInsurance(
                TEST.insuranceOne.flightId, TEST.insuranceOne.paid, TEST.insuranceOne.passenger,
                {from: TEST.contractOwner}
            );
            await flightSuretyDataContract.creditInsurance(1, TEST.insuranceOne.credit, {from:TEST.contractOwner});
        });

        it("Credited amount can not be withdrawn, when the contract is not operational", async function () {
            await flightSuretyDataContract.setOperationalStatus(false, {from: TEST.contractOwner});
            await TEST.asyncTestForError(
                flightSuretyDataContract.withdrawCreditedAmount,
                [TEST.withdrawAmount.amount, TEST.withdrawAmount.passenger, {from: TEST.contractOwner}],
                TEST.ERROR.CONTRACT_NOT_OPERATIONAL
            );
        });
        it("Credited amount can not be withdrawn, when the caller is not authorized", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.withdrawCreditedAmount,
                [TEST.withdrawAmount.amount, TEST.withdrawAmount.passenger, {from: TEST.whomever}],
                TEST.ERROR.CALLER_NOT_AUTHORIZED
            );
        });
        it("Credited amount can not be withdrawn, when the amount to withdraw is higher than the current credited amount", async function () {
            await TEST.asyncTestForError(
                flightSuretyDataContract.withdrawCreditedAmount,
                [TEST.withdrawAmount.amountThatIsMoreThanCurrentCreditedAmount, TEST.withdrawAmount.passenger, {from: TEST.contractOwner}],
                TEST.ERROR.CREDITED_AMOUNT_TOO_LOW
            );
        });

        it("Credited amount can be withdrawn, when the contract is operational, the amount to withdraw is lower than the current credited amount", async function () {
            let passengerOneAmountBefore = await TEST.currentBalanceAsBN(TEST.insuranceOne.passenger);
            await flightSuretyDataContract.withdrawCreditedAmount(TEST.withdrawAmount.amount, TEST.withdrawAmount.passenger, {from: TEST.contractOwner});
            let amountCredited = TEST.toBN(TEST.insuranceOne.paid).mul(TEST.toBN(3)).div(TEST.toBN(2));
            let withdrawnAmount = TEST.toBN(TEST.withdrawAmount.amount);
            let expectedAmountAfter = TEST.toBN(amountCredited.sub(withdrawnAmount));
            let actualAmountAfter = TEST.toBN(
                await flightSuretyDataContract.getCreditedAmount(TEST.insuranceOne.passenger, {from: TEST.whomever})
            );
            assert.equal(expectedAmountAfter.eq(actualAmountAfter), true, "Unexpected amount after withdraw");

            let passengerOneAmountAfter = await TEST.currentBalanceAsBN(TEST.insuranceOne.passenger);
            assert.equal(passengerOneAmountBefore.add(withdrawnAmount).eq(passengerOneAmountAfter), true, "Unexpected passenger balance");
        });

    });
});