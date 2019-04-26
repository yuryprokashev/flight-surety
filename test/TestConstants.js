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
                assert.equal(actual.airlineAddress, expected.airlineAddress, "Unexpected airline address");
                assert.equal(actual.id, expected.id, "Unexpected airline id");
                assert.equal(actual.isVoter, expected.isVoter, "Unexpected isVoter status");
            },
            flightOne: {
                flight: "SU 1925",
                departure: (Math.ceil(new Date().valueOf()/1000)) + 24*60*60
            },
            flightTwo: {
                flight: "SU 2567",
                departure: (Math.ceil(new Date().valueOf()/1000)) + 23*60*60
            },
            flightThatHasDeparted: {
                flight: "SU 1925",
                departure: (Math.ceil(new Date().valueOf()/1000)) - 2*60*60
            },
            assertFlight: function(expected, actual) {
                try{
                    assert.equal(actual.id, expected.id, "Unexpected flight id");
                    assert.equal(actual.flight, expected.flight, "Unexpected flight code");
                    assert.equal(actual.key, expected.key, "Unexpected flight key");
                    assert.equal(actual.airlineAddress, expected.airline, "Unexpected airline address");
                    assert.equal(actual.departureTimestamp.toNumber(), expected.departure, "Unexpected departure timestamp");
                    assert.equal(actual.departureStatusCode.toNumber(), expected.departureStatusCode, "Unexpected departure status code");
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
                CREDITED_AMOUNT_TOO_LOW: "The address does not have requested amount of funds to withdraw",
                HAS_ALREADY_VOTED: "The caller has already voted",
                REG_FEE_NOT_PAID: "Airline has to pay registration fee to be able to vote",
                NOT_ENOUGH_VALUE: "The message value is less than required amount",
                EXCEED_CAP: "The value exceeds the current cap",
                INVALID_CONSENSUS_MULTIPLIERS: "Consensus will never be reached, b/c you want it more than 100%"

            },
            INSURANCE_STATE: {
                ACTIVE: "Active",
                EXPIRED: "Expired",
                CREDITED: "Credited"
            },
            FLIGHT_STATE: {
                AVAILABLE: "Available For Insurance",
                UNAVAILABLE: "Unavailable For Insurance"
            },
            FLIGHT_STATUS_CODE: {
                UNKNOWN: 0,
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
            insuranceThatExceedCap:{
                flightId: 1,
                passenger: accounts[7],
                paid: web3.utils.toWei("2", "ether")
            },
            withdrawAmount: {
                passenger: accounts[9],
                amount: web3.utils.toWei("0.3", "ether"),
                amountThatIsMoreThanCurrentCreditedAmount: web3.utils.toWei("2", "ether")
            },
            newRegistrationFee: web3.utils.toWei("15", "ether"),
            newInsuranceCap : web3.utils.toWei("2", "ether"),
            newConsensusMultipliers: {
                numerator: 1,
                denominator: 3
            },
            invalidConsensusMultipliers: {
                numerator: 3,
                denominator: 2
            },
            lessThatRegistrationFee: web3.utils.toWei("5", "ether"),
            insurancePremiumMultiplier: {
                numerator: 3,
                denominator: 2
            },
            oracleAppConfig: {
                numOracles: 20,
                statusCodes: [0, 10, 20, 30, 40, 50],
                airlineStatusCodeProbability: 0.8
            }
        }
    } catch (e) {
        console.log(e);
        assert.fail("The TEST setup has failed");
    }
    return result;
};