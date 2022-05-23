const { expect } = require("chai");
const { ethers } = require("hardhat");
// const dotenv = require("dotenv");

describe("Empire Token", function () {
  let deployer;
  let marketingWallet;
  let teamWallet;
  let client1;
  let client2;
  let client3;
  let client4;
  let client5;
  let client6;
  let client7;
  let client8;
  let client9;
  let client10;
  let emptyAddr;
  let bridgeAddr;
  let newWallet;
  let addrs;

  let bridgeVault;
  let token;

  const maxSupplyBn = ethers.BigNumber.from("1000000000000000000");

  beforeEach(async function () {
    // await ethers.provider.send("hardhat_reset"); // This resets removes the fork
    // Reset the fork
    await ethers.provider.send("hardhat_reset", [
      {
        forking: {
          jsonRpcUrl: process.env.BSC_URL,
        },
      },
    ]);
    // Get signers
    [
      deployer,
      marketingWallet,
      teamWallet,
      client1,
      client2,
      client3,
      client4,
      client5,
      client6,
      client7,
      client8,
      client9,
      client10,
      emptyAddr,
      bridgeAddr,
      newWallet,
      ...addrs
    ] = await ethers.getSigners();
    // Deploy contract
    const EmpireBridgeVault = await ethers.getContractFactory(
      "EmpireBridgeVault"
    );
    bridgeVault = await EmpireBridgeVault.deploy();
    await bridgeVault.deployed();
    const Token = await ethers.getContractFactory("EmpireToken");
    token = await Token.deploy(
      marketingWallet.address,
      teamWallet.address,
      bridgeVault.address
    );
    await token.deployed();
  });

  describe("Distribution", function () {
    it("Deployer start with 100% balance", async function () {
      expect(await token.balanceOf(deployer.address)).to.equal(maxSupplyBn);
    });

    it("Users start with empty balance", async function () {
      expect(await token.balanceOf(client1.address)).to.equal(0);
    });
  });
});
