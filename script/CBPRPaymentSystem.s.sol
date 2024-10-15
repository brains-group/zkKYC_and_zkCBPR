// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/CBPRPaymentSystem.sol";

contract Deploy is Script {
    function run() external {
        // Start broadcasting transactions
        vm.startBroadcast();

        // Deploy the CBPRPaymentSystem contract
        CBPRPaymentSystem paymentSystem = new CBPRPaymentSystem();

        // Stop broadcasting transactions
        vm.stopBroadcast();

        // Print the deployed contract address to the console
        console.log("CBPRPaymentSystem deployed to:", address(paymentSystem));
    }
}
