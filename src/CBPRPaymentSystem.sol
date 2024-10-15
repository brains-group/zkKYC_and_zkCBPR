// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CBPRPaymentSystem {
    // Address of the central bank (the contract deployer)
    address public centralBank;

    // Event emitted when a transfer is initiated
    event TransferInitiated(
        address indexed senderBank,  // Address of the sending bank
        address indexed recipientBank,  // Address of the receiving bank
        uint256 amount,  // Amount of the transfer
        string note  // Note or description of the transfer
    );

    // Event emitted when a transfer is confirmed
    event TransferConfirmed(
        address indexed senderBank,  // Address of the sending bank
        address indexed recipientBank,  // Address of the receiving bank
        uint256 amount,  // Amount of the transfer
        string note  // Note or description of the transfer
    );

    // Constructor sets the contract deployer as the central bank
    constructor() {
        centralBank = msg.sender;
    }

    // Function to initiate a payment
    function initiatePayment(address recipientBank, string memory note) public payable {
        require(msg.value > 0, "Transfer amount must be greater than zero");

        // Send ETH to the recipient bank
        payable(recipientBank).transfer(msg.value);

        // Emit a transfer initiation event
        emit TransferInitiated(
            msg.sender,
            recipientBank,
            msg.value,
            note
        );

        // Emit a transfer confirmation event
        emit TransferConfirmed(
            msg.sender,
            recipientBank,
            msg.value,
            note
        );
    }
}
