const { expect } = require("chai");
const { ethers } = require("hardhat");
// const dotenv = require("dotenv");

const uniswapV2RouterAbi = require("./abi/IUniswapV2Router02.json").abi;
const uniswapV2PairAbi = require("./abi/IUniswapV2Pair.json").abi;
const uniswapV2RouterAddress = "0x10ed43c718714eb63d5aa57b78b54704e256024e";
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
    await token.enableTrading();
  });

  describe("Transactions After Presale Finish", function () {
    it("Transfers tokens between accounts", async function () {
      // Transfer 50 tokens from deployer to client1
      await token.connect(deployer).transfer(client1.address, 50);
      expect(await token.balanceOf(client1.address)).to.equal(50);

      // Transfer 50 tokens from client1 to client2
      // We use .connect(signer) to send a transaction from another account
      expect(
        await token.connect(client1).transfer(client2.address, 50)
      ).to.emit(token, "Transfer");
      expect(await token.balanceOf(client1.address)).to.equal(0);
      expect(await token.balanceOf(client2.address)).to.equal(50);
    });

    it("Transfer fails when sender doesn't have enough tokens", async function () {
      const initialDeployerBalance = await token.balanceOf(deployer.address);

      // Try to send 1 token from emptyAddr (0 tokens) to deployer (1000000000 tokens).
      // `require` will evaluate false and revert the transaction.
      expect(
        token.connect(emptyAddr).transfer(deployer.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      // deployer balance shouldn't have changed.
      expect(await token.balanceOf(deployer.address)).to.equal(
        initialDeployerBalance
      );
    });

    it("Updates balances after transfers", async function () {
      const tranfer1value = ethers.utils.parseUnits("2000", 9);
      const tranfer2value = ethers.utils.parseUnits("2500", 9);

      const initialDeployerBalance = await token.balanceOf(deployer.address);

      // Transfer 100 tokens from deployer to client1.
      await token.connect(deployer).transfer(client1.address, tranfer1value);

      // Transfer another 50 tokens from deployer to client2.
      await token.connect(deployer).transfer(client2.address, tranfer2value);

      // Check balances.
      const finalDeployerBalance = await token.balanceOf(deployer.address);
      expect(finalDeployerBalance).to.equal(
        initialDeployerBalance.sub(tranfer1value).sub(tranfer2value)
      );

      const client1Balance = await token.balanceOf(client1.address);
      expect(client1Balance).to.equal(tranfer1value);

      const client2Balance = await token.balanceOf(client2.address);
      expect(client2Balance).to.equal(tranfer2value);
    });
  });
});
