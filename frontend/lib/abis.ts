export const LostAndFoundABI = [
  "function postLostItem(string description, string photoIPFS, string location) external payable returns (uint256)",
  "function submitClaim(uint256 itemId, string proofIPFS) external returns (uint256)",
  "function verifyClaim(uint256 claimId) external",
  "function rejectClaim(uint256 claimId) external",
  "function getItem(uint256 itemId) external view returns (tuple(uint256 id, address owner, string description, string photoIPFS, uint256 reward, uint8 status, uint256 timestamp, string location))",
  "function getClaim(uint256 claimId) external view returns (tuple(uint256 id, uint256 itemId, address claimant, string proofIPFS, uint8 status, uint256 timestamp))",
  "function getItemsByOwner(address owner) external view returns (uint256[] memory)",
  "function getClaimsByItem(uint256 itemId) external view returns (uint256[] memory)",
  "function finderNFTAddress() external view returns (address)",
  
  // Events
  "event ItemPosted(uint256 indexed id, address indexed owner, string description, string photoIPFS, uint256 reward, string location, uint256 timestamp)",
  "event ClaimSubmitted(uint256 indexed id, uint256 indexed itemId, address indexed claimant, string proofIPFS, uint256 timestamp)",
  "event ClaimVerified(uint256 indexed claimId, uint256 indexed itemId, address indexed finder, uint256 reward, uint256 tokenId)",
  "event ClaimRejected(uint256 indexed claimId, uint256 indexed itemId, address indexed claimant)",
  "event RewardReleased(uint256 indexed itemId, address indexed finder, uint256 amount)"
];

export const FinderNFTABI = [
  "function mintCertificate(address to, uint256 itemId, string tokenURI) external returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function owner() external view returns (address)",
  
  // Events
  "event CertificateMinted(address indexed finder, uint256 indexed itemId, uint256 indexed tokenId)"
];
