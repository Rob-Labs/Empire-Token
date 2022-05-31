const { expect } = require("chai");
const { ethers } = require("hardhat");

const { deadAddress, zeroAddress } = require("./helpers/address");
const {
  utils,
  parseUnits,
  formatUnits,
  MaxUint256,
  EMPIRE_TOTAL_SUPPLY,
  AIRDROP_VALUE,
  INITIAL_BNB_LIQUIDITY,
  INITIAL_EMPIRE_LIQUIDITY,
  DEFAULT_EMPIRE_TRANSFER,
  SWAP_VALUE,
} = require("./helpers/utils");
const { uniswapV2PairAbi } = require("./helpers/abi");

describe("Empire Token Full Test", function () {
  let pancakeDeployer;
  let pancakeFeeReceiver;
  let empireDeployer;
  let empireTeam;
  let empireMarketing;
  let bridgeValidator;
  let bridgeFeeReceiver;
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
  let newWallet;
  let emptyAddr;
  let addrs;

  /**
   * pancakeswap utilities
   */
  let pancakeFactoryContract;
  let pancakeRouterContract;
  let pancakePairContract;
  let wbnbContract;

  /**
   * bridgeVault stand for EMPIRE BRIDGE VAULT
   * token is stand for EMPIRE Token
   */
  let bridgeVault;
  let token;

  /**
   * bridge stand for bridge contract
   */
  let bridge;

  let buyPath;
  let sellPath;

  /**
   * we want to test empire with PancakeSwap local chain
   * so we deploy PancakeSwap contract to local chain before running test
   *
   */
  beforeEach(async function () {
    // get signers
    [
      pancakeDeployer,
      pancakeFeeReceiver,
      empireDeployer,
      empireTeam,
      empireMarketing,
      bridgeValidator,
      bridgeFeeReceiver,
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
      newWallet,
      emptyAddr,
      ...addrs
    ] = await ethers.getSigners();

    // deploy pancake factory first
    const PancakeFactory = await ethers.getContractFactory("PancakeFactory");
    pancakeFactoryContract = await PancakeFactory.deploy(
      pancakeFeeReceiver.address
    );
    await pancakeFactoryContract.deployed();

    // deploy WBNB factory first
    const WBNBContract = await ethers.getContractFactory("WBNB");
    wbnbContract = await WBNBContract.deploy();
    await wbnbContract.deployed();

    // deploy Pancake Router first
    const RouterContract = await ethers.getContractFactory("PancakeRouter");
    pancakeRouterContract = await RouterContract.deploy(
      pancakeFactoryContract.address,
      wbnbContract.address
    );
    await wbnbContract.deployed();

    // deploy bridgeVault and EMPIRE
    const EmpireBridgeVault = await ethers.getContractFactory(
      "EmpireBridgeVault",
      empireDeployer
    );
    bridgeVault = await EmpireBridgeVault.deploy();
    await bridgeVault.deployed();

    const Token = await ethers.getContractFactory(
      "EmpireToken",
      empireDeployer
    );
    token = await Token.deploy(
      pancakeRouterContract.address,
      empireMarketing.address,
      empireTeam.address,
      bridgeVault.address
    );
    await token.deployed();

    /**
     * bridge deployed by empire deployer
     */
    const BridgeContract = await ethers.getContractFactory(
      "Bridge",
      empireDeployer
    );

    // deploy bridge
    bridge = await BridgeContract.deploy(
      bridgeValidator.address,
      bridgeFeeReceiver.address
    );
    await bridge.deployed();

    pairAddress = await pancakeFactoryContract.getPair(
      wbnbContract.address,
      token.address
    );

    pairContract = new ethers.Contract(
      pairAddress,
      uniswapV2PairAbi,
      ethers.provider
    );

    buyPath = [wbnbContract.address, token.address];
    sellPath = [token.address, wbnbContract.address];
  });

  /**
   * Deployment Phase Test
   *
   */
  describe("EMPIRE Token Deployment Phase", function () {
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
      expect(await token.totalSupply()).to.equal(EMPIRE_TOTAL_SUPPLY);
    });

    it("Correct Marketing address wallet", async function () {
      expect(await token.marketingWallet()).to.equal(empireMarketing.address);
    });

    it("Correct Team address wallet", async function () {
      expect(await token.teamWallet()).to.equal(empireTeam.address);
    });

    it("Correct Liquidity address wallet set to Deployer Address", async function () {
      expect(await token.liquidityWallet()).to.equal(empireDeployer.address);
    });

    it("Correct Dead (burn) address wallet", async function () {
      expect(await token.burnWallet()).to.equal(deadAddress);
    });

    it("Trading is disabled by default", async function () {
      expect(await token.isTradingEnabled()).to.equal(false);
    });

    it("All Empire Token supply send to deployer address", async function () {
      expect(await token.balanceOf(empireDeployer.address)).to.equal(
        EMPIRE_TOTAL_SUPPLY
      );
    });
  });

  /**
   * Empire function test
   */
  describe("EMPIRE Token Function Test", function () {
    describe("Public Write Methods", function () {
      describe("Approval Function", function () {
        it("Should emit Approval events", async function () {
          expect(
            token.connect(client1).approve(bridge.address, EMPIRE_TOTAL_SUPPLY)
          )
            .to.emit(token.address, "Approval")
            .withArgs(client1.address, bridge.address, EMPIRE_TOTAL_SUPPLY);
        });
        it("Spender Can't be ZERO Address (0x)", async function () {
          expect(
            token.connect(client1).approve(zeroAddress, EMPIRE_TOTAL_SUPPLY)
          ).to.be.revertedWith("ERC20: approve to the zero address");
        });
      });
      describe("Increase Allowance Function", function () {
        const INCREASE_VALUE = parseUnits("10000", 9);
        it("Should emit Approval events", async function () {
          expect(
            token
              .connect(client1)
              .increaseAllowance(bridge.address, INCREASE_VALUE)
          )
            .to.emit(token.address, "Approval")
            .withArgs(client1.address, bridge.address, INCREASE_VALUE);
        });

        it("Spender Can't be ZERO Address (0x)", async function () {
          expect(
            token.connect(client1).approve(zeroAddress, INCREASE_VALUE)
          ).to.be.revertedWith("ERC20: approve to the zero address");
        });
      });

      describe("Decrease Allowance Function", function () {
        const INITIAL_ALLOWANCE = parseUnits("10000", 9);
        const VALID_DECREASE_VALUE = parseUnits("1000", 9);
        const INVALID_DECREASE_VALUE = parseUnits("100000", 9);

        beforeEach(async function () {
          token.connect(client1).approve(bridge.address, INITIAL_ALLOWANCE);
        });

        it("Should emit Approval events", async function () {
          expect(
            token
              .connect(client1)
              .decreaseAllowance(bridge.address, VALID_DECREASE_VALUE)
          )
            .to.emit(token.address, "Approval")
            .withArgs(
              client1.address,
              bridge.address,
              INITIAL_ALLOWANCE.sub(VALID_DECREASE_VALUE)
            );
        });

        it("Allowance MUST not below 0 (zero)", async function () {
          expect(
            token
              .connect(client1)
              .decreaseAllowance(zeroAddress, INVALID_DECREASE_VALUE)
          ).to.be.revertedWith("ERC20: decreased allowance below zero");
        });
      });

      describe("Deliver Function", function () {
        const DELIVER_AMOUNT = parseUnits("1000", 9);
        it("Should emit LogDeliver events", async function () {
          expect(token.connect(empireDeployer).deliver(DELIVER_AMOUNT))
            .to.emit(token.address, "LogDeliver")
            .withArgs(empireDeployer.address, DELIVER_AMOUNT);
        });

        it("Deliver function can't be call by excluded from reward address", async function () {
          await token
            .connect(empireDeployer)
            .excludeFromReward(client2.address);
          expect(
            token.connect(client2).deliver(DELIVER_AMOUNT)
          ).to.be.revertedWith("Excluded addresses cannot call this function");
        });
      });
    });

    describe("Only Owner Write Methods", function () {
      describe("excludeFromReward Function", function () {
        it("Only deployer can use this function", async function () {
          expect(
            token.connect(client1).excludeFromReward(newWallet.address)
          ).to.be.revertedWith("Ownable: caller is not the deployer");
        });

        it("Should emit LogExcludeFromReward event", async function () {
          expect(
            token.connect(empireDeployer).excludeFromReward(newWallet.address)
          )
            .to.emit(token.address, "LogExcludeFromReward")
            .withArgs(newWallet.address);
        });

        it("Function should correct change state", async function () {
          await token
            .connect(empireDeployer)
            .excludeFromReward(client10.address);

          expect(
            await token
              .connect(empireDeployer)
              .isExcludedFromReward(client10.address)
          ).to.be.equal(true);
        });
      });

      describe("includeInReward Function", function () {
        it("Only deployer can use this function", async function () {
          expect(
            token.connect(client1).includeInReward(newWallet.address)
          ).to.be.revertedWith("Ownable: caller is not the deployer");
        });

        it("Should Reverted if already include in reward", async function () {
          expect(
            token.connect(empireDeployer).includeInReward(newWallet.address)
          ).to.be.revertedWith("Account is already excluded");
        });

        it("Should emit LogIncludeInReward event", async function () {
          // first need exclude wallet,
          await token
            .connect(empireDeployer)
            .excludeFromReward(newWallet.address);
          expect(
            token.connect(empireDeployer).includeInReward(newWallet.address)
          )
            .to.emit(token.address, "LogIncludeInReward")
            .withArgs(newWallet.address);
        });

        it("Function should correct change state", async function () {
          await token
            .connect(empireDeployer)
            .excludeFromReward(client9.address);
          await token.connect(empireDeployer).includeInReward(client9.address);
          expect(
            await token
              .connect(empireDeployer)
              .isExcludedFromReward(client9.address)
          ).to.be.equal(false);
        });
      });

      describe("setAutomatedMarketMakerPair Function", function () {
        it("Only deployer can use this function", async function () {
          expect(
            token
              .connect(client1)
              .setAutomatedMarketMakerPair(newWallet.address, true)
          ).to.be.revertedWith("Ownable: caller is not the deployer");
        });

        it("Should emit LogSetAutomatedMarketMakerPair event", async function () {
          expect(
            token
              .connect(empireDeployer)
              .setAutomatedMarketMakerPair(newWallet.address, true)
          )
            .to.emit(token.address, "LogSetAutomatedMarketMakerPair")
            .withArgs(newWallet.address, true);
        });

        it("Function should correct change state", async function () {
          await token
            .connect(empireDeployer)
            .setAutomatedMarketMakerPair(newWallet.address, false);

          expect(
            await token.automatedMarketMakerPairs(newWallet.address)
          ).to.be.equal(false);

          await token
            .connect(empireDeployer)
            .setAutomatedMarketMakerPair(newWallet.address, true);
          expect(
            await token.automatedMarketMakerPairs(newWallet.address)
          ).to.be.equal(true);
        });
      });

      describe("setBridge Function", function () {
        it("Only deployer can use this function", async function () {
          expect(
            token.connect(client1).setBridge(newWallet.address)
          ).to.be.revertedWith("Ownable: caller is not the deployer");
        });

        it("Should Reverted if bridge address is same with current bridge address", async function () {
          await token.connect(empireDeployer).setBridge(newWallet.address);
          expect(
            token.connect(empireDeployer).setBridge(newWallet.address)
          ).to.be.revertedWith("Same Bridge!");
        });

        it("Should emit LogSetBridge event", async function () {
          expect(token.connect(empireDeployer).setBridge(newWallet.address))
            .to.emit(token.address, "LogSetBridge")
            .withArgs(empireDeployer.address, newWallet.address);
        });
      });

      describe("setBurnWallet Function", function () {
        it("Only deployer can use this function", async function () {
          expect(
            token.connect(client1).setBurnWallet(newWallet.address)
          ).to.be.revertedWith("Ownable: caller is not the deployer");
        });

        it("Should emit LogSetBridge event", async function () {
          expect(token.connect(empireDeployer).setBurnWallet(newWallet.address))
            .to.emit(token.address, "LogSetBridge")
            .withArgs(newWallet.address);
        });
      });

      describe("setBuyFees Function", function () {
        it("Only deployer can use this function", async function () {
          expect(
            token.connect(client1).setBuyFees(1, 1, 1, 1, 1)
          ).to.be.revertedWith("Ownable: caller is not the deployer");
        });

        it("Should emit LogSetBuyFees event", async function () {
          expect(
            token.connect(empireDeployer).setBuyFees(2, 2, 2, 2, 2)
          ).to.emit(token.address, "LogSetBuyFees");
        });
      });

      describe("setSellFees Function", function () {
        it("Only deployer can use this function", async function () {
          expect(
            token.connect(client1).setSellFees(1, 1, 1, 1, 1)
          ).to.be.revertedWith("Ownable: caller is not the deployer");
        });

        it("Should emit LogSetSellFees event", async function () {
          expect(
            token.connect(empireDeployer).setSellFees(2, 2, 2, 2, 2)
          ).to.emit(token.address, "LogSetSellFees");
        });
      });

      describe("setEnableTrading Function", function () {
        it("Only deployer can use this function", async function () {
          expect(
            token.connect(client1).setEnableTrading(true)
          ).to.be.revertedWith("Ownable: caller is not the deployer");
        });

        it("Should emit LogSetEnableTrading event", async function () {
          expect(token.connect(empireDeployer).setEnableTrading(true))
            .to.emit(token.address, "LogSetEnableTrading")
            .withArgs(true);
        });
      });

      describe("setExcludeFromFee Function", function () {
        it("Only deployer can use this function", async function () {
          expect(
            token.connect(client1).setExcludeFromFee(newWallet.address, true)
          ).to.be.revertedWith("Ownable: caller is not the deployer");
        });

        it("Should emit LogSetExcludeFromFee event", async function () {
          expect(
            token
              .connect(empireDeployer)
              .setExcludeFromFee(newWallet.address, true)
          )
            .to.emit(token.address, "LogSetExcludeFromFee")
            .withArgs(empireDeployer.address, newWallet.address, true);
        });
      });

      describe("setMarketingWallet Function", function () {
        it("Only deployer can use this function", async function () {
          expect(
            token.connect(client1).setMarketingWallet(newWallet.address)
          ).to.be.revertedWith("Ownable: caller is not the deployer");
        });

        it("Should emit LogSetMarketingWallet event", async function () {
          expect(
            token.connect(empireDeployer).setMarketingWallet(newWallet.address)
          )
            .to.emit(token.address, "LogSetMarketingWallet")
            .withArgs(empireDeployer.address, newWallet.address);
        });
      });

      describe("setTeamWallet Function", function () {
        it("Only deployer can use this function", async function () {
          expect(
            token.connect(client1).setTeamWallet(newWallet.address)
          ).to.be.revertedWith("Ownable: caller is not the deployer");
        });

        it("Should emit LogSetTeamWallet event", async function () {
          expect(token.connect(empireDeployer).setTeamWallet(newWallet.address))
            .to.emit(token.address, "LogSetTeamWallet")
            .withArgs(empireDeployer.address, newWallet.address);
        });
      });

      describe("setRouterAddress Function", function () {
        it("Only deployer can use this function", async function () {
          expect(
            token.connect(client1).setRouterAddress(newWallet.address)
          ).to.be.revertedWith("Ownable: caller is not the deployer");
        });

        it("Should emit LogSetRouterAddress event", async function () {
          expect(
            token.connect(empireDeployer).setRouterAddress(newWallet.address)
          )
            .to.emit(token.address, "LogSetRouterAddress")
            .withArgs(empireDeployer.address, newWallet.address);
        });
      });

      describe("setSwapAndLiquifyEnabled Function", function () {
        it("Only deployer can use this function", async function () {
          expect(
            token.connect(client1).setSwapAndLiquifyEnabled(true)
          ).to.be.revertedWith("Ownable: caller is not the deployer");
        });

        it("Should emit LogSwapAndLiquifyEnabledUpdated event", async function () {
          expect(token.connect(empireDeployer).setSwapAndLiquifyEnabled(true))
            .to.emit(token.address, "LogSwapAndLiquifyEnabledUpdated")
            .withArgs(empireDeployer.address, true);
        });
      });

      describe("setSwapTokensAmount Function", function () {
        const TOKEN_AMOUNT = parseUnits("10000", 9);
        it("Only deployer can use this function", async function () {
          expect(
            token.connect(client1).setSwapTokensAmount(TOKEN_AMOUNT)
          ).to.be.revertedWith("Ownable: caller is not the deployer");
        });

        it("Should emit LogSetSwapTokensAmount event", async function () {
          expect(
            token.connect(empireDeployer).setSwapTokensAmount(TOKEN_AMOUNT)
          )
            .to.emit(token.address, "LogSetSwapTokensAmount")
            .withArgs(empireDeployer.address, TOKEN_AMOUNT);
        });
      });
    });
  });

  /**
   * Empire transfer test
   */

  describe("EMPIRE Token Transfer Test", function () {
    describe("Transfer at Presale Time", function () {
      it("Transfer when Presale Time require sender and receiver is excluded from fee", async function () {
        expect(
          token.connect(empireDeployer).transfer(client5.address, 50)
        ).to.be.revertedWith("Trading is disabled");

        await token
          .connect(empireDeployer)
          .setExcludeFromFee(client1.address, true);

        expect(token.connect(empireDeployer).transfer(client1.address, 50)).to
          .not.be.reverted;
      });
    });

    describe("Transfer after Presale Time", function () {
      before(async function () {
        // set trading enabled
        await token.connect(empireDeployer).setEnableTrading(true);
      });

      describe("Transfers tokens between accounts", function () {
        beforeEach(async function () {
          // send airdrop to client1 and client2
          await token
            .connect(empireDeployer)
            .transfer(client1.address, AIRDROP_VALUE);
          await token
            .connect(empireDeployer)
            .transfer(client2.address, AIRDROP_VALUE);
        });

        it("Transfer fails when sender doesn't have enough tokens", async function () {
          const initialDeployerBalance = await token.balanceOf(
            empireDeployer.address
          );

          // Try to send 1 token from emptyAddr (0 tokens) to deployer (1000000000 tokens).
          // `require` will evaluate false and revert the transaction.
          expect(
            token.connect(emptyAddr).transfer(empireDeployer.address, 1)
          ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

          // deployer balance shouldn't have changed.
          expect(await token.balanceOf(empireDeployer.address)).to.equal(
            initialDeployerBalance
          );
        });

        it("Correct updates balances after transfers", async function () {
          const initialDeployerBalance = await token.balanceOf(
            empireDeployer.address
          );
          const initialClient1Balance = await token.balanceOf(client1.address);
          const initialClient2Balance = await token.balanceOf(client2.address);

          // Transfer 500 tokens from deployer to client1.
          await token
            .connect(empireDeployer)
            .transfer(client1.address, DEFAULT_EMPIRE_TRANSFER);

          // Transfer another 500 tokens from deployer to client2.
          await token
            .connect(empireDeployer)
            .transfer(client2.address, DEFAULT_EMPIRE_TRANSFER);

          // Check balances.
          const finalDeployerBalance = await token.balanceOf(
            empireDeployer.address
          );
          expect(finalDeployerBalance).to.equal(
            initialDeployerBalance
              .sub(DEFAULT_EMPIRE_TRANSFER)
              .sub(DEFAULT_EMPIRE_TRANSFER)
          );

          const client1Balance = await token.balanceOf(client1.address);
          expect(client1Balance).to.equal(
            initialClient1Balance.add(DEFAULT_EMPIRE_TRANSFER)
          );

          const client2Balance = await token.balanceOf(client2.address);
          expect(client2Balance).to.equal(
            initialClient2Balance.add(DEFAULT_EMPIRE_TRANSFER)
          );
        });
      });
    });

    describe("Liquidity Test", function () {
      before(async function () {
        // nothing
      });

      it("Should be able to add liquidity", async function () {
        // deployer initial balance after send airdrop
        const deployerInitialBalance = await token.balanceOf(
          empireDeployer.address
        );

        // approve first
        await token
          .connect(empireDeployer)
          .approve(pancakeRouterContract.address, deployerInitialBalance);

        // add liquidity when success
        // its always emit Mint and Sync on pair address
        expect(
          await pancakeRouterContract
            .connect(empireDeployer)
            .addLiquidityETH(
              token.address,
              INITIAL_EMPIRE_LIQUIDITY,
              INITIAL_EMPIRE_LIQUIDITY,
              INITIAL_BNB_LIQUIDITY,
              empireDeployer.address,
              Math.floor(Date.now() / 1000) + 60 * 10,
              { value: INITIAL_BNB_LIQUIDITY }
            )
        )
          .to.emit(token, "Transfer")
          .withArgs(
            empireDeployer,
            pairContract.address,
            INITIAL_EMPIRE_LIQUIDITY
          )
          .to.emit(wbnbContract, "Deposit")
          .withArgs(pancakeRouterContract.address, INITIAL_BNB_LIQUIDITY)
          .to.emit(wbnbContract, "Transfer")
          .withArgs(
            pancakeRouterContract.address,
            pairContract.address,
            INITIAL_BNB_LIQUIDITY
          )
          .to.emit(pairContract, "Sync")
          .withArgs(INITIAL_EMPIRE_LIQUIDITY, INITIAL_BNB_LIQUIDITY)
          .to.emit(pairContract, "Mint")
          .withArgs(INITIAL_EMPIRE_LIQUIDITY, INITIAL_BNB_LIQUIDITY);

        const pairEmpireBalance = await token.balanceOf(pairContract.address);
        const deployerAfterBalance = await token.balanceOf(
          empireDeployer.address
        );

        // deployer balance should be change
        expect(deployerAfterBalance).to.be.equal(
          deployerInitialBalance.sub(INITIAL_EMPIRE_LIQUIDITY)
        );

        // pair address balance should be same as liquidity
        expect(pairEmpireBalance).to.be.equal(INITIAL_EMPIRE_LIQUIDITY);
      });

      it("Should be able to remove liquidity", async function () {
        /**
         * remove liquidity
         * use removeLiquidityETHSupportingFeeOnTransferTokens
         *
         */
        const liquidityBalance = await pairContract.balanceOf(
          empireDeployer.address
        );
        await pairContract
          .connect(empireDeployer)
          .approve(pancakeRouterContract.address, liquidityBalance);
        await pancakeRouterContract
          .connect(empireDeployer)
          .removeLiquidityETHSupportingFeeOnTransferTokens(
            token.address,
            liquidityBalance,
            0,
            0,
            empireDeployer.address,
            MaxUint256
          );
        const liquidityBalanceAfter = await pairContract.balanceOf(
          empireDeployer.address
        );
        expect(liquidityBalanceAfter).to.be.equal(0);
      });
    });
    describe("Trading (Buy /Sell) Test", function () {
      before(async function () {
        // make airdrop for client7-10 so we can track balance at test
        await token
          .connect(empireDeployer)
          .transfer(client7.address, AIRDROP_VALUE);
        await token
          .connect(empireDeployer)
          .transfer(client8.address, AIRDROP_VALUE);
        await token
          .connect(empireDeployer)
          .transfer(client9.address, AIRDROP_VALUE);
        await token
          .connect(empireDeployer)
          .transfer(client10.address, AIRDROP_VALUE);

        // set client 7 and 8 to exlucded from reward
        await token.connect(empireDeployer).excludeFromReward(client7.address);
        await token.connect(empireDeployer).excludeFromReward(client8.address);

        // set client 8 to exclude from fee
        await token
          .connect(empireDeployer)
          .setExcludeFromFee(client8.address, true);

        // add liquidity first
        await token
          .connect(empireDeployer)
          .approve(pancakeRouterContract.address, MaxUint256);

        // add 500M EMPIRE : 500 BNB
        await pancakeRouterContract
          .connect(empireDeployer)
          .addLiquidityETH(
            token.address,
            INITIAL_EMPIRE_LIQUIDITY,
            INITIAL_EMPIRE_LIQUIDITY,
            INITIAL_BNB_LIQUIDITY,
            empireDeployer.address,
            Math.floor(Date.now() / 1000) + 60 * 10,
            { value: INITIAL_BNB_LIQUIDITY }
          );
      });

      it("User should be able to buy and sell EMPIRE on AMM", async function () {
        let client1EmpireBalance = await token.balanceOf(client1.address);
        //try to buy 1BNB
        const buyValue = ethers.utils.parseUnits("1", 18);

        expect(
          await pancakeRouterContract
            .connect(client1)
            .swapExactETHForTokens(0, buyPath, client1.address, MaxUint256, {
              value: buyValue,
            })
        )
          .to.emit(wbnbContract, "Deposit")
          .withArgs(pancakeRouterContract.address, buyValue)
          .to.emit(wbnbContract, "Transfer")
          .withArgs(
            pancakeRouterContract.address,
            pairContract.address,
            buyValue
          )
          .to.emit(token, "Transfer")
          .to.emit(pairContract, "Sync")
          .to.emit(pairContract, "Swap");

        let client1EmpireBalanceAfter = await token.balanceOf(client1.address);

        // client1 balance change
        expect(client1EmpireBalanceAfter).to.gt(client1EmpireBalance);

        // sell test
        await token
          .connect(client1)
          .approve(pancakeRouterContract.address, client1EmpireBalanceAfter);

        expect(
          await pancakeRouterContract
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
        await pancakeRouterContract
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
          .approve(pancakeRouterContract.address, client1EmpireBalanceAfter);

        expect(
          await pancakeRouterContract
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
        await pancakeRouterContract
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
          .approve(pancakeRouterContract.address, client8EmpireBalanceAfter);

        expect(
          await pancakeRouterContract
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
        await pancakeRouterContract
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
