const { expect } = require("chai");
const { ethers } = require("hardhat");
// const dotenv = require("dotenv");

const { zeroAddress, uniswapV2RouterAddress } = require("./helpers/address");
const {
  EMPIRE_TOTAL_SUPPLY,
  MaxUint256,
  parseUnits,
} = require("./helpers/utils");

const {
  WBNBAbi,
  uniswapV2FactoryAbi,
  uniswapV2PairAbi,
  uniswapV2RouterAbi,
} = require("./helpers/abi");

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

  let factoryContract;
  let factoryAddress;
  let routerContract;
  let pairAddress;
  let pairContract;
  let WBNBContract;
  let WBNBAddress;

  let buyPath;
  let sellPath;

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

    const Token = await ethers.getContractFactory("EmpireToken");
    token = await Token.deploy(
      uniswapV2RouterAddress,
      marketingWallet.address,
      teamWallet.address
    );
    await token.deployed();

    // let's assume we finish presale, so I enable trading on each test
    await token.setEnableTrading(true);

    // airdrop 2000 Empire to client1 - client10
    await token.transfer(client1.address, airdropValue);
    await token.transfer(client2.address, airdropValue);
    // await token.transfer(client3.address, airdropValue);
    // await token.transfer(client4.address, airdropValue);
    // await token.transfer(client5.address, airdropValue);
    // await token.transfer(client6.address, airdropValue);
    // await token.transfer(client7.address, airdropValue);
    // await token.transfer(client8.address, airdropValue);
    // await token.transfer(client9.address, airdropValue);
    // await token.transfer(client10.address, airdropValue);

    routerContract = new ethers.Contract(
      uniswapV2RouterAddress,
      uniswapV2RouterAbi,
      ethers.provider
    );

    factoryAddress = await routerContract.factory();
    WBNBAddress = await routerContract.WETH();

    factoryContract = new ethers.Contract(
      factoryAddress,
      uniswapV2FactoryAbi,
      ethers.provider
    );
    pairAddress = await factoryContract.getPair(WBNBAddress, token.address);

    pairContract = new ethers.Contract(
      pairAddress,
      uniswapV2PairAbi,
      ethers.provider
    );

    WBNBContract = new ethers.Contract(WBNBAddress, WBNBAbi, ethers.provider);
    buyPath = [WBNBAddress, token.address];
    sellPath = [token.address, WBNBAddress];
  });

  describe("Integrate with Pancakeswap / AMM", function () {
    describe("Liquidity Test", function () {
      beforeEach(async function () {
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

        await routerContract
          .connect(deployer)
          .addLiquidityETH(
            token.address,
            airdropValue,
            airdropValue,
            amountBNBToaddLiquidity,
            deployer.address,
            Math.floor(Date.now() / 1000) + 60 * 10,
            { value: amountBNBToaddLiquidity }
          );
      });

      // it("Should be able to add liquidity", async function () {
      //   // deployer initial balance after send airdrop
      //   const deployerInitialBalance = await token.balanceOf(deployer.address);

      //   // 1 milion send to liquidity pool
      //   const amountEmpireToaddLiquidity = ethers.utils.parseUnits(
      //     "1000000",
      //     9
      //   );

      //   // 10 BNB to liquidity
      //   const amountBNBToaddLiquidity = ethers.utils.parseUnits("10", 18);

      //   // approve first
      //   await token
      //     .connect(deployer)
      //     .approve(uniswapV2RouterAddress, deployerInitialBalance);

      //   // approve first
      //   // await token
      //   //   .connect(client1)
      //   //   .approve(uniswapV2RouterAddress, MaxUint256);

      //   // add liquidity when success
      //   //its always emit Mint and Sync on pair address
      //   expect(
      //     await routerContract
      //       .connect(deployer)
      //       .addLiquidityETH(
      //         token.address,
      //         airdropValue,
      //         airdropValue,
      //         amountBNBToaddLiquidity,
      //         deployer.address,
      //         Math.floor(Date.now() / 1000) + 60 * 10,
      //         { value: amountBNBToaddLiquidity }
      //       )
      //   )
      //     .to.emit(token, "Transfer")
      //     .withArgs(deployer, pairContract.address, amountEmpireToaddLiquidity)
      //     .to.emit(WBNBContract, "Deposit")
      //     .withArgs(routerContract.address, amountBNBToaddLiquidity)
      //     .to.emit(WBNBContract, "Transfer")
      //     .withArgs(
      //       routerContract.address,
      //       pairContract.address,
      //       amountBNBToaddLiquidity
      //     )
      //     .to.emit(pairContract, "Sync")
      //     .withArgs(amountEmpireToaddLiquidity, amountBNBToaddLiquidity)
      //     .to.emit(pairContract, "Mint")
      //     .withArgs(amountEmpireToaddLiquidity, amountBNBToaddLiquidity);

      //   const pairEmpireBalance = await token.balanceOf(pairContract.address);
      //   const client1Balance = await token.balanceOf(client1.address);
      //   const client2Balance = await token.balanceOf(client2.address);
      //   const deployerAfterBalance = await token.balanceOf(deployer.address);

      //   // deployer balance should not be change
      //   // expect(deployerAfterBalance).to.be.equal(deployerInitialBalance);

      //   // pair address balance should be same as liquidity
      //   expect(pairEmpireBalance).to.be.equal(airdropValue);
      //   expect(client1Balance).to.be.equal(airdropValue);
      //   expect(client2Balance).to.be.equal(airdropValue);
      // });

      it("Should be take fee when buy Empire although buyer is exclude from fee", async function () {
        // await token.connect(deployer).setExcludeFromFee(client1.address, true);
        // // check deployer address is exclude from fee
        // expect(await token.isExcludedFromFee(client1.address)).to.be.equal(
        //   true
        // );

        const initialContractBalance = ethers.BigNumber.from("0");
        const initialClient1Balance = airdropValue;

        const buyEmpireInBNBValue = ethers.utils.parseUnits("2", 18);

        // buy token from pancake router
        await routerContract
          .connect(client1)
          .swapExactETHForTokens(0, buyPath, client1.address, MaxUint256, {
            value: buyEmpireInBNBValue,
          });

        const client1EmpireBalanceAfter = await token.balanceOf(
          client1.address
        );

        const client2EmpireBalanceAfter = await token.balanceOf(
          client2.address
        );
        const contractEmpireBalanceAfter = await token.balanceOf(token.address);

        // check reflection
        expect(client2EmpireBalanceAfter).to.be.gt(airdropValue);
        // check fee
      });

      // it("Should be able to remove liquidity", async function () {
      //   // deployer initial balance after send airdrop
      //   const deployerInitialBalance = await token.balanceOf(deployer.address);

      //   // 1 milion send to liquidity pool
      //   const amountEmpireToaddLiquidity = ethers.utils.parseUnits(
      //     "1000000",
      //     9
      //   );

      //   // 10 BNB to liquidity
      //   const amountBNBToaddLiquidity = ethers.utils.parseUnits("10", 18);

      //   // approve first
      //   await token
      //     .connect(deployer)
      //     .approve(uniswapV2RouterAddress, deployerInitialBalance);

      //   // add liquidity when success
      //   //its always emit Mint and Sync on pair address

      //   await routerContract
      //     .connect(deployer)
      //     .addLiquidityETH(
      //       token.address,
      //       amountEmpireToaddLiquidity,
      //       amountEmpireToaddLiquidity,
      //       amountBNBToaddLiquidity,
      //       deployer.address,
      //       Math.floor(Date.now() / 1000) + 60 * 10,
      //       { value: amountBNBToaddLiquidity }
      //     );

      //   const liquidityBalance = await pairContract.balanceOf(deployer.address);
      //   await pairContract
      //     .connect(deployer)
      //     .approve(uniswapV2RouterAddress, liquidityBalance);
      //   await routerContract
      //     .connect(deployer)
      //     .removeLiquidityETH(
      //       token.address,
      //       liquidityBalance,
      //       0,
      //       0,
      //       deployer.address,
      //       MaxUint256
      //     );
      //   const liquidityBalanceAfter = await pairContract.balanceOf(
      //     deployer.address
      //   );
      //   expect(liquidityBalanceAfter).to.be.equal(0);
      // });
    });
  });
});
