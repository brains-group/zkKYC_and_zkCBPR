// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/MerkleTreeWithDID.sol";

contract DeployMerkleTreeWithDID is Script {
    function run() external {
        vm.startBroadcast();
        
        // deploy
        MerkleTreeWithDID merkleTreeWithDID = new MerkleTreeWithDID();
        console.log("Contract deployed at:", address(merkleTreeWithDID));

        vm.stopBroadcast();
    }
}
