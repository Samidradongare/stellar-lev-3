const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy FinderNFT
  const FinderNFT = await ethers.getContractFactory("FinderNFT");
  const finderNFT = await FinderNFT.deploy(deployer.address);
  await finderNFT.waitForDeployment();
  const finderNFTAddress = await finderNFT.getAddress();
  const finderNFTTx = finderNFT.deploymentTransaction();
  console.log(`FinderNFT deployed to: ${finderNFTAddress}`);
  console.log(`FinderNFT deployment tx hash: ${finderNFTTx.hash}`);

  // 2. Deploy LostAndFound
  const LostAndFound = await ethers.getContractFactory("LostAndFound");
  const lostAndFound = await LostAndFound.deploy(finderNFTAddress);
  await lostAndFound.waitForDeployment();
  const lostAndFoundAddress = await lostAndFound.getAddress();
  const lostAndFoundTx = lostAndFound.deploymentTransaction();
  console.log(`LostAndFound deployed to: ${lostAndFoundAddress}`);
  console.log(`LostAndFound deployment tx hash: ${lostAndFoundTx.hash}`);

  // 3. Transfer ownership of FinderNFT to LostAndFound so it can mint certificates
  console.log("Transferring ownership of FinderNFT to LostAndFound...");
  const tx = await finderNFT.transferOwnership(lostAndFoundAddress);
  await tx.wait();
  console.log("Ownership transferred successfully.");

  console.log("\n--- Deployment Summary ---");
  console.log(`FinderNFT Address: ${finderNFTAddress}`);
  console.log(`LostAndFound Address: ${lostAndFoundAddress}`);
  console.log(`Link/Ownership Transfer Tx: ${tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
