const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Reuse the FinderNFT contract successfully deployed in the first run
  const finderNFTAddress = "0xE436B9c99881A8Af0FbA9843b53117081042434f";
  console.log(`Reusing FinderNFT deployed at: ${finderNFTAddress}`);

  const finderNFT = await ethers.getContractAt("FinderNFT", finderNFTAddress);

  // 2. Deploy LostAndFound
  const LostAndFound = await ethers.getContractFactory("LostAndFound");
  const lostAndFound = await LostAndFound.deploy(finderNFTAddress);
  await lostAndFound.waitForDeployment();
  const lostAndFoundAddress = await lostAndFound.getAddress();
  console.log(`LostAndFound deployed to: ${lostAndFoundAddress}`);

  // 3. Transfer ownership of FinderNFT to LostAndFound so it can mint certificates
  console.log("Transferring ownership of FinderNFT to LostAndFound...");
  const tx = await finderNFT.transferOwnership(lostAndFoundAddress);
  await tx.wait();
  console.log("Ownership transferred successfully.");

  console.log("\n--- Deployment Summary ---");
  console.log(`FinderNFT: ${finderNFTAddress}`);
  console.log(`LostAndFound: ${lostAndFoundAddress}`);
  console.log(`Ownership Tx: ${tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });