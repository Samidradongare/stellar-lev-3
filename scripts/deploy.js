const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with account:", deployer.address);

  // Existing FinderNFT contract
  const finderNFTAddress = "0x0E74029dac4E151fa77E0D4F24BbC34f9B016938";

  const finderNFT = await ethers.getContractAt(
    "FinderNFT",
    finderNFTAddress
  );

  // Deploy LostAndFound
  const LostAndFound = await ethers.getContractFactory("LostAndFound");
  const lostAndFound = await LostAndFound.deploy(finderNFTAddress);

  await lostAndFound.waitForDeployment();

  const lostAndFoundAddress = await lostAndFound.getAddress();

  console.log("LostAndFound deployed to:", lostAndFoundAddress);

  // Debug ownership
  const currentOwner = await finderNFT.owner();
  console.log("Current FinderNFT owner:", currentOwner);
  console.log("Deployer:", deployer.address);

  // Transfer ownership only if deployer is owner
  if (
    currentOwner.toLowerCase() !== deployer.address.toLowerCase()
  ) {
    console.log(
      "ERROR: Deployer is not the owner of FinderNFT. Ownership transfer cannot proceed."
    );
    return;
  }

  console.log("Transferring ownership...");

  const tx = await finderNFT.transferOwnership(
    lostAndFoundAddress
  );

  await tx.wait();

  console.log("Ownership transferred successfully.");

  console.log("\n--- Deployment Summary ---");
  console.log("FinderNFT:", finderNFTAddress);
  console.log("LostAndFound:", lostAndFoundAddress);
  console.log("Ownership Tx:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });