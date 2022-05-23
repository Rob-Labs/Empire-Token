const { expect } = require("chai");
const { ethers } = require("hardhat");

const MaxUint256 = ethers.constants.MaxUint256;
// const dotenv = require("dotenv");

const uniswapV2RouterAbi = require("./abi/IUniswapV2Router02.json").abi;
const uniswapV2PairAbi = require("./abi/IUniswapV2Pair.json").abi;
const WBNBAbi = require("./abi/WBNB.json").abi;
const uniswapV2RouterAddress = "0x10ed43c718714eb63d5aa57b78b54704e256024e";

const airdropValue = ethers.utils.parseUnits("2000", 9);

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

  let routerContract;
  let pairContract;
  let WBNBContract;

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
    await token.enableTrading();

    // airdrop 2000 Empire to client1 - client10
    await token.transfer(client1.address, airdropValue);
    await token.transfer(client2.address, airdropValue);
    await token.transfer(client3.address, airdropValue);
    await token.transfer(client4.address, airdropValue);
    await token.transfer(client5.address, airdropValue);
    await token.transfer(client6.address, airdropValue);
    await token.transfer(client7.address, airdropValue);
    await token.transfer(client8.address, airdropValue);
    await token.transfer(client9.address, airdropValue);
    await token.transfer(client10.address, airdropValue);

    const empirePair = await token.uniswapV2Pair();

    routerContract = new ethers.Contract(
      uniswapV2RouterAddress,
      uniswapV2RouterAbi,
      ethers.provider
    );

    pairContract = new ethers.Contract(
      empirePair,
      uniswapV2PairAbi,
      ethers.provider
    );

    const wbnbAddress = await routerContract.WETH();

    WBNBContract = new ethers.Contract(wbnbAddress, WBNBAbi, ethers.provider);
  });

  describe("Integrate with Pancakeswap / AMM", function () {
    describe("Liquidity Test", function () {
      it("Should be able to add liquidity", async function () {
        // deployer initial balance after send airdrop
        const deployerInitialBalance = await token.balanceOf(deployer.address);

        // 1 milion send to liquidity pool
        const amountEmpireToaddLiquidity = ethers.utils.parseUnits(
          "1000000",
          9
        );

        // 10 BNB to liquidity
        const amountBNBToaddLiquidity = ethers.utils.parseUnits("10", 18);

        // approve first
        await token
          .connect(deployer)
          .approve(uniswapV2RouterAddress, deployerInitialBalance);

        // add liquidity when success
        //its always emit Mint and Sync on pair address
        expect(
          await routerContract
            .connect(deployer)
            .addLiquidityETH(
              token.address,
              amountEmpireToaddLiquidity,
              amountEmpireToaddLiquidity,
              amountBNBToaddLiquidity,
              deployer.address,
              Math.floor(Date.now() / 1000) + 60 * 10,
              { value: amountBNBToaddLiquidity }
            )
        )
          .to.emit(token, "Transfer")
          .withArgs(deployer, pairContract.address, amountEmpireToaddLiquidity)
          .to.emit(WBNBContract, "Deposit")
          .withArgs(routerContract.address, amountBNBToaddLiquidity)
          .to.emit(WBNBContract, "Transfer")
          .withArgs(
            routerContract.address,
            pairContract.address,
            amountBNBToaddLiquidity
          )
          .to.emit(pairContract, "Sync")
          .withArgs(amountEmpireToaddLiquidity, amountBNBToaddLiquidity)
          .to.emit(pairContract, "Mint")
          .withArgs(amountEmpireToaddLiquidity, amountBNBToaddLiquidity);

        const pairEmpireBalance = await token.balanceOf(pairContract.address);
        const deployerAfterBalance = await token.balanceOf(deployer.address);

        // deployer balance should be change
        expect(deployerAfterBalance).to.be.equal(
          deployerInitialBalance.sub(amountEmpireToaddLiquidity)
        );

        // pair address balance should be same as liquidity
        expect(pairEmpireBalance).to.be.equal(amountEmpireToaddLiquidity);
      });

      it("Should be able to remove liquidity", async function () {
        // deployer initial balance after send airdrop
        const deployerInitialBalance = await token.balanceOf(deployer.address);

        // 1 milion send to liquidity pool
        const amountEmpireToaddLiquidity = ethers.utils.parseUnits(
          "1000000",
          9
        );

        // 10 BNB to liquidity
        const amountBNBToaddLiquidity = ethers.utils.parseUnits("10", 18);

        // approve first
        await token
          .connect(deployer)
          .approve(uniswapV2RouterAddress, deployerInitialBalance);

        // add liquidity when success
        //its always emit Mint and Sync on pair address

        await routerContract
          .connect(deployer)
          .addLiquidityETH(
            token.address,
            amountEmpireToaddLiquidity,
            amountEmpireToaddLiquidity,
            amountBNBToaddLiquidity,
            deployer.address,
            Math.floor(Date.now() / 1000) + 60 * 10,
            { value: amountBNBToaddLiquidity }
          );

        const liquidityBalance = await pairContract.balanceOf(deployer.address);
        await pairContract
          .connect(deployer)
          .approve(uniswapV2RouterAddress, liquidityBalance);
        await routerContract
          .connect(deployer)
          .removeLiquidityETH(
            token.address,
            liquidityBalance,
            0,
            0,
            deployer.address,
            MaxUint256
          );
        const liquidityBalanceAfter = await pairContract.balanceOf(
          deployer.address
        );
        expect(liquidityBalanceAfter).to.be.equal(0);
      });
    });
  });
});
