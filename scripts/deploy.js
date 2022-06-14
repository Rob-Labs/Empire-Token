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
  const _marketingWallet = "0x7b72c66922170026B1f2cB761E1Db1795135fFcc";
  const _teamWallet = "0x69563591018Ae4291710896A482936df51f31Fb9";
  const _router = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

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

  try {
    await hre.run('verify', {
      address: empire.address,
      constructorArgsParams: [
        _router,
        _marketingWallet,
        _teamWallet,
        bridgeVault.address
      ],
    })
  } catch (error) {
    console.error(error)
    console.log(`Smart contract at address ${bridge.address} is already verified`)
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
