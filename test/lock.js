const { expect } = require("chai");
const { ethers } = require("hardhat");
// const dotenv = require("dotenv");

const { uniswapV2RouterAddress } = require("./helpers/address");
const deadAddress = "0x000000000000000000000000000000000000dEaD";

const airdropValue = ethers.utils.parseUnits("200000", 9);
const mintValue = ethers.utils.parseUnits("20000", 9);
const burnValue = ethers.utils.parseUnits("2000", 9);

describe("Empire Token Interaction with bridge", function () {
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
      uniswapV2RouterAddress,
      marketingWallet.address,
      teamWallet.address,
      bridgeVault.address
    );
    await token.deployed();

    // let's assume we finish presale, so I enable trading on each test
    await token.setEnableTrading(true);
    await token.setBridge(bridgeAddr.address);

    // airdrop for client
    await token.transfer(bridgeVault.address, mintValue);
    await token.transfer(client1.address, airdropValue);
    await token.transfer(client2.address, airdropValue);
    await token.transfer(client3.address, airdropValue);
    await token.transfer(client4.address, airdropValue);
    await token.transfer(client5.address, airdropValue);
  });

  describe("Check Lock and Unlock from Bridge", function () {
    it("Correct balance change after lock", async function () {
      const client1_balance = await token.balanceOf(client1.address);
      const client2_balance_before = await token.balanceOf(client2.address);
      const bridgeVault_balance_before = await token.balanceOf(
        bridgeVault.address
      );
      const initTotalSupply = await token.totalSupply();
      const initCircSupply = await token.circulatingSupply();
      
      expect(initTotalSupply).to.equal(
        initCircSupply.add(bridgeVault_balance_before)
      );
      expect(client1_balance).to.equal(airdropValue);

      expect(token.connect(bridgeAddr).lock(client1.address, burnValue)).to.be
        .reverted;

      await token.connect(client1).approve(bridgeAddr.address, burnValue);
      await token.connect(bridgeAddr).lock(client1.address, burnValue);

      const client1_balance_after = await token.balanceOf(client1.address);
      const client2_balance_after_burn = await token.balanceOf(client2.address);
      const totalSupplyAfter = await token.totalSupply();
      const circSupplyAfter = await token.circulatingSupply();
      const bridgeVault_balance_after = await token.balanceOf(
        bridgeVault.address
      );


      expect(initTotalSupply).to.equal(totalSupplyAfter);
      // expect(circSupplyAfter).to.equal(initCircSupply.sub(burnValue));
      expect(bridgeVault_balance_after).to.equal(
        bridgeVault_balance_before.add(burnValue)
      );
      expect(client2_balance_before).to.equal(client2_balance_after_burn);
      expect(client1_balance_after).to.equal(client1_balance.sub(burnValue));
    });

    it("Correct balance change after unlock", async function () {
      const client1_balance = await token.balanceOf(client1.address);
      const client2_balance_before = await token.balanceOf(client2.address);
      const bridgeVault_balance_before = await token.balanceOf(
        bridgeVault.address
      );
      const initTotalSupply = await token.totalSupply();
      const initCircSupply = await token.circulatingSupply();

      expect(initTotalSupply).to.equal(
        initCircSupply.add(bridgeVault_balance_before)
      );

      expect(client1_balance).to.equal(airdropValue);

      await token.connect(bridgeAddr).unlock(client1.address, burnValue);

      const client1_balance_after = await token.balanceOf(client1.address);
      const client2_balance_after_mint = await token.balanceOf(client2.address);
      const totalSupplyAfter = await token.totalSupply();
      const circSupplyAfter = await token.circulatingSupply();
      const bridgeVault_balance_after = await token.balanceOf(
        bridgeVault.address
      );

      expect(initTotalSupply).to.equal(totalSupplyAfter);
      expect(circSupplyAfter).to.equal(initCircSupply.add(burnValue));
      expect(bridgeVault_balance_after).to.equal(
        bridgeVault_balance_before.sub(burnValue)
      );
      expect(client1_balance_after).to.equal(client1_balance.add(burnValue));
      expect(client2_balance_before).to.equal(client2_balance_after_mint);
    });
  });
});
