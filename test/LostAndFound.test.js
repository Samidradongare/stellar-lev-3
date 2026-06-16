const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("PuneFinder Contract Suite", function () {
  let FinderNFT, finderNFT, LostAndFound, lostAndFound;
  let owner, claimant, other;

  beforeEach(async function () {
    [owner, claimant, other] = await ethers.getSigners();

    // Deploy FinderNFT with owner as deployer
    FinderNFT = await ethers.getContractFactory("FinderNFT");
    finderNFT = await FinderNFT.deploy(owner.address);
    await finderNFT.waitForDeployment();

    // Deploy LostAndFound
    LostAndFound = await ethers.getContractFactory("LostAndFound");
    lostAndFound = await LostAndFound.deploy(await finderNFT.getAddress());
    await lostAndFound.waitForDeployment();

    // Transfer ownership of FinderNFT to LostAndFound so it can mint certificates
    await finderNFT.transferOwnership(await lostAndFound.getAddress());
  });

  // 1. Should deploy contracts successfully
  it("Should deploy contracts successfully", async function () {
    expect(await finderNFT.getAddress()).to.not.equal(ethers.ZeroAddress);
    expect(await lostAndFound.getAddress()).to.not.equal(ethers.ZeroAddress);
    expect(await finderNFT.owner()).to.equal(await lostAndFound.getAddress());
  });

  // 2. Should revert if reward amount is 0
  it("Should revert if reward amount is 0", async function () {
    await expect(
      lostAndFound.postLostItem("iPhone 15 Pro", "ipfs://iphone-hash", "Koregaon Park", {
        value: 0
      })
    ).to.be.revertedWith("Reward amount must be greater than 0");
  });

  // 3. Should post a lost item with ETH reward
  it("Should post a lost item with ETH reward", async function () {
    const reward = ethers.parseEther("0.1");
    const tx = await lostAndFound.postLostItem("iPhone 15 Pro", "ipfs://iphone-hash", "Koregaon Park", {
      value: reward
    });
    await tx.wait();

    const item = await lostAndFound.getItem(1);
    expect(item.id).to.equal(1);
    expect(item.owner).to.equal(owner.address);
    expect(item.description).to.equal("iPhone 15 Pro");
    expect(item.photoIPFS).to.equal("ipfs://iphone-hash");
    expect(item.reward).to.equal(reward);
    expect(item.status).to.equal(0); // ItemStatus.Lost
    expect(item.location).to.equal("Koregaon Park");
  });

  // 4. Should emit ItemPosted event with correct args
  it("Should emit ItemPosted event with correct args", async function () {
    const reward = ethers.parseEther("0.1");
    await expect(
      lostAndFound.postLostItem("iPhone 15 Pro", "ipfs://iphone-hash", "Koregaon Park", {
        value: reward
      })
    )
      .to.emit(lostAndFound, "ItemPosted")
      .withArgs(1, owner.address, "iPhone 15 Pro", "ipfs://iphone-hash", reward, "Koregaon Park", anyValue);
  });

  // 5. Should allow submitting a claim
  it("Should allow submitting a claim", async function () {
    const reward = ethers.parseEther("0.1");
    await lostAndFound.postLostItem("iPhone 15 Pro", "ipfs://iphone-hash", "Koregaon Park", {
      value: reward
    });

    const tx = await lostAndFound.connect(claimant).submitClaim(1, "ipfs://proof-hash");
    await tx.wait();

    const claim = await lostAndFound.getClaim(1);
    expect(claim.id).to.equal(1);
    expect(claim.itemId).to.equal(1);
    expect(claim.claimant).to.equal(claimant.address);
    expect(claim.proofIPFS).to.equal("ipfs://proof-hash");
    expect(claim.status).to.equal(0); // ClaimStatus.Pending
  });

  // 6. Should emit ClaimSubmitted event
  it("Should emit ClaimSubmitted event", async function () {
    const reward = ethers.parseEther("0.1");
    await lostAndFound.postLostItem("iPhone 15 Pro", "ipfs://iphone-hash", "Koregaon Park", {
      value: reward
    });

    await expect(lostAndFound.connect(claimant).submitClaim(1, "ipfs://proof-hash"))
      .to.emit(lostAndFound, "ClaimSubmitted")
      .withArgs(1, 1, claimant.address, "ipfs://proof-hash", anyValue);
  });

  // 7. Should verify a claim and release escrow
  it("Should verify a claim and release escrow", async function () {
    const reward = ethers.parseEther("0.5");
    await lostAndFound.postLostItem("Laptop", "ipfs://laptop", "Baner", { value: reward });
    await lostAndFound.connect(claimant).submitClaim(1, "ipfs://laptop-proof");

    const claimantInitialBalance = await ethers.provider.getBalance(claimant.address);

    const tx = await lostAndFound.connect(owner).verifyClaim(1);
    await tx.wait();

    const claimantFinalBalance = await ethers.provider.getBalance(claimant.address);
    expect(claimantFinalBalance - claimantInitialBalance).to.equal(reward);

    const item = await lostAndFound.getItem(1);
    const claim = await lostAndFound.getClaim(1);

    expect(item.status).to.equal(2); // ItemStatus.Verified
    expect(claim.status).to.equal(1); // ClaimStatus.Verified
  });

  // 8. Should mint NFT on claim verification
  it("Should mint NFT on claim verification", async function () {
    const reward = ethers.parseEther("0.1");
    await lostAndFound.postLostItem("Wallet", "ipfs://wallet", "Kothrud", { value: reward });
    await lostAndFound.connect(claimant).submitClaim(1, "ipfs://wallet-proof");

    await expect(lostAndFound.connect(owner).verifyClaim(1))
      .to.emit(finderNFT, "CertificateMinted")
      .withArgs(claimant.address, 1, 1);

    expect(await finderNFT.balanceOf(claimant.address)).to.equal(1);
    expect(await finderNFT.ownerOf(1)).to.equal(claimant.address);
    
    // Check dynamic on-chain JSON metadata
    const tokenURI = await finderNFT.tokenURI(1);
    expect(tokenURI).to.contain("data:application/json;utf8,");
    expect(tokenURI).to.contain('"finderAddress":"0x');
    expect(tokenURI).to.contain('"itemDescription":"Wallet"');
    expect(tokenURI).to.contain('"puneLocation":"Kothrud"');
  });

  // 9. Should reject a claim and refund escrow
  it("Should reject a claim and refund escrow", async function () {
    const reward = ethers.parseEther("0.2");
    await lostAndFound.postLostItem("Keys", "ipfs://keys", "Baner", { value: reward });
    await lostAndFound.connect(claimant).submitClaim(1, "ipfs://keys-proof");

    const ownerInitialBalance = await ethers.provider.getBalance(owner.address);

    // Rejection by owner
    const tx = await lostAndFound.connect(owner).rejectClaim(1);
    const receipt = await tx.wait();
    
    // Account for gas cost
    const gasUsed = receipt.gasUsed * receipt.gasPrice;

    const ownerFinalBalance = await ethers.provider.getBalance(owner.address);
    expect(ownerFinalBalance + gasUsed - ownerInitialBalance).to.equal(reward);

    const item = await lostAndFound.getItem(1);
    const claim = await lostAndFound.getClaim(1);

    expect(item.status).to.equal(3); // ItemStatus.Completed (closed/refunded)
    expect(claim.status).to.equal(2); // ClaimStatus.Rejected
  });

  // 10. Should revert if non-owner tries to verify claim
  it("Should revert if non-owner tries to verify claim", async function () {
    const reward = ethers.parseEther("0.1");
    await lostAndFound.postLostItem("Keys", "ipfs://keys", "Baner", { value: reward });
    await lostAndFound.connect(claimant).submitClaim(1, "ipfs://keys-proof");

    await expect(
      lostAndFound.connect(other).verifyClaim(1)
    ).to.be.revertedWith("Caller is not the item owner");
  });

  // 11. Should return correct item status after each transition
  it("Should return correct item status after each transition", async function () {
    const reward = ethers.parseEther("0.1");
    
    // Initial post
    await lostAndFound.postLostItem("Bag", "ipfs://bag", "Viman Nagar", { value: reward });
    expect((await lostAndFound.getItem(1)).status).to.equal(0); // ItemStatus.Lost

    // Claim submission
    await lostAndFound.connect(claimant).submitClaim(1, "ipfs://bag-proof");
    expect((await lostAndFound.getItem(1)).status).to.equal(1); // ItemStatus.Claimed

    // Claim verification
    await lostAndFound.connect(owner).verifyClaim(1);
    expect((await lostAndFound.getItem(1)).status).to.equal(2); // ItemStatus.Verified
  });
});
