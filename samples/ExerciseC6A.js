
var Test = require('../config/testConfig.js');

contract('ExerciseC6A', async (accounts) => {

  var config;
  beforeEach('setup contract', async () => {
    config = await Test.Config(accounts);
  });

  it('contract owner can register new user', async () => {
    
    // ARRANGE
    let caller = accounts[0]; // This should be config.owner or accounts[0] for registering a new user
    let newUser = config.testAddresses[0]; 

    // ACT
    await config.exerciseC6A.registerUser(newUser, false, {from: caller});
    let result = await config.exerciseC6A.isUserRegistered.call(newUser); 

    // ASSERT
    assert.equal(result, true, "Contract owner cannot register new user");

  });

  // it("contract owner can stop and resume the contract", async () => {
  //   await config.exerciseC6A.setOperational(false, {from: accounts[0]});
  //   await config.exerciseC6A.setOperational(false, {from: accounts[1]});
  //   let newUser = config.testAddresses[0];
  //
  //   try {
  //     await config.exerciseC6A.registerUser(newUser, false, {from: accounts[0]});
  //   } catch (e) {
  //       console.log(e.message);
  //       assert.equal(e.message.includes("Contract is not operational at this moment"), true);
  //   }
  //
  // });

  it("contract operational status may be changed only if two Users with Admin role will sign the operation", async () =>{
      await config.exerciseC6A.registerUser(accounts[1], true);
      await config.exerciseC6A.registerUser(accounts[2], true);
      await config.exerciseC6A.setOperational(false, {from: accounts[1]});
      let isOperational = await config.exerciseC6A.getIsOperational();
      assert.equal(isOperational, true);

      await config.exerciseC6A.setOperational(false, {from: accounts[2]});
      isOperational = await config.exerciseC6A.getIsOperational();
      assert.equal(isOperational, false);
  });

});
