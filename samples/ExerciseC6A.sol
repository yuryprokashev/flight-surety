pragma solidity ^0.4.25;

contract ExerciseC6A {

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/


    struct UserProfile {
        bool isRegistered;
        bool isAdmin;
    }

    address private contractOwner;                  // Account used to deploy contract
    mapping(address => UserProfile) userProfiles;   // Mapping for storing user profiles

    bool isOperational;

    address[] multiPartyConsensusSigners;
    uint multiPartiesRequired;


    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    // No events

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                ) 
                                public 
    {
        contractOwner = msg.sender;
        isOperational = true;
        multiPartyConsensusSigners = new address[](0);
        multiPartiesRequired = 2;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireOperational(){
        require(isOperational == true, "Contract is not operational at this moment");
        _;
    }

    modifier requireIsOperationalUpdate(bool operational){
        require(isOperational != operational, "Your call does not change the operational status");
        _;
    }

    modifier requireAdmin(){
        require(userProfiles[msg.sender].isAdmin == true, "The caller is not an admin");
        _;
    }

    modifier requireUniqueSigner(){
        bool isUnique = true;
        for(uint i = 0; i < multiPartyConsensusSigners.length; i++) {
            if(multiPartyConsensusSigners[i] == msg.sender) {
                isUnique = false;
                break;
            }
        }
        require(isUnique == true, "The Sender has already signed the operation");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

   /**
    * @dev Check if a user is registered
    *
    * @return A bool that indicates if the user is registered
    */   
    function isUserRegistered
                            (
                                address account
                            )
                            external
                            view
                            returns(bool)
    {
        require(account != address(0), "'account' must be a valid address.");
        return userProfiles[account].isRegistered;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function registerUser
                                (
                                    address account,
                                    bool isAdmin
                                )
                                external
                                requireContractOwner
                                requireOperational
    {
        require(!userProfiles[account].isRegistered, "User is already registered.");

        userProfiles[account] = UserProfile({
                                                isRegistered: true,
                                                isAdmin: isAdmin
                                            });
    }

    function setOperational(bool operational)
    requireAdmin
    requireIsOperationalUpdate(operational)
    requireUniqueSigner()
    public
    {
        multiPartyConsensusSigners.push(msg.sender);

        if(multiPartyConsensusSigners.length == multiPartiesRequired){
            isOperational = operational;
            multiPartyConsensusSigners = new address[](0);
        }
    }

    function getIsOperational()
    public
    view
    returns (bool status)
    {
        status = isOperational;
    }
}

