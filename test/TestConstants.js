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
            registrationFee:  web3.utils.toWei("10", "ether"),
            currentBalanceAsBN: async function(address){
                let balanceString = await web3.eth.getBalance(address);
                return web3.utils.toBN(balanceString);
            },
            toBN: function(str){
                return web3.utils.toBN(str);
            },
            nullAddress: "0x0000000000000000000000000000000000000000",
        }
    } catch (e) {
        console.log(e);
        assert.fail("The TEST setup has failed");
    }
    return result;
};