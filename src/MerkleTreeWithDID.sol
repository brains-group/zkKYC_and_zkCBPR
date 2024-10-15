// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MerkleTreeWithDID {
    // The DIDInfo struct contains the Merkle root associated with the DID
    struct DIDInfo {
        string merkleRoot; // Merkle root associated with the DID
    }

    // Mapping to store the relationship between DIDs (as strings) and their corresponding information
    mapping(string => DIDInfo) public didRegistry;
    // The owner of the contract, usually the Certificate Authority (CA) that deploys the contract
    address public owner;
    // Mapping to store authorized intermediates that can manage DIDs
    mapping(address => bool) public intermediates;

    // Event triggered when a Merkle root is updated
    event MerkleRootUpdated(string indexed did, string newRoot);
    // Event triggered when a DID is registered
    event DIDRegistered(string indexed did);
    // Event triggered when an intermediate is added or removed
    event IntermediateUpdated(address indexed intermediate, bool added);

    // Modifier to restrict functions to the contract owner only
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    // Modifier to restrict functions to authorized intermediates only
    modifier onlyIntermediate() {
        require(intermediates[msg.sender], "Only an authorized intermediate can perform this action");
        _;
    }

    // Constructor function to set the contract owner as the deployer (CA)
    constructor() {
        owner = msg.sender;
    }

    // Function to add a new intermediate, can only be called by the owner (CA)
    function addIntermediate(address _intermediate) public onlyOwner {
        intermediates[_intermediate] = true;
        emit IntermediateUpdated(_intermediate, true);
    }

    // Function to remove an existing intermediate, can only be called by the owner (CA)
    function removeIntermediate(address _intermediate) public onlyOwner {
        intermediates[_intermediate] = false;
        emit IntermediateUpdated(_intermediate, false);
    }

    // Function to register a new DID, can only be called by an authorized intermediate
    function registerDID(string memory did) public onlyOwner() {
        // Initialize the DID information with an empty Merkle root
        didRegistry[did] = DIDInfo({
            merkleRoot: ""
        });

        emit DIDRegistered(did);
    }

    // Function to update the Merkle root of a DID, can only be called by an authorized intermediate
    function updateMerkleRoot(string memory did, string memory newRoot) public onlyIntermediate {        
        // Update the Merkle root associated with the DID
        didRegistry[did].merkleRoot = newRoot;
        emit MerkleRootUpdated(did, newRoot);
    }

    // Function to retrieve the Merkle root associated with a DID
    function getMerkleRoot(string memory did) public view returns (string memory) {
        return didRegistry[did].merkleRoot;
    }
}
