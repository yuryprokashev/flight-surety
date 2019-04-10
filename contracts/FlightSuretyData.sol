pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;
    bool private contractIsOperational;

    struct Airline {
        uint id;
        bool isVoter;
    }
    uint public airlinesCount;
    mapping(address => Airline) public airlines;
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    constructor
    ()
    public
    {
        contractIsOperational = true;
        contractOwner = msg.sender;
        airlinesCount = 0;
    }

    modifier verifyIsOperational()
    {
        require(contractIsOperational == true, "Contract is currently not operational");
        _;
    }

    modifier verifyCallerIs(address _address){
        require(msg.sender == _address, "Current caller can not invoke this operation.");
        _;
    }

    modifier verifyAirlineCreated(address _address) {
        require(airlines[_address].id > 0, "Airline with given address is not registered");
        _;
    }

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
    external
    verifyCallerIs(contractOwner)
    {
        contractIsOperational = mode;
    }

    function createAirline
    (address airlineAddress, bool isVoter)
    verifyIsOperational
    external
    {
        airlinesCount = airlinesCount.add(1);
        airlines[airlineAddress] = Airline({id: airlinesCount, isVoter: isVoter});
    }

    function getAirline
    (address _address)
    public view
    verifyIsOperational
    verifyAirlineCreated(_address)
    returns (address airlineAddress, uint id, bool isVoter)
    {
        airlineAddress = _address;
        id = airlines[_address].id;
        isVoter = airlines[_address].isVoter;
    }

    function getAirlinesCount
    ()
    verifyIsOperational
    public view
    returns (uint)
    {
        return (airlinesCount);
    }

    function setAirlineIsVoter
    (address _address, bool isVoter)
    external
    verifyIsOperational
    {
        airlines[_address].isVoter = isVoter;
    }


   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy
    ()
    external
    payable
    {

    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                )
                                external
                                pure
    {
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                            )
                            external
                            pure
    {
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
                            (   
                            )
                            public
                            payable
    {
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external 
                            payable 
    {
        fund();
    }


}

