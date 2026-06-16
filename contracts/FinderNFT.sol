// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IFinderNFT.sol";

contract FinderNFT is ERC721URIStorage, Ownable, IFinderNFT {
    uint256 private _nextTokenId;

    event CertificateMinted(address indexed finder, uint256 indexed itemId, uint256 indexed tokenId);

    constructor(address initialOwner) ERC721("PuneFinder Certificate", "PFIND") Ownable(initialOwner) {
        _nextTokenId = 1;
    }

    function mintCertificate(address to, uint256 itemId, string calldata tokenURI) external override onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit CertificateMinted(to, itemId, tokenId);

        return tokenId;
    }
}
