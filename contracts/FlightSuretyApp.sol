pragma solidity ^0.4.25;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

/************************************************** */
/* FlightSuretyApp Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    FlightSuretyData dataContract;
    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner;          // Account used to deploy contract

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
    }
    mapping(bytes32 => Flight) private flights;

    bool private contractIsOperational;

    uint private constant AIRLINES_COUNT_TO_REQUIRE_CONSENSUS = 4;

    // SafeMath does not support division, so I will trick it with inverse threshold for consensus
    // Here if you want to set 50% of voters as consensus, you need to set:
    // TOTAL_VOTERS_CONSENSUS_MULT = 1
    // SIGNED_UNIQUE_VOTERS_CONSENSUS_MULT = 2
    // The percentage of voters required to consensus is: TOTAL_VOTERS_CONSENSUS_MULT / SIGNED_UNIQUE_VOTERS_CONSENSUS_MULT
    // Hence in our case it is 50%.
    // Now, if you want to set another threshold, like 60%:
    // TOTAL_VOTERS_CONSENSUS_MULT = 3;
    // SIGNED_UNIQUE_VOTERS_CONSENSUS_MULT = 5;
    // But what you would like to have in prod is the method exposed by the contract to modify these...
    uint8 private constant TOTAL_VOTERS_CONSENSUS_MULT = 1;
    uint8 private constant SIGNED_UNIQUE_VOTERS_CONSENSUS_MULT = 2;

    address[] private uniqueVoters;

    uint private registrationFee;

 
    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    modifier verifyIsOperational()
    {
        require(contractIsOperational == true, "Contract is currently not operational");
        _;
    }

    modifier verifyCallerIs(address _address){
        require(msg.sender == _address, "Current caller can not invoke this operation.");
        _;
    }

    modifier verifyIsChange(bool currentValue, bool newValue) {
        require(currentValue != newValue, "Current value is the same as new value");
        _;
    }

    modifier verifyCallerIsRegisteredAirline(){
        uint airlinesCount = dataContract.getAirlinesCount();
        (address _address, uint id, bool isVoter) = dataContract.getAirline(msg.sender);

        if(airlinesCount <= AIRLINES_COUNT_TO_REQUIRE_CONSENSUS) {
            require(id > 0, "Current caller can not invoke this operation, b/c it is not registered airline.");
        }
        _;
    }

    modifier verifyHasAlreadyVoted(){
        uint airlinesCount = dataContract.getAirlinesCount();
        if(airlinesCount > AIRLINES_COUNT_TO_REQUIRE_CONSENSUS) {
            bool hasAlreadyVoted = false;
            for(uint i = 0; i < uniqueVoters.length; i++){
                if(uniqueVoters[i] == msg.sender){
                    hasAlreadyVoted = true;
                }
            }
            require(hasAlreadyVoted == false, "The caller has already voted");
        }
        _;
    }

    modifier verifyHasPaidRegistrationFee(){
        (address _address, uint id, bool isVoter) = dataContract.getAirline(msg.sender);
        require(isVoter == true, "Airline has to pay registration fee to be able to vote");
        _;
    }

    modifier hasPaidEnough(){
        require(msg.value >= registrationFee, "Paid amount is less than registration fee");
        _;
    }

    modifier returnChangeForExcessToSender(){
        _;
        uint change = msg.value - registrationFee;
        msg.sender.transfer(change);
    }

    constructor
    (address dataContractAddress)
    public
    {
        dataContract = FlightSuretyData(dataContractAddress);
        contractIsOperational = true;
        contractOwner = msg.sender;
        uniqueVoters = new address[](0);
        registrationFee = 10 ether;

        dataContract.createAirline(contractOwner, true);
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function getOperationalStatus
    ()
    public view
    returns(bool)
    {
        return contractIsOperational;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function setOperationalStatus
    (bool status)
    verifyIsChange(contractIsOperational, status)
    verifyCallerIs(contractOwner)
    public
    {
        contractIsOperational = status;
    }

    function payRegistrationFee
    ()
    verifyIsOperational
    verifyCallerIsRegisteredAirline
    hasPaidEnough
    returnChangeForExcessToSender
    external
    payable
    {
        msg.sender.transfer(msg.value);
        dataContract.setAirlineIsVoter(msg.sender, true);
    }
  
   /**
    * @dev Add an airline to the registration queue
    *
    */
    function registerAirline
    (address _address)
    external
    verifyIsOperational
    verifyCallerIsRegisteredAirline
    verifyHasPaidRegistrationFee
    verifyHasAlreadyVoted
    returns(bool success, uint256 votes)
    {
        uint airlinesCount = dataContract.getAirlinesCount();
        if(airlinesCount < AIRLINES_COUNT_TO_REQUIRE_CONSENSUS) {
            dataContract.createAirline(_address, false);
            return (true, 0);
        }
        else {
            if(uniqueVoters.length.mul(SIGNED_UNIQUE_VOTERS_CONSENSUS_MULT) > airlinesCount.mul(TOTAL_VOTERS_CONSENSUS_MULT)){
                dataContract.createAirline(_address, false);
                uniqueVoters = new address[](0);
                return (true, uniqueVoters.length);
            }
            else {
                uniqueVoters.push(msg.sender);
                return (false, uniqueVoters.length);
            }
        }
    }

    function getAirline
    (address _address)
    public
    view
    returns (address airlineAddress, uint id, bool isVoter)
    {
        return dataContract.getAirline(_address);
    }


   /**
    * @dev Register a future flight for insuring.
    *
    */  
    function registerFlight
    ()
    external
    verifyIsOperational
    {

    }
    
   /**
    * @dev Called after oracle has updated flight status
    *
    */  
    function processFlightStatus
    (address airline, string memory flight, uint256 timestamp, uint8 statusCode)
    internal pure
    {

    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
    (address airline, string flight, uint256 timestamp)
    external
    verifyIsOperational
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo(
            {
                requester: msg.sender,
                isOpen: true
            }
        );

        emit OracleRequest(index, airline, flight, timestamp);
    } 


// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle
    ()
    external
    payable
    verifyIsOperational
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes
    ()
    view
    external
    verifyIsOperational
    returns(uint8[3])
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }


    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
    (uint8 index, address airline, string flight, uint256 timestamp, uint8 statusCode)
    external
    verifyIsOperational
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }


    function getFlightKey
    (address airline, string flight, uint256 timestamp)
    pure
    internal
    returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
    (address account)
    internal
    returns(uint8[3])
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
    (address account)
    internal
    returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}

contract FlightSuretyData {
    function createAirline(address airlineAddress, bool isVoter);
    function getAirlinesCount() returns (uint);
    function isAirlineRegistered(address _address);
    function getAirline(address _address) returns (address, uint, bool);
    function setAirlineIsVoter(address _address, bool isVoter);
}
