pragma solidity 0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;
    bool private contractIsOperational;
    mapping (address => bool) authorizedCallers;

    // Funds Resource
    event FundsAdded(address contractAddress, uint amount);
    event CallerIsAuthorizedUpdate(address contractAddress, bool isAuthorized);

    // Airlines Resource
    struct Airline {
        uint id;
        bool isVoter;
    }
    uint public airlinesCount;
    mapping(address => Airline) public airlines;
    event AirlineRegistered(address airlineAddress);
    event AirlineIsVoterUpdate(address airlineAddress, bool isVoter);

    // Flight Resource
    uint public flightCount;
    enum FlightState{AvailableForInsurance, NotAvailableForInsurance}
    struct Flight {
        uint id;
        string flight;
        bytes32 key;
        address airlineAddress;
        FlightState state;
        uint departureTimestamp;
        uint8 departureStatusCode;
        uint updatedTimestamp;
    }
    mapping(uint => Flight) private flights;
    mapping(bytes32 => uint) flightKeyToId;
    event FlightAvailableForInsurance(uint id);
    event FlightIsNotAvailableForInsurance(uint id);
    event FlightDepartureStatusCodeUpdated(uint id, uint8 statusCode);

    // Insurance Resource
    uint public insuranceCount;
    enum InsuranceState {Active, Expired, Credited}
    struct Insurance {
        uint id;
        uint flightId;
        InsuranceState state;
        uint amountPaid;
        address owner;
    }
    mapping(uint => Insurance) public insurancesById;
    mapping(address => uint[]) private passengerToInsurances;
    mapping(uint => uint[]) private flightToInsurances;
    event InsuranceActive(uint id);
    event InsuranceCredited(uint id);
    event InsuranceExpired(uint id);

    // Credited Amount Resource
    mapping(address => uint) public creditedAmounts;
    event AmountWithdrawn(address _address, uint amountWithdrawn);

    constructor
    ()
    public
    payable
    {
        contractOwner = msg.sender;

        contractIsOperational = true;

        airlinesCount = 0;

        flightCount = 0;

        insuranceCount = 0;

        // Authorizing yourself to call own functions, that can be called
        // externally and hence require authorization
        authorizedCallers[address(this)] = true;
        authorizedCallers[contractOwner] = true;

        // creating the default airline
        airlinesCount = airlinesCount.add(1);
        airlines[contractOwner] = Airline({id: airlinesCount, isVoter: true});

        // adding Funds from the contract creator (and first airline) to the Contract
        address(this).transfer(msg.value);
    }

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

    modifier verifyAirlineExists(address _address)
    {
        require(airlines[_address].id > 0, "Airline with given address does not exists");
        _;
    }

    modifier verifyCallerIsAuthorized()
    {
        require(authorizedCallers[msg.sender] == true, "The caller is not authorized to call this operation");
        _;
    }

    modifier verifyFlightExists(uint _id)
    {
        require(flights[_id].id > 0, "Flight does not exists in the system");
        _;
    }

    modifier verifyFlightIsAvailableForInsurance(uint _flightId)
    {
        require(uint(flights[_flightId].state) == 0, "The flight is not available for insurance");
        _;
    }

    modifier verifyInsuranceExists(uint _id)
    {
        require(insurancesById[_id].id > 0, "Insurance does not exists in the system");
        _;
    }

    modifier verifyCanBeCredited(uint _id)
    {
        require(uint(insurancesById[_id].state) == 0, "The insurance can not be credited, b/c it is not Active");
        _;
    }

    modifier verifyCanBeWithdrawn(uint amountToWithdraw, address _address)
    {
        require(amountToWithdraw <= creditedAmounts[_address], "The address does not have requested amount of funds to withdraw");
        _;
    }

    modifier verifyNotDepartedAlready(uint _timestamp){
        require(_timestamp > block.timestamp, "Flight has been departed already, so it makes no sense to sell insurances for it.");
        _;
    }

    modifier verifyContractHasSufficientFunds(uint amountToWithdraw) {
        require(address(this).balance > amountToWithdraw, "Contract does not have sufficient funds");
        _;
    }


    modifier verifyAirlineDoesNotExist(address airlineAddress) {
        require(airlines[airlineAddress].id == 0, "The airline is already registered");
        _;
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
    (bool mode)
    verifyCallerIs(contractOwner)
    public
    {
        contractIsOperational = mode;
    }

    function setIsAuthorizedCaller
    (address _address, bool isAuthorized)
    verifyCallerIs(contractOwner)
    verifyIsOperational
    public
    {
        authorizedCallers[_address] = isAuthorized;
        emit CallerIsAuthorizedUpdate(_address, isAuthorized);
    }

    function getIsAuthorizedCaller
    (address _address)
    verifyIsOperational
    public
    view
    returns (bool)
    {
        return authorizedCallers[_address];
    }

    // Airline Resource
    function createAirline
    (address airlineAddress, bool isVoter)
    verifyIsOperational
    verifyCallerIsAuthorized
    verifyAirlineDoesNotExist(airlineAddress)
    public
    {
        airlinesCount = airlinesCount.add(1);
        airlines[airlineAddress] = Airline({id: airlinesCount, isVoter: isVoter});
    }

    function getAirline
    (address _address)
    verifyIsOperational
    verifyAirlineExists(_address)
    public
    view
    returns (address airlineAddress, uint id, bool isVoter)
    {
        airlineAddress = _address;
        id = airlines[_address].id;
        isVoter = airlines[_address].isVoter;
    }

    function getAirlinesCount
    ()
    verifyIsOperational
    public
    view
    returns (uint)
    {
        return (airlinesCount);
    }

    function setAirlineIsVoter
    (address _address, bool _isVoter)
    verifyIsOperational
    verifyCallerIsAuthorized
    verifyAirlineExists(_address)
    public
    {
        airlines[_address].isVoter = _isVoter;
        emit AirlineIsVoterUpdate(_address, _isVoter);
    }

    // Flight Resource
    function createFlight
    (string _flight, uint _departureTimestamp, address _airlineAddress)
    verifyIsOperational
    verifyCallerIsAuthorized
    verifyAirlineExists(_airlineAddress)
    verifyNotDepartedAlready(_departureTimestamp)
    public
    {
        flightCount = flightCount.add(1);
        bytes32 key = createFlightKey(_airlineAddress, _flight, _departureTimestamp);
        flights[flightCount] = Flight(
            {id: flightCount,
            flight: _flight,
            key: key,
            airlineAddress: _airlineAddress,
            state: FlightState.AvailableForInsurance,
            departureTimestamp: _departureTimestamp,
            departureStatusCode: 0,
            updatedTimestamp: block.timestamp});
        flightKeyToId[key] = flightCount;

        emit FlightAvailableForInsurance(flightCount);
    }

    function getFlight
    (uint _id)
    verifyIsOperational
    verifyFlightExists(_id)
    public
    view
    returns
    (uint id, string flight, bytes32 key, address airlineAddress, string memory state, uint departureTimestamp, uint8 departureStatusCode, uint updated)
    {
        id = flights[_id].id;
        flight = flights[_id].flight;
        key = flights[_id].key;
        airlineAddress = flights[_id].airlineAddress;
        departureStatusCode = flights[_id].departureStatusCode;
        departureTimestamp = flights[_id].departureTimestamp;
        updated = flights[_id].updatedTimestamp;
        if(uint(flights[_id].state) == 0) {
            state = "Available For Insurance";
        }
        if(uint(flights[_id].state) == 1) {
            state = "Unavailable For Insurance";
        }
    }

    function getFlightIdByKey
    (bytes32 _key)
    verifyIsOperational
    verifyFlightExists(flights[flightKeyToId[_key]].id)
    external
    view
    returns (uint)
    {
        return flightKeyToId[_key];
    }

    function setUnavailableForInsurance
    (uint _id)
    verifyIsOperational
    verifyCallerIsAuthorized
    verifyFlightExists(_id)
    public
    {
        flights[_id].state = FlightState.NotAvailableForInsurance;
        flights[_id].updatedTimestamp = block.timestamp;
        emit FlightIsNotAvailableForInsurance(_id);
    }

    function setAvailableForInsurance
    (uint _id)
    verifyIsOperational
    verifyCallerIsAuthorized
    verifyFlightExists(_id)
    public
    {
        flights[_id].state = FlightState.AvailableForInsurance;
        flights[_id].updatedTimestamp = block.timestamp;
        emit FlightAvailableForInsurance(_id);
    }

    function setDepartureStatusCode
    (uint _id, uint8 _statusCode)
    verifyIsOperational
    verifyCallerIsAuthorized
    verifyFlightExists(_id)
    public
    {
        flights[_id].departureStatusCode = _statusCode;
        flights[_id].updatedTimestamp = block.timestamp;
        emit FlightDepartureStatusCodeUpdated(_id, _statusCode);
    }

    function createFlightKey
    (address airline, string flight, uint256 timestamp)
    public
    pure
    returns(bytes32)
    {
        bytes32 keyBytes = keccak256(abi.encodePacked(airline, flight, timestamp));
        return keyBytes;
    }

    // Insurance Resource
    function createInsurance
    (uint _flightId, uint _amountPaid, address _owner)
    verifyIsOperational
    verifyCallerIsAuthorized
    verifyFlightExists(_flightId)
    verifyFlightIsAvailableForInsurance(_flightId)
    external
    {
        insuranceCount = insuranceCount.add(1);
        insurancesById[insuranceCount] = Insurance(
            {id: insuranceCount,
            flightId: _flightId,
            state: InsuranceState.Active,
            amountPaid: _amountPaid,
            owner: _owner});
        flightToInsurances[_flightId].push(insuranceCount);
        passengerToInsurances[_owner].push(insuranceCount);
        emit InsuranceActive(insurancesById[insuranceCount].id);
    }

    function getInsurancesByFlight
    (uint _flightId)
    verifyIsOperational
    verifyFlightExists(_flightId)
    public
    view
    returns (uint [])
    {
        return flightToInsurances[_flightId];
    }

    function getInsurancesByPassenger
    (address _address)
    verifyIsOperational
    public
    view
    returns (uint [])
    {
        return passengerToInsurances[_address];
    }

    function getInsurance
    (uint _id)
    verifyIsOperational
    verifyInsuranceExists(_id)
    public
    view
    returns (uint id, uint flightId, string memory state, uint amountPaid, address owner)
    {
        Insurance memory insurance = insurancesById[_id];
        id = insurance.id;
        flightId = insurance.flightId;
        amountPaid = insurance.amountPaid;
        owner = insurance.owner;
        if(uint(insurance.state) == 0) {
            state = "Active";
        }
        if(uint(insurance.state) == 1) {
            state = "Expired";
        }
        if(uint(insurance.state) == 2) {
            state = "Credited";
        }
    }

    function creditInsurance
    (uint _id, uint _amountToCredit)
    verifyIsOperational
    verifyCallerIsAuthorized
    verifyInsuranceExists(_id)
    verifyCanBeCredited(_id)
    public
    {
        Insurance memory insurance = insurancesById[_id];
        creditedAmounts[insurance.owner] = creditedAmounts[insurance.owner].add(_amountToCredit);
        insurancesById[_id].state = InsuranceState.Credited;
        emit InsuranceCredited(_id);
    }

    // Credited Amount Resource
    function getCreditedAmount
    (address _address)
    verifyIsOperational
    public
    view
    returns (uint amountCredited)
    {
        amountCredited = creditedAmounts[_address];
    }

    function withdrawCreditedAmount
    (uint _amountToWithdraw, address _address)
    verifyIsOperational
    verifyCallerIsAuthorized
    verifyCanBeWithdrawn(_amountToWithdraw, _address)
    verifyContractHasSufficientFunds(_amountToWithdraw)
    public
    payable
    {
        creditedAmounts[_address] = creditedAmounts[_address].sub(_amountToWithdraw);
        _address.transfer(_amountToWithdraw);
        emit AmountWithdrawn(_address, _amountToWithdraw);
    }
    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function
    ()
    external
    payable
    {
        emit FundsAdded(address(this), msg.value);
    }
}