const { expect } = require("chai");
const { ethers } = require("hardhat");

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

  describe("Public Write Methods", function () {
    it("Only deployer can use them", async function () {
      expect(
        token.connect(client1).setMarketingWallet(newWallet.address)
      ).to.be.revertedWith("Ownable: caller is not the deployer");
      await expect(
        token.connect(deployer).setMarketingWallet(newWallet.address)
      ).to.not.be.reverted;
    });

    it("Changes the Marketing Wallet", async function () {
      await expect(token.connect(client1).setMarketingWallet(newWallet.address))
        .to.be.reverted;
      expect(await token.marketingWallet()).to.equal(marketingWallet.address);
      await token.connect(deployer).setMarketingWallet(newWallet.address);
      expect(await token.marketingWallet()).to.equal(newWallet.address);
    });

    it("Changes the Team Wallet", async function () {
      await expect(token.connect(client1).setTeamWallet(newWallet.address)).to
        .be.reverted;
      expect(await token.teamWallet()).to.equal(teamWallet.address);
      await token.connect(deployer).setTeamWallet(newWallet.address);
      expect(await token.teamWallet()).to.equal(newWallet.address);
    });

    it("Excludes from fees", async function () {
      await expect(token.connect(client1).excludeFromFee(newWallet.address)).to
        .be.reverted;
      await token.connect(deployer).excludeFromFee(marketingWallet.address);
      expect(await token.isExcludedFromFee(marketingWallet.address)).to.equal(
        true
      );
      await token.connect(deployer).includeInFee(marketingWallet.address);
      expect(await token.isExcludedFromFee(marketingWallet.address)).to.equal(
        false
      );
    });

    it("Toggles SwapAndLiquify", async function () {
      expect(await token.swapAndLiquifyEnabled()).to.equal(true);
      await expect(token.connect(client1).setSwapAndLiquifyEnabled(false)).to.be
        .reverted;
      await token.connect(deployer).setSwapAndLiquifyEnabled(false);
      expect(await token.swapAndLiquifyEnabled()).to.equal(false);
      await token.connect(deployer).setSwapAndLiquifyEnabled(true);
      expect(await token.swapAndLiquifyEnabled()).to.equal(true);
    });

    it("Changes the Liquidity Wallet", async function () {
      await expect(
        token.connect(client1).updateLiquidityWallet(newWallet.address)
      ).to.be.reverted;
      expect(await token.liquidityWallet()).to.equal(deployer.address);
      await token.connect(deployer).updateLiquidityWallet(newWallet.address);
      expect(await token.liquidityWallet()).to.equal(newWallet.address);
    });
  });
});
