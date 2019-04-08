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
            notRegisteredAirline: accounts[9],
            nullAddress: "0x0000000000000000000000000000000000000000",
        }
    } catch (e) {
        console.log(e);
        assert.fail("The TEST setup has failed");
    }
    return result;
};