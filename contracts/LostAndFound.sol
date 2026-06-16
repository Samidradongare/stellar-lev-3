// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IFinderNFT.sol";

contract LostAndFound {
    enum ItemStatus { Lost, Claimed, Verified, Completed }
    enum ClaimStatus { Pending, Verified, Rejected }

    struct Item {
        uint256 id;
        address owner;
        string description;
        string photoIPFS;
        uint256 reward;
        ItemStatus status;
        uint256 timestamp;
        string location;
    }

    struct Claim {
        uint256 id;
        uint256 itemId;
        address claimant;
        string proofIPFS;
        ClaimStatus status;
        uint256 timestamp;
    }

    // State Variables
    uint256 private _nextItemId;
    uint256 private _nextClaimId;
    address public finderNFTAddress;

    mapping(uint256 => Item) public items;
    mapping(uint256 => Claim) public claims;
    mapping(address => uint256[]) private _ownerItems;
    mapping(uint256 => uint256[]) private _itemClaims;

    // Events
    event ItemPosted(
        uint256 indexed id,
        address indexed owner,
        string description,
        string photoIPFS,
        uint256 reward,
        string location,
        uint256 timestamp
    );
    event ClaimSubmitted(
        uint256 indexed id,
        uint256 indexed itemId,
        address indexed claimant,
        string proofIPFS,
        uint256 timestamp
    );
    event ClaimVerified(
        uint256 indexed claimId,
        uint256 indexed itemId,
        address indexed finder,
        uint256 reward,
        uint256 tokenId
    );
    event ClaimRejected(
        uint256 indexed claimId,
        uint256 indexed itemId,
        address indexed claimant
    );
    event RewardReleased(
        uint256 indexed itemId,
        address indexed finder,
        uint256 amount
    );

    // Modifiers
    modifier onlyItemOwner(uint256 itemId) {
        require(items[itemId].owner == msg.sender, "Caller is not the item owner");
        _;
    }

    modifier itemExists(uint256 itemId) {
        require(items[itemId].id == itemId && itemId > 0 && itemId < _nextItemId, "Item does not exist");
        _;
    }

    modifier claimExists(uint256 claimId) {
        require(claims[claimId].id == claimId && claimId > 0 && claimId < _nextClaimId, "Claim does not exist");
        _;
    }

    constructor(address _finderNFTAddress) {
        require(_finderNFTAddress != address(0), "Invalid NFT address");
        finderNFTAddress = _finderNFTAddress;
        _nextItemId = 1;
        _nextClaimId = 1;
    }

    // External Functions
    function postLostItem(
        string calldata description,
        string calldata photoIPFS,
        string calldata location
    ) external payable returns (uint256) {
        require(msg.value > 0, "Reward amount must be greater than 0");
        
        uint256 itemId = _nextItemId;
        _nextItemId++;

        items[itemId] = Item({
            id: itemId,
            owner: msg.sender,
            description: description,
            photoIPFS: photoIPFS,
            reward: msg.value,
            status: ItemStatus.Lost,
            timestamp: block.timestamp,
            location: location
        });

        _ownerItems[msg.sender].push(itemId);

        emit ItemPosted(itemId, msg.sender, description, photoIPFS, msg.value, location, block.timestamp);

        return itemId;
    }

    function submitClaim(
        uint256 itemId,
        string calldata proofIPFS
    ) external itemExists(itemId) returns (uint256) {
        Item storage item = items[itemId];
        require(item.status == ItemStatus.Lost || item.status == ItemStatus.Claimed, "Item is not open for claims");
        require(item.owner != msg.sender, "Owner cannot claim their own item");

        uint256 claimId = _nextClaimId;
        _nextClaimId++;

        claims[claimId] = Claim({
            id: claimId,
            itemId: itemId,
            claimant: msg.sender,
            proofIPFS: proofIPFS,
            status: ClaimStatus.Pending,
            timestamp: block.timestamp
        });

        _itemClaims[itemId].push(claimId);
        
        // Transition item status to Claimed if it is currently Lost
        if (item.status == ItemStatus.Lost) {
            item.status = ItemStatus.Claimed;
        }

        emit ClaimSubmitted(claimId, itemId, msg.sender, proofIPFS, block.timestamp);

        return claimId;
    }

    function verifyClaim(uint256 claimId) external claimExists(claimId) onlyItemOwner(claims[claimId].itemId) {
        Claim storage claim = claims[claimId];
        require(claim.status == ClaimStatus.Pending, "Claim is not pending");

        uint256 itemId = claim.itemId;
        Item storage item = items[itemId];
        require(item.status == ItemStatus.Claimed, "Item is not in claimed state");

        // Release escrow reward
        uint256 rewardAmount = item.reward;
        require(address(this).balance >= rewardAmount, "Insufficient contract balance");

        // Update statuses
        claim.status = ClaimStatus.Verified;
        item.status = ItemStatus.Verified;

        // Construct Token URI dynamically on-chain (fully decentralized)
        string memory tokenURI = string(abi.encodePacked(
            'data:application/json;utf8,{"finderAddress":"',
            addressToString(claim.claimant),
            '","itemDescription":"',
            item.description,
            '","returnDate":"',
            uintToString(block.timestamp),
            '","puneLocation":"',
            item.location,
            '"}'
        ));

        // Trigger NFT Mint
        uint256 tokenId = IFinderNFT(finderNFTAddress).mintCertificate(claim.claimant, itemId, tokenURI);

        // Send payment to finder
        (bool success, ) = claim.claimant.call{value: rewardAmount}("");
        require(success, "Transfer to claimant failed");

        emit ClaimVerified(claimId, itemId, claim.claimant, rewardAmount, tokenId);
        emit RewardReleased(itemId, claim.claimant, rewardAmount);
    }

    function rejectClaim(uint256 claimId) external claimExists(claimId) onlyItemOwner(claims[claimId].itemId) {
        Claim storage claim = claims[claimId];
        require(claim.status == ClaimStatus.Pending, "Claim is not pending");

        uint256 itemId = claim.itemId;
        Item storage item = items[itemId];
        require(item.status == ItemStatus.Claimed, "Item is not in claimed state");

        // Refund escrow to owner
        uint256 rewardAmount = item.reward;
        require(address(this).balance >= rewardAmount, "Insufficient contract balance");

        // Update statuses
        claim.status = ClaimStatus.Rejected;
        item.status = ItemStatus.Completed;

        // Refund owner
        (bool success, ) = item.owner.call{value: rewardAmount}("");
        require(success, "Refund to owner failed");

        emit ClaimRejected(claimId, itemId, claim.claimant);
    }

    // Read Functions
    function getItem(uint256 itemId) external view itemExists(itemId) returns (Item memory) {
        return items[itemId];
    }

    function getClaim(uint256 claimId) external view claimExists(claimId) returns (Claim memory) {
        return claims[claimId];
    }

    function getItemsByOwner(address owner) external view returns (uint256[] memory) {
        return _ownerItems[owner];
    }

    function getClaimsByItem(uint256 itemId) external view itemExists(itemId) returns (uint256[] memory) {
        return _itemClaims[itemId];
    }

    // Helper functions for string conversions in Solidity
    function uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function addressToString(address account) internal pure returns (string memory) {
        bytes memory data = abi.encodePacked(account);
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < data.length; i++) {
            str[2 + i * 2] = alphabet[uint8(data[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }
}
