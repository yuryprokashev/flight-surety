pragma solidity 0.4.24;

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

    address private contractOwner;

    bool private contractIsOperational;

    uint8 private constant AIRLINES_COUNT_TO_REQUIRE_CONSENSUS = 4;
    address[] private uniqueVoters;
    // SafeMath does not support division, so I will trick it with inverse threshold for consensus
    // Here if you want to set 50% of voters as consensus, you need to set:
    // totalVoterConsensus = 1
    // uniqueVoterConsensus = 2
    // The percentage of voters required to consensus is: totalVoterConsensus / uniqueVotersConsensus
    // Hence in our case it is 50%.
    // Now, if you want to set another threshold, like 60%:
    // totalVoterConsensus = 3;
    // uniqueVoterConsensus = 5;
    // But what you would like to have in prod is the method exposed by the contract to modify these...
    uint8 private totalVoterConsensus;
    uint8 private uniqueVoterConsensus;
    event ConsensusMultipliersUpdate(uint8 oldNumerator, uint8 oldDenominator, uint8 newNumerator, uint8 newDenominator);

    uint private registrationFee;
    event RegistrationFeeUpdate(uint oldFee, uint newFee);

    uint private insuranceCap;
    event InsuranceCapUpdate(uint oldCap, uint newCap);

    uint8 private insurancePremiumNumerator;
    uint8 private insurancePremiumDenominator;
    event InsuranceMultipliersUpdate(uint8 oldNumerator, uint8 oldDenominator, uint8 newNumerator, uint8 newDenominator);

    event VoteCounted(bool isConsensusReached, uint voteCount, uint totalCount);
    event RegistrationFeePaid(address airlineAddress, uint fee);
    event AirlineRegistered(address airlineAddress);

    modifier verifyIsOperational()
    {
        require(contractIsOperational == true, "Contract is currently not operational");
        _;
    }

    modifier verifyCallerIs(address _address)
    {
        require(msg.sender == _address, "Current caller can not invoke this operation.");
        _;
    }

    modifier verifyCallerIsRegisteredAirline()
    {
        // Below call will fail, b/c dataContract.getAirline has modifies, that checks if the airline exists
        (address _address, uint id, bool isVoter) = dataContract.getAirline(msg.sender);
        _;
    }

    modifier verifyHasAlreadyVoted()
    {
        uint airlinesCount = dataContract.getAirlinesCount();
        if(airlinesCount >= AIRLINES_COUNT_TO_REQUIRE_CONSENSUS) {
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

    modifier verifyHasPaidRegistrationFee()
    {
        (address _address, uint id, bool isVoter) = dataContract.getAirline(msg.sender);
        require(isVoter == true, "Airline has to pay registration fee to be able to vote");
        _;
    }

    modifier hasPaidEnough(uint requiredAmount)
    {
        require(msg.value >= requiredAmount, "The message value is less than required amount");
        _;
    }

    modifier returnChangeForExcessToSender(uint requiredAmount)
    {
        _;
        uint change = msg.value.sub(requiredAmount);
        msg.sender.transfer(change);
    }

    modifier verifyValueLessThanOrEqualToCap(uint cap)
    {
        require(msg.value <= cap, "The value exceeds the current cap");
        _;
    }

    modifier verifyNumeratorIsLessOrEqualToDenominator(uint8 numerator, uint8 denominator)
    {
        require(numerator <= denominator, "Consensus will never be reached, b/c you want it more than 100%");
        _;
    }

    constructor
    (address dataContractAddress)
    public
    {
        contractOwner = msg.sender;

        contractIsOperational = true;

        uniqueVoters = new address[](0);

        registrationFee = 10 ether;

        insuranceCap = 1 ether;

        totalVoterConsensus = 1;

        uniqueVoterConsensus = 2;

        insurancePremiumNumerator = 3;

        insurancePremiumDenominator = 2;

        dataContract = FlightSuretyData(dataContractAddress);
    }

    // Contract Management Resource
    function getOperationalStatus
    ()
    public
    view
    returns(bool)
    {
        return contractIsOperational;
    }

    function setOperationalStatus
    (bool status)
    verifyCallerIs(contractOwner)
    public
    {
        contractIsOperational = status;
    }

    function getRegistrationFee
    ()
    verifyIsOperational
    public
    view
    returns (uint)
    {
        return registrationFee;
    }

    function setRegistrationFee
    (uint _fee)
    verifyIsOperational
    verifyCallerIs(contractOwner)
    public
    {
        uint oldFee = registrationFee;
        registrationFee = _fee;
        emit RegistrationFeeUpdate(oldFee, registrationFee);
    }

    function getInsuranceCap
    ()
    verifyIsOperational
    public
    view
    returns (uint)
    {
        return insuranceCap;
    }

    function setInsuranceCap
    (uint _cap)
    verifyIsOperational
    verifyCallerIs(contractOwner)
    public
    {
        uint oldCap = insuranceCap;
        insuranceCap = _cap;
        emit InsuranceCapUpdate(oldCap, insuranceCap);
    }

    function setConsensusMultipliers
    (uint8 numerator, uint8 denominator)
    verifyIsOperational
    verifyCallerIs(contractOwner)
    verifyNumeratorIsLessOrEqualToDenominator(numerator, denominator)
    public
    {
        uint8 oldNum = totalVoterConsensus;
        uint8 oldDenom = uniqueVoterConsensus;
        uniqueVoterConsensus = denominator;
        totalVoterConsensus = numerator;
        emit ConsensusMultipliersUpdate(oldNum, oldDenom, totalVoterConsensus, uniqueVoterConsensus);
    }

    function getConsensusMultipliers
    ()
    verifyIsOperational
    public
    view
    returns (uint8 numerator, uint8 denominator)
    {
        return (totalVoterConsensus, uniqueVoterConsensus);
    }

    // Airline Resource
    function payRegistrationFee
    ()
    verifyIsOperational
    verifyCallerIsRegisteredAirline
    hasPaidEnough(registrationFee)
    returnChangeForExcessToSender(registrationFee)
    public
    payable
    {
        address(dataContract).transfer(msg.value);
        dataContract.setAirlineIsVoter(msg.sender, true);
        emit RegistrationFeePaid(msg.sender, registrationFee);
    }

    function registerAirline
    (address _address)
    verifyIsOperational
    verifyCallerIsRegisteredAirline
    verifyHasPaidRegistrationFee
    verifyHasAlreadyVoted
    public
    {
        uint airlinesCount = dataContract.getAirlinesCount();
        if(airlinesCount < AIRLINES_COUNT_TO_REQUIRE_CONSENSUS) {
            dataContract.createAirline(_address, false);
            emit AirlineRegistered(_address);
        }
        else {
            uniqueVoters.push(msg.sender);
            if(uniqueVoters.length.mul(uniqueVoterConsensus) < airlinesCount.mul(totalVoterConsensus)){
                emit VoteCounted(false, uniqueVoters.length, airlinesCount);
            }
            else {
                dataContract.createAirline(_address, false);
                uint newAirlinesCount = dataContract.getAirlinesCount();
                emit VoteCounted(true, uniqueVoters.length, newAirlinesCount);
                uniqueVoters = new address[](0);
                emit AirlineRegistered(_address);
            }
        }
    }

    function getAirline
    (address _address)
    verifyIsOperational
    public
    view
    returns (address airlineAddress, uint id, bool isVoter)
    {
        return dataContract.getAirline(_address);
    }

    // Insurance Resource
    function setInsurancePremiumMultiplier
    (uint8 numerator, uint8 denominator)
    verifyIsOperational
    verifyCallerIs(contractOwner)
    public
    {
        uint8 oldNum = insurancePremiumNumerator;
        uint8 oldDenom = insurancePremiumDenominator;
        insurancePremiumDenominator = denominator;
        insurancePremiumNumerator = numerator;
        emit InsuranceMultipliersUpdate(oldNum, oldDenom, insurancePremiumNumerator, insurancePremiumDenominator);
    }

    function getInsurancePremiumMultiplier
    ()
    verifyIsOperational
    public
    view
    returns (uint8 numerator, uint8 denominator)
    {
        return (insurancePremiumNumerator, insurancePremiumDenominator);
    }

    function buyInsurance
    (uint _flightId, uint _amountPaid)
    verifyIsOperational
    verifyValueLessThanOrEqualToCap(insuranceCap)
    public
    payable
    {
        dataContract.createInsurance(_flightId, _amountPaid, msg.sender);
        address(this).transfer(msg.value);
        address(dataContract).transfer(msg.value);
    }

    function getInsurance
    (uint _id)
    verifyIsOperational
    public
    view
    returns (uint id, uint flightId, string memory state, uint amountPaid, address owner)
    {
        return dataContract.getInsurance(_id);
    }

    //Flight Resource
    function registerFlight
    (string flight, uint _departureTimestamp, address _airlineAddress)
    verifyIsOperational
    public
    {
        dataContract.createFlight(flight, _departureTimestamp, _airlineAddress);
    }

    function getFlight
    (uint _id)
    verifyIsOperational
    public
    view
    returns (uint id, string flight, bytes32 key, address airlineAddress, string memory state, uint departureTimestamp, uint8 departureStatusCode, uint updated)
    {
        return dataContract.getFlight(_id);
    }

    function processFlightStatus
    (address airline, string flight, uint256 timestamp, uint8 statusCode)
    public
    {
        bytes32 flightKey = dataContract.createFlightKey(airline, flight, timestamp);
        (uint flightId) = dataContract.getFlightIdByKey(flightKey);
        dataContract.setDepartureStatusCode(flightId, statusCode);
        if(statusCode != STATUS_CODE_UNKNOWN) {
            dataContract.setUnavailableForInsurance(flightId);
        }
        if(statusCode == STATUS_CODE_LATE_AIRLINE) {
            uint[] memory insurancesToCredit = dataContract.getInsurancesByFlight(flightId);
            for(uint i = 0; i < insurancesToCredit.length; i++){
                (, , , uint amountPaid, ) = dataContract.getInsurance(insurancesToCredit[i]);
                dataContract.creditInsurance(insurancesToCredit[i], amountPaid.mul(insurancePremiumNumerator).div(insurancePremiumDenominator));
            }
        }
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
    (address airline, string flight, uint256 timestamp)
    verifyIsOperational
    public
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

    function getCreditedAmount
    (address _address)
    verifyIsOperational
    public
    view
    returns (uint)
    {
        return dataContract.getCreditedAmount(_address);
    }

    function withdrawCreditedAmount
    (uint _amountToWithdraw, address _address)
    verifyIsOperational
    public
    payable
    {
        dataContract.withdrawCreditedAmount(_amountToWithdraw, _address);
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
        if (oracleResponses[key].responses[statusCode].length == MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
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
    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function
    ()
    external
    payable
    {

    }
}

contract FlightSuretyData {
    function setIsAuthorizedCaller(address _address, bool isAuthorized) public;
    function createAirline(address airlineAddress, bool isVoter) public;
    function addFunds(uint _funds) public;
    function getAirlinesCount() public view returns (uint);
    function createInsurance(uint _flightId, uint _amountPaid, address _owner) public;
    function getInsurance(uint _id) public view returns (uint id, uint flightId, string memory state, uint amountPaid, address owner);
    function createFlight(string _code, uint _departureTimestamp, address _airlineAddress) public;
    function getFlight(uint _id) public view returns (uint id, string flight, bytes32 key, address airlineAddress, string memory state, uint departureTimestamp, uint8 departureStatusCode, uint updated);
    function getInsurancesByFlight(uint _flightId) public view returns (uint[]);
    function creditInsurance(uint _id, uint _amountToCredit) public;
    function getAirline(address _address) public view returns (address, uint, bool);
    function setAirlineIsVoter(address _address, bool isVoter) public;
    function setDepartureStatusCode(uint _flightId, uint8 _statusCode) public;
    function setUnavailableForInsurance(uint flightId) public;
    function getFlightIdByKey(bytes32 key) public view returns (uint);
    function createFlightKey(address _airlineAddress, string memory flightCode, uint timestamp) public returns (bytes32);
    function withdrawCreditedAmount(uint _amountToWithdraw, address _address) public payable;
    function getCreditedAmount(address _address) public view returns (uint);
}
