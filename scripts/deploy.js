// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const _marketingWallet = "0x9BDF45659d8C0BEa1c59b6C66fa27a4E13c6C619";
  const _teamWallet = "0x3A4019F2131322567ca3Ff955C1fA2407C893Dd9";
  const _router = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3";

  const EmpireBridgeVault = await ethers.getContractFactory(
    "EmpireBridgeVault"
  );
  const bridgeVault = await EmpireBridgeVault.deploy();
  await bridgeVault.deployed();
  console.log("Bridge Vault deployed to:", bridgeVault.address);

  // We get the contract to deploy
  const EmpireToken = await ethers.getContractFactory("EmpireToken");
  const empire = await EmpireToken.deploy(
    _router,
    _marketingWallet,
    _teamWallet,
    bridgeVault.address
  );

  await empire.deployed();

  console.log("EmpireToken deployed to:", empire.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
