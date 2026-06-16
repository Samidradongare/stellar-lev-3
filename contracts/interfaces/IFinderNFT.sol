// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IFinderNFT {
    function mintCertificate(address to, uint256 itemId, string calldata tokenURI) external returns (uint256);
}
