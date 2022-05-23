const { expect } = require("chai");
const { ethers } = require("hardhat");
// const dotenv = require("dotenv");

const deadAddress = "0x000000000000000000000000000000000000dEaD";

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

    // let's assume we finish presale, so I enable trading on each test
    // await token.enableTrading();
  });

  describe("Deployment", function () {
    it("Has a correct name 'EmpireToken'", async function () {
      expect(await token.name()).to.equal("EmpireToken");
    });

    it("Has a correct symbol 'EMPIRE'", async function () {
      expect(await token.symbol()).to.equal("EMPIRE");
    });

    it("Has 9 decimals", async function () {
      expect(await token.decimals()).to.equal(9);
    });

    it("Has 1 billion tokens with 9 decimal units (10^18)", async function () {
      expect(await token.totalSupply()).to.equal(maxSupplyBn);
    });

    it("Correct Marketing address wallet", async function () {
      expect(await token.marketingWallet()).to.equal(marketingWallet.address);
    });

    it("Correct Team address wallet", async function () {
      expect(await token.teamWallet()).to.equal(teamWallet.address);
    });

    it("Correct Liquidity address wallet", async function () {
      expect(await token.liquidityWallet()).to.equal(deployer.address);
    });

    it("Correct Dead (burn) address wallet", async function () {
      expect(await token.burnWallet()).to.equal(deadAddress);
    });
  });
});
