const { expect } = require("chai");
const { ethers } = require("hardhat");

const utils = ethers.utils;
const parseUnits = utils.parseUnits;
const formatUnits = utils.formatUnits;
const MaxUint256 = ethers.constants.MaxUint256;
// const dotenv = require("dotenv");

const uniswapV2RouterAbi = require("./abi/IUniswapV2Router02.json").abi;
const uniswapV2PairAbi = require("./abi/IUniswapV2Pair.json").abi;
const WBNBAbi = require("./abi/WBNB.json").abi;
const uniswapV2RouterAddress = "0x10ed43c718714eb63d5aa57b78b54704e256024e";
const deadAddress = "0x000000000000000000000000000000000000dEaD";

const airdropValue = parseUnits("100000", 9);

describe("Empire Token Reflection and Fee Test", function () {
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
    buyPath = [wbnbAddress, token.address];
    sellPath = [token.address, wbnbAddress];

    // deployer set AMM to activate buy and sell tax
    await token.setAutomatedMarketMakerPair(empirePair);

    /**
     *
     * deployer make airdrop to 10 address which each address
     * got 100.000 Empire
     *
     */

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

    /**
     * set address client9 and client10 to exclude from reward
     */

    await token.excludeFromReward(client9.address);
    await token.excludeFromReward(client10.address);
  });

  describe("Transfer between account, exclude AMM Pair address", function () {
    it("Should doesn't takes fee when transfer between wallets", async function () {
      // we know client 1 -10 have airdrop balance 100.000 Empire
      const initialClientBalance = airdropValue;

      // amount to transfer
      const transferAmount = parseUnits("10000", 9);

      /**
       * expect empire token to emit Transfer
       */
      expect(
        await token.connect(client1).transfer(client2.address, transferAmount)
      ).to.emit(token, "Transfer");

      /**
       * balance client 1 decrease to 90.000
       */
      expect(await token.balanceOf(client1.address)).to.equal(
        initialClientBalance.sub(transferAmount)
      );
      /**
       * balance client2 increase to 110.0000
       */
      expect(await token.balanceOf(client2.address)).to.equal(
        initialClientBalance.add(transferAmount)
      );
    });
  });

  describe("Transfer from or to AMM Pair address (Buy Sell Transfer)", function () {
    beforeEach(async function () {
      // add liquidity first before each test

      // initial deployer balance = 999.000.000 (1.000.000.000 - 1.000.000)
      // because 1 million already sent to airdrop
      const deployerInitialBalance = await token.balanceOf(deployer.address);

      // 500.000.000 Empire to add liquidity
      const amountEmpireToaddLiquidity = parseUnits("500000000", 9);

      // 500 BNB to liquidity
      const amountBNBToaddLiquidity = ethers.utils.parseUnits("500", 18);

      // deployer approve all balance
      await token
        .connect(deployer)
        .approve(uniswapV2RouterAddress, deployerInitialBalance);

      // deployer set initial liquidity to
      // 500M EMPIRE : 500 BNB
      // it expect when buy 1 BNB get close to 1M EMPIRE

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
    });

    it("Make sure we already add Liquidity", async function () {
      // check deployer balance
      // it should be 499M Empire
      expect(await token.balanceOf(deployer.address)).equal(
        parseUnits("499000000", 9)
      );

      // check pair address balance
      // it should be 500M Empire
      expect(await token.balanceOf(pairContract.address)).equal(
        parseUnits("500000000", 9)
      );

      // check pair address balance
      // it should be 500 WBNB
      expect(await WBNBContract.balanceOf(pairContract.address)).equal(
        parseUnits("500", 18)
      );
    });

    it("Should be take fee when buy Empire although buyer is exclude from fee", async function () {
      // check deployer address is exclude from fee
      expect(await token.isExcludedFromFee(deployer.address)).to.be.equal(true);

      const initialContractBalance = ethers.BigNumber.from("0");
      const initialClient1Balance = airdropValue;

      const buyEmpireInBNBValue = ethers.utils.parseUnits("2", 18);

      // buy token from pancake router
      await routerContract
        .connect(client1)
        .swapExactETHForTokens(0, buyPath, client1.address, MaxUint256, {
          value: buyEmpireInBNBValue,
        });

      const client1EmpireBalanceAfter = await token.balanceOf(client1.address);
      const contractEmpireBalanceAfter = await token.balanceOf(token.address);

      // check reflection
      expect(client1EmpireBalanceAfter.toNumber()).greaterThan(
        initialClient1Balance.toNumber()
      );
      // check fee
      expect(contractEmpireBalanceAfter.toNumber()).greaterThan(
        initialContractBalance.toNumber()
      );
    });

    it("Should be take correct fee when buy Empire and Reflect Fee to Holder", async function () {
      /**
       *
       * as we know, on before each hook deployer make airdrop to client 1-10
       * so client 1-10 have same 100.000 EMPIRE initial balance
       *
       * and also marketing, team, and contract balance is 0 at initial state
       *
       */

      const initialClient1Balance = airdropValue;
      const initialClient2Balance = airdropValue;
      const initialClient3Balance = airdropValue;
      const initialClient4Balance = airdropValue;
      const initialClient5Balance = airdropValue;
      const initialClient6Balance = airdropValue;
      const initialClient7Balance = airdropValue;
      const initialClient8Balance = airdropValue;
      const initialClient9Balance = airdropValue;
      const initialClient10Balance = airdropValue;

      const initialMarketingBalance = ethers.BigNumber.from("0");
      const initialTeamBalance = ethers.BigNumber.from("0");
      const initialContractBalance = ethers.BigNumber.from("0");

      /**
       * make sure we check buy fee and sell fee first
       *
       * total buyFee = 10 %
       *    - autoLp = 4
       *    - burn = 0
       *    - marketing = 3
       *    - tax (reflection) = 2
       *    - team = 1
       * total sellFee = 10
       *    - autoLp = 4
       *    - burn = 0
       *    - marketing = 3
       *    - tax (reflection) = 2
       *    - team = 1
       *
       */

      const tokenBuyFee = await token.buyFee();
      const tokenSellFee = await token.sellFee();

      // check buy fee
      expect(tokenBuyFee.autoLp.toNumber()).equal(4);
      expect(tokenBuyFee.burn.toNumber()).equal(0);
      expect(tokenBuyFee.marketing.toNumber()).equal(3);
      expect(tokenBuyFee.tax.toNumber()).equal(2);
      expect(tokenBuyFee.team.toNumber()).equal(1);

      // check sell fee
      expect(tokenSellFee.autoLp.toNumber()).equal(4);
      expect(tokenSellFee.burn.toNumber()).equal(0);
      expect(tokenSellFee.marketing.toNumber()).equal(3);
      expect(tokenSellFee.tax.toNumber()).equal(2);
      expect(tokenSellFee.team.toNumber()).equal(1);

      /**
       * lets try to perform buy
       *
       */

      const buyEmpireInBNBValue = ethers.utils.parseUnits("10", 18);

      // buy token from pancake router
      await routerContract
        .connect(client1)
        .swapExactETHForTokens(0, buyPath, client1.address, MaxUint256, {
          value: buyEmpireInBNBValue,
        });

      const client1EmpireBalanceAfter = await token.balanceOf(client1.address);
      const client2EmpireBalanceAfter = await token.balanceOf(client2.address);
      const client3EmpireBalanceAfter = await token.balanceOf(client3.address);
      const client4EmpireBalanceAfter = await token.balanceOf(client4.address);
      const client5EmpireBalanceAfter = await token.balanceOf(client5.address);
      const client6EmpireBalanceAfter = await token.balanceOf(client6.address);
      const client7EmpireBalanceAfter = await token.balanceOf(client7.address);
      const client8EmpireBalanceAfter = await token.balanceOf(client8.address);
      const client9EmpireBalanceAfter = await token.balanceOf(client9.address);
      const client10EmpireBalanceAfter = await token.balanceOf(
        client10.address
      );
      const contractEmpireBalanceAfter = await token.balanceOf(token.address);

      const amountBuyOut = client1EmpireBalanceAfter.sub(initialClient1Balance);
      //   console.log(amountBuyOut);
      //   console.log(contractEmpireBalanceAfter);
      //   console.log(client2EmpireBalanceAfter);

      //   client1 balance change increase because he buy empire
      expect(client1EmpireBalanceAfter.toNumber()).greaterThan(
        initialClient1Balance.toNumber()
      );

      // contract balance it should increase because take 8% fee
      // why 8%, because 2% is for reflection
      // and 8% is for liquidity, team and marketing
      // and it will be keep at contract balance
      // before contract trigger swapAndLiquify function

      expect(contractEmpireBalanceAfter.toNumber()).greaterThan(
        initialContractBalance.toNumber()
      );

      // client2-8 balance change increase because his wallet is in reward
      expect(client2EmpireBalanceAfter.toNumber()).greaterThan(
        initialClient2Balance.toNumber()
      );

      expect(client3EmpireBalanceAfter.toNumber()).greaterThan(
        initialClient3Balance.toNumber()
      );

      expect(client4EmpireBalanceAfter.toNumber()).greaterThan(
        initialClient4Balance.toNumber()
      );

      expect(client5EmpireBalanceAfter.toNumber()).greaterThan(
        initialClient5Balance.toNumber()
      );

      expect(client6EmpireBalanceAfter.toNumber()).greaterThan(
        initialClient6Balance.toNumber()
      );

      expect(client7EmpireBalanceAfter.toNumber()).greaterThan(
        initialClient7Balance.toNumber()
      );

      expect(client8EmpireBalanceAfter.toNumber()).greaterThan(
        initialClient8Balance.toNumber()
      );

      // client9 and client 10 balance should always same
      // because they exclude from reward

      expect(client9EmpireBalanceAfter.toNumber()).equal(
        initialClient9Balance.toNumber()
      );

      expect(client10EmpireBalanceAfter.toNumber()).equal(
        initialClient10Balance.toNumber()
      );

      // lets compare client 2 and client 3 balance
      // it MUST be same, because client2 and client3 have same initial balance
      // this check mean that reflection is correct distribution

      expect(client2EmpireBalanceAfter.toNumber()).equal(
        client3EmpireBalanceAfter.toNumber()
      );

      /**
       * lets try to calculate more accurate
       * so if client buy, client will get 90% EMPIRE
       * 8% for fee
       * 2% for reflect
       */

      //   const unitA = amountBuyOut.div(90);
      //   const unitB = contractEmpireBalanceAfter.div(8);
      //   console.log(`Print Unit A and B`);
      //   console.log(formatUnits(unitA, 9));
      //   console.log(formatUnits(unitB, 9));

      // Test result :
      //
      // if buy 2BNB
      // 19881.471190891 this is 1% if i calculate from 90% client1 token get
      // 19881.427009942 this is 1% if i calculate from 8% contract fee
      //
      // if buy 1BNB
      // 9960.340147233 this is 1% if i calculate from 90% client1 token get
      // 9960.318013192 this is 1% if i calculate from 8% contract fee
      //
      // if buy 0.01 BNB
      // 99.798249724 this is 1% if i calculate from 90% client1 token get
      // 99.798027950 this is 1% if i calculate from 8% contract fee
      //
      // if buy 5 BNB
      // 49411.911322638 this is 1% if i calculate from 90% client1 token get
      // 49411.801518635 this is 1% if i calculate from 8% contract fee
      //
      // if buy 10 BNB
      // 97866.343680121 this is 1% if i calculate from 90% client1 token get
      // 97866.126199840 this is 1% if i calculate from 8% contract fee
      //
      // if buy 100 BNB
      // 833332.401843829 this is 1% if i calculate from 90% client1 token get
      // 833330.549998162 this is 1% if i calculate from 8% contract fee
    });

    it("Should be take fee when sell Empire and deliver to marketing and team", async function () {
      // we know numTokensSellToAddToLiquidity is 8000 EMPIRE from contract source code
      // so I send 10.000 EMPIRE to contract

      //   await token
      //     .connect(deployer)
      //     .transfer(token.address, parseUnits("10000", 9));

      //   expect(await token.balanceOf(token.address)).to.be.equal(
      //     parseUnits("10000", 9)
      //   );

      const initialMarketingBalance = ethers.BigNumber.from("0");
      const initialTeamBalance = ethers.BigNumber.from("0");

      /**
       * now Empire contract hold 100.000 EMPIRE
       * and if someone sell EMPIRE on AMM Pair
       * it will trigger swapLiquify
       * it will take fee
       * it will distribute to team
       * it will distribute to marketing
       */

      // client1 try to sell half balance (50.000 EMPIRE)
      // we know initial balance client1 is same as airdrop value

      // const numEmpireToSell = airdropValue.div(200);
      // const numEmpireToSellEx = numEmpireToSell.div(100).mul(60);
      await token
        .connect(client1)
        .approve(routerContract.address, airdropValue);

      // we expect Empire contract to swap and liquify
      // we expect Empire contract to swap and distribute

      // console.log(airdropValue);
      // console.log(numEmpireToSell);
      await routerContract
        .connect(client1)
        .swapExactTokensForETHSupportingFeeOnTransferTokens(
          airdropValue,
          0,
          sellPath,
          client1.address,
          MaxUint256
        );

      const client1EmpireBalanceAfter = await token.balanceOf(client1.address);
      //   const contractEmpireBalanceAfter = await token.balanceOf(token.address);

      //   // check reflection
      expect(client1EmpireBalanceAfter.toNumber()).equal(0);
      //   // check fee
      //   expect(contractEmpireBalanceAfter.toNumber()).greaterThan(
      //     initialContractBalance.toNumber()
      //   );
    });
  });
});
