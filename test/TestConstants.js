module.exports = function (accounts, web3){
    var result;
    try {
        result = {
            contractOwner: accounts[0],
            firstAirline: accounts[0],
            secondAirline: accounts[1],
            thirdAirline: accounts[2],
            fourthAirline: accounts[3],
            fifthAirline: accounts[4],
            sixthAirline: accounts[5],
            veryRichGuy: accounts[6],
            notRegisteredAirline: accounts[9],
            whomever: accounts[9],
            registrationFee:  web3.utils.toWei("10", "ether"),
            currentBalanceAsBN: async function(address){
                let balanceString = await web3.eth.getBalance(address);
                return web3.utils.toBN(balanceString);
            },
            toBN: function(str){
                return web3.utils.toBN(str);
            },
            asyncTestForError: async function(testCall, args, errorMessage){
                try {
                    await testCall.apply(this, args);
                } catch (e) {
                    // console.log(e.message);
                    try {
                        assert.equal(e.message.includes(errorMessage), true, "Unexpected error message");
                    } catch (err) {
                        console.log(e);
                        throw err;
                    }
                }
            },
            nullAddress: "0x0000000000000000000000000000000000000000",
            assertAirline: function(expected, actual){
                assert.equal(actual.airlineAddress, expected.address, "Unexpected airline address");
                assert.equal(actual.id, expected.id, "Unexpected airline id");
                assert.equal(actual.isVoter, expected.isVoter, "Unexpected isVoter status");
            },
            flightOne: {
                flight: "SU 1925",
                departure: new Date("2019-04-22T10:00:00+03:00").valueOf()/1000
            },
            flightTwo: {
                flight: "SU 2567",
                departure: new Date("2019-04-22T11:25:00+03:00").valueOf()/1000
            },
            flightThatHasDeparted: {
                flight: "SU 1925",
                departure: new Date("2019-04-12T10:00:00+03:00").valueOf()/1000
            },
            assertFlight: function(expected, actual) {
                try{
                    assert.equal(actual.id, expected.id, "Unexpected flight id");
                    assert.equal(actual.flight, expected.flight, "Unexpected flight code");
                    assert.equal(actual.key, expected.key, "Unexpected flight key");
                    assert.equal(actual.airlineAddress, expected.airline, "Unexpected airline address");
                    assert.equal(actual.departureTimestamp.toNumber(), expected.departure, "Unexpected departure timestamp");
                    assert.equal(actual.departureStatusCode, expected.departureStatusCode, "Unexpected departure status code");
                    assert.equal(actual.state, expected.state, "Unexpected flight state");
                } catch (e) {
                    console.log(actual);
                    throw e;
                }
            },
            assertInsurance: function(expected, actual) {
                try{
                    assert.equal(actual.id, expected.id, "Unexpected insurance id");
                    assert.equal(actual.flightId, expected.flightId, "Unexpected flight id");
                    assert.equal(this.toBN(actual.amountPaid).eq(this.toBN(expected.amountPaid)), true, "Unexpected amount paid");
                    assert.equal(actual.owner, expected.owner, "Unexpected owner");
                    assert.equal(actual.state, expected.state, "Unexpected insurance state");
                } catch (e) {
                    console.log(actual);
                    throw e;
                }
            },
            ERROR: {
                CONTRACT_NOT_OPERATIONAL: "Contract is currently not operational",
                CALLER_NOT_AUTHORIZED: "The caller is not authorized to call this operation",
                CALLER_NOT_CONTRACT_OWNER: "Current caller can not invoke this operation",
                AIRLINE_NOT_EXIST: "Airline with given address does not exists",
                FLIGHT_DEPARTED: "Flight has been departed already, so it makes no sense to sell insurances for it",
                FLIGHT_NOT_EXIST: "Flight does not exists in the system",
                FLIGHT_NOT_AVAILABLE_FOR_INSURANCE: "The flight is not available for insurance",
                INSURANCE_NOT_EXIST: "Insurance does not exists in the system",
                INSURANCE_NOT_ACTIVE: "The insurance can not be credited, b/c it is not Active",
                CREDITED_AMOUNT_TOO_LOW: "The address does not have requested amount of funds to withdraw"
            },
            FLIGHT_STATUS: {
                ON_TIME: 10,
                LATE_AIRLINE: 20,
                LATE_WEATHER: 30,
                LATE_TECHNICAL: 40,
                LATE_OTHER: 50
            },
            insuranceOne: {
                flightId: 1,
                passenger: accounts[9],
                paid: web3.utils.toWei("0.5", "ether"),
                credit: web3.utils.toWei("0.75", "ether")
            },
            insuranceTwo: {
                flightId: 2,
                passenger: accounts[8],
                paid: web3.utils.toWei("0.1", "ether")
            },
            insuranceThree: {
                flightId: 2,
                passenger: accounts[7],
                paid: web3.utils.toWei("0.75", "ether")
            },
            insuranceFour: {
                flightId: 1,
                passenger: accounts[7],
                paid: web3.utils.toWei("1", "ether")
            },
            withdrawAmount: {
                passenger: accounts[9],
                amount: web3.utils.toWei("0.3", "ether"),
                amountThatIsMoreThanCurrentCreditedAmount: web3.utils.toWei("2", "ether")
            }
        }
    } catch (e) {
        console.log(e);
        assert.fail("The TEST setup has failed");
    }
    return result;
};