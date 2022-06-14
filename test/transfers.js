const { expect } = require("chai");
const { ethers } = require("hardhat");

const { zeroAddress, uniswapV2RouterAddress } = require("./helpers/address");
const {
  WBNBAbi,
  uniswapV2FactoryAbi,
  uniswapV2PairAbi,
  uniswapV2RouterAbi,
} = require("./helpers/abi");
const {
  EMPIRE_TOTAL_SUPPLY,
  MaxUint256,
  parseUnits,
  formatUnits,
  AIRDROP_VALUE,
  INITIAL_BNB_LIQUIDITY,
  INITIAL_EMPIRE_LIQUIDITY,
  DEFAULT_EMPIRE_TRANSFER,
} = require("./helpers/utils");

describe("Empire Token Transfer Test", function () {
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
  });

  describe("Transfer at Presale Time", function () {
    it("Transfer when Presale Time require sender and receiver is excluded from fee", async function () {
      expect(
        token.connect(deployer).transfer(client5.address, 50)
      ).to.be.revertedWith("Trading is disabled");
      await token.connect(deployer).setExcludeFromFee(client1.address, true);

      expect(token.connect(deployer).transfer(client1.address, 50)).to.not.be
        .reverted;

    });
  });

  describe("Transfer after Presale Time", function () {
    beforeEach(async function () {
      // set tracing enabled
      await token.setEnableTrading(true);
    });

    describe("Transfers tokens between accounts", function () {
      beforeEach(async function () {
        // send airdrop to client1 and client2
        await token.connect(deployer).transfer(client1.address, AIRDROP_VALUE);
        await token.connect(deployer).transfer(client2.address, AIRDROP_VALUE);
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

      it("Correct updates balances after transfers", async function () {
        const initialDeployerBalance = await token.balanceOf(deployer.address);

        // Transfer 500 tokens from deployer to client1.
        await token
          .connect(deployer)
          .transfer(client1.address, DEFAULT_EMPIRE_TRANSFER);

        // Transfer another 500 tokens from deployer to client2.
        await token
          .connect(deployer)
          .transfer(client2.address, DEFAULT_EMPIRE_TRANSFER);

        // Check balances.
        const finalDeployerBalance = await token.balanceOf(deployer.address);
        expect(finalDeployerBalance).to.equal(
          initialDeployerBalance
            .sub(DEFAULT_EMPIRE_TRANSFER)
            .sub(DEFAULT_EMPIRE_TRANSFER)
        );

        const client1Balance = await token.balanceOf(client1.address);
        expect(client1Balance).to.equal(
          AIRDROP_VALUE.add(DEFAULT_EMPIRE_TRANSFER)
        );

        const client2Balance = await token.balanceOf(client2.address);
        expect(client2Balance).to.equal(
          AIRDROP_VALUE.add(DEFAULT_EMPIRE_TRANSFER)
        );
      });
    });
  });

  describe("Liquidity, Trade and Reflection Test", function () {
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
      // set trading enabled
      await token.setEnableTrading(true);
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

    describe("Liquidity Test", function () {
      beforeEach(async function () {
        // nothing
      });

      it("Should be able to add liquidity", async function () {
        // deployer initial balance after send airdrop
        const deployerInitialBalance = await token.balanceOf(deployer.address);

        // approve first
        await token
          .connect(deployer)
          .approve(uniswapV2RouterAddress, deployerInitialBalance);

        // add liquidity when success
        // its always emit Mint and Sync on pair address
        expect(
          await routerContract
            .connect(deployer)
            .addLiquidityETH(
              token.address,
              INITIAL_EMPIRE_LIQUIDITY,
              INITIAL_EMPIRE_LIQUIDITY,
              INITIAL_BNB_LIQUIDITY,
              deployer.address,
              Math.floor(Date.now() / 1000) + 60 * 10,
              { value: INITIAL_BNB_LIQUIDITY }
            )
        )
          .to.emit(token, "Transfer")
          .withArgs(deployer, pairContract.address, INITIAL_EMPIRE_LIQUIDITY)
          .to.emit(WBNBContract, "Deposit")
          .withArgs(routerContract.address, INITIAL_BNB_LIQUIDITY)
          .to.emit(WBNBContract, "Transfer")
          .withArgs(
            routerContract.address,
            pairContract.address,
            INITIAL_BNB_LIQUIDITY
          )
          .to.emit(pairContract, "Sync")
          .withArgs(INITIAL_EMPIRE_LIQUIDITY, INITIAL_BNB_LIQUIDITY)
          .to.emit(pairContract, "Mint")
          .withArgs(INITIAL_EMPIRE_LIQUIDITY, INITIAL_BNB_LIQUIDITY);

        const pairEmpireBalance = await token.balanceOf(pairContract.address);
        const deployerAfterBalance = await token.balanceOf(deployer.address);

        // deployer balance should be change
        expect(deployerAfterBalance).to.be.equal(
          deployerInitialBalance.sub(INITIAL_EMPIRE_LIQUIDITY)
        );

        // pair address balance should be same as liquidity
        expect(pairEmpireBalance).to.be.equal(INITIAL_EMPIRE_LIQUIDITY);
      });

      it("Should be able to remove liquidity", async function () {
        // deployer initial balance after send airdrop
        const deployerInitialBalance = await token.balanceOf(deployer.address);

        // approve first
        await token
          .connect(deployer)
          .approve(uniswapV2RouterAddress, deployerInitialBalance);

        // add liquidity when success
        // its always emit Mint and Sync on pair address
        expect(
          await routerContract
            .connect(deployer)
            .addLiquidityETH(
              token.address,
              INITIAL_EMPIRE_LIQUIDITY,
              INITIAL_EMPIRE_LIQUIDITY,
              INITIAL_BNB_LIQUIDITY,
              deployer.address,
              Math.floor(Date.now() / 1000) + 60 * 10,
              { value: INITIAL_BNB_LIQUIDITY }
            )
        )
          .to.emit(token, "Transfer")
          .withArgs(deployer, pairContract.address, INITIAL_EMPIRE_LIQUIDITY)
          .to.emit(WBNBContract, "Deposit")
          .withArgs(routerContract.address, INITIAL_BNB_LIQUIDITY)
          .to.emit(WBNBContract, "Transfer")
          .withArgs(
            routerContract.address,
            pairContract.address,
            INITIAL_BNB_LIQUIDITY
          )
          .to.emit(pairContract, "Sync")
          .withArgs(INITIAL_EMPIRE_LIQUIDITY, INITIAL_BNB_LIQUIDITY)
          .to.emit(pairContract, "Mint")
          .withArgs(INITIAL_EMPIRE_LIQUIDITY, INITIAL_BNB_LIQUIDITY);

        const pairEmpireBalance = await token.balanceOf(pairContract.address);
        const deployerAfterBalance = await token.balanceOf(deployer.address);

        // deployer balance should be change
        expect(deployerAfterBalance).to.be.equal(
          deployerInitialBalance.sub(INITIAL_EMPIRE_LIQUIDITY)
        );

        // pair address balance should be same as liquidity
        expect(pairEmpireBalance).to.be.equal(INITIAL_EMPIRE_LIQUIDITY);

        /**
         * remove liquidity
         * use removeLiquidityETHSupportingFeeOnTransferTokens
         *
         */
        const liquidityBalance = await pairContract.balanceOf(deployer.address);
        await pairContract
          .connect(deployer)
          .approve(uniswapV2RouterAddress, liquidityBalance);
        await routerContract
          .connect(deployer)
          .removeLiquidityETHSupportingFeeOnTransferTokens(
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

    describe("Trading (Buy /Sell) Test", function () {
      beforeEach(async function () {
        // make airdrop for client7-10 so we can track balance at test
        await token.connect(deployer).transfer(client7.address, AIRDROP_VALUE);
        await token.connect(deployer).transfer(client8.address, AIRDROP_VALUE);
        await token.connect(deployer).transfer(client9.address, AIRDROP_VALUE);
        await token.connect(deployer).transfer(client10.address, AIRDROP_VALUE);

        // set client 7 and 8 to exlucded from reward
        await token.connect(deployer).excludeFromReward(client7.address);
        await token.connect(deployer).excludeFromReward(client8.address);

        // set client 8 to exclude from fee
        await token.connect(deployer).setExcludeFromFee(client8.address, true);

        // add liquidity first
        await token
          .connect(deployer)
          .approve(uniswapV2RouterAddress, MaxUint256);

        // add 500M EMPIRE : 500 BNB
        await routerContract
          .connect(deployer)
          .addLiquidityETH(
            token.address,
            INITIAL_EMPIRE_LIQUIDITY,
            INITIAL_EMPIRE_LIQUIDITY,
            INITIAL_BNB_LIQUIDITY,
            deployer.address,
            Math.floor(Date.now() / 1000) + 60 * 10,
            { value: INITIAL_BNB_LIQUIDITY }
          );
      });

      it("User should be able to buy and sell EMPIRE on AMM", async function () {
        let client1EmpireBalance = await token.balanceOf(client1.address);
        //try to buy 1BNB
        const buyValue = ethers.utils.parseUnits("1", 18);

        expect(
          await routerContract
            .connect(client1)
            .swapExactETHForTokens(0, buyPath, client1.address, MaxUint256, {
              value: buyValue,
            })
        )
          .to.emit(WBNBContract, "Deposit")
          .withArgs(routerContract.address, buyValue)
          .to.emit(WBNBContract, "Transfer")
          .withArgs(routerContract.address, pairContract.address, buyValue)
          .to.emit(token, "Transfer")
          .to.emit(pairContract, "Sync")
          .to.emit(pairContract, "Swap");

        let client1EmpireBalanceAfter = await token.balanceOf(client1.address);

        // client1 balance change
        expect(client1EmpireBalanceAfter).to.gt(client1EmpireBalance);

        // sell test
        await token
          .connect(client1)
          .approve(routerContract.address, client1EmpireBalanceAfter);

        expect(
          await routerContract
            .connect(client1)
            .swapExactTokensForETHSupportingFeeOnTransferTokens(
              client1EmpireBalanceAfter,
              0,
              sellPath,
              client1.address,
              MaxUint256
            )
        );

        const client1EmpireBalanceAfterSell = await token.balanceOf(
          client1.address
        );

        expect(client1EmpireBalanceAfterSell.toNumber()).equal(0);
      });

      it("Should be take fee when buy/sell EMPIRE from Include in Fee address", async function () {
        // check deployer address is exclude from fee
        expect(await token.isExcludedFromFee(client1.address)).to.be.equal(
          false
        );

        const initialContractBalance = ethers.BigNumber.from("0");
        const initialClient1Balance = await token.balanceOf(client1.address);

        const buyEmpireInBNBValue = parseUnits("2", 18);

        // buy token from pancake router
        await routerContract
          .connect(client1)
          .swapExactETHForTokens(0, buyPath, client1.address, MaxUint256, {
            value: buyEmpireInBNBValue,
          });

        const client1EmpireBalanceAfter = await token.balanceOf(
          client1.address
        );
        const contractEmpireBalanceAfter = await token.balanceOf(token.address);

        expect(client1EmpireBalanceAfter).to.gt(initialClient1Balance);
        // check fee
        expect(contractEmpireBalanceAfter).to.gt(initialContractBalance);

        // sell test
        await token
          .connect(client1)
          .approve(routerContract.address, client1EmpireBalanceAfter);

        expect(
          await routerContract
            .connect(client1)
            .swapExactTokensForETHSupportingFeeOnTransferTokens(
              client1EmpireBalanceAfter,
              0,
              sellPath,
              client1.address,
              MaxUint256
            )
        );

        const client1EmpireBalanceAfterSell = await token.balanceOf(
          client1.address
        );
        const contractEmpireBalanceAfterSell = await token.balanceOf(
          token.address
        );

        expect(client1EmpireBalanceAfterSell).to.equal(0);

        expect(contractEmpireBalanceAfterSell).to.gt(
          contractEmpireBalanceAfter
        );
      });

      it("Should not be take fee when buy/sell EMPIRE from Exclude in Fee address", async function () {
        // check deployer address is exclude from fee
        expect(await token.isExcludedFromFee(client8.address)).to.be.equal(
          true
        );

        const initialContractBalance = await token.balanceOf(token.address);
        const initialClient8Balance = await token.balanceOf(client8.address);

        const buyEmpireInBNBValue = parseUnits("2", 18);

        // buy token from pancake router
        await routerContract
          .connect(client8)
          .swapExactETHForTokens(0, buyPath, client8.address, MaxUint256, {
            value: buyEmpireInBNBValue,
          });

        const client8EmpireBalanceAfter = await token.balanceOf(
          client8.address
        );
        const contractEmpireBalanceAfter = await token.balanceOf(token.address);

        expect(client8EmpireBalanceAfter).to.gt(initialClient8Balance);
        // check fee
        expect(contractEmpireBalanceAfter).to.eq(initialContractBalance);

        // sell test
        await token
          .connect(client8)
          .approve(routerContract.address, client8EmpireBalanceAfter);

        expect(
          await routerContract
            .connect(client8)
            .swapExactTokensForETHSupportingFeeOnTransferTokens(
              client8EmpireBalanceAfter,
              0,
              sellPath,
              client8.address,
              MaxUint256
            )
        );

        const client8EmpireBalanceAfterSell = await token.balanceOf(
          client8.address
        );
        const contractEmpireBalanceAfterSell = await token.balanceOf(
          token.address
        );

        expect(client8EmpireBalanceAfterSell).to.equal(0);

        expect(contractEmpireBalanceAfterSell).to.eq(
          contractEmpireBalanceAfter
        );
      });

      it("Should be take correct fee when buy Empire and Reflect Fee to Holder", async function () {
        const initialContractBalance = await token.balanceOf(token.address);
        const initialMarketingBalance = await token.balanceOf(
          marketingWallet.address
        );
        const initialTeamBalance = await token.balanceOf(teamWallet.address);
        const initialClient1Balance = await token.balanceOf(client1.address);
        const initialClient7Balance = await token.balanceOf(client7.address);
        const initialClient8Balance = await token.balanceOf(client8.address);
        const initialClient9Balance = await token.balanceOf(client9.address);
        const initialClient10Balance = await token.balanceOf(client10.address);

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

        const buyEmpireInBNBValue = parseUnits("10", 18);

        // buy token from pancake router
        await routerContract
          .connect(client1)
          .swapExactETHForTokens(0, buyPath, client1.address, MaxUint256, {
            value: buyEmpireInBNBValue,
          });

        const client1EmpireBalanceAfter = await token.balanceOf(
          client1.address
        );

        const client7EmpireBalanceAfter = await token.balanceOf(
          client7.address
        );
        const client8EmpireBalanceAfter = await token.balanceOf(
          client8.address
        );
        const client9EmpireBalanceAfter = await token.balanceOf(
          client9.address
        );
        const client10EmpireBalanceAfter = await token.balanceOf(
          client10.address
        );
        const contractEmpireBalanceAfter = await token.balanceOf(token.address);

        const amountBuyOut = client1EmpireBalanceAfter.sub(
          initialClient1Balance
        );

        expect(client1EmpireBalanceAfter).to.gt(initialClient1Balance);

        // contract balance it should increase because take 8% fee
        // why 8%, because 2% is for reflection
        // and 8% is for liquidity, team and marketing
        // and it will be keep at contract balance
        // before contract trigger swapAndLiquify function

        expect(contractEmpireBalanceAfter).to.gt(initialContractBalance);

        // client7-8 balance change increase because his wallet is in reward
        // client7-8 balance should always same
        // because they exclude from reward

        expect(client7EmpireBalanceAfter).to.eq(initialClient7Balance);

        expect(client8EmpireBalanceAfter).to.eq(initialClient8Balance);

        // client9-10 balance change increase because his wallet is in reward
        // because they exclude from reward

        expect(client9EmpireBalanceAfter).to.gt(initialClient9Balance);

        expect(client10EmpireBalanceAfter).to.gt(initialClient10Balance);

        // lets compare client 9 and client 10 balance
        // it MUST be same, because client9 and client10 have same initial balance
        // this check mean that reflection is correct distribution

        expect(client9EmpireBalanceAfter).to.eq(client10EmpireBalanceAfter);

        /**
         * lets try to calculate more accurate
         * so if client buy, client will get 90% EMPIRE
         * 8% for fee
         * 2% for reflect
         */

        // const unitA = amountBuyOut.div(90);
        // const unitB = contractEmpireBalanceAfter.div(8);
        // console.log(`Print Unit A and B`);
        // console.log(formatUnits(unitA, 9));
        // console.log(formatUnits(unitB, 9));
      });
    });
  });
});
