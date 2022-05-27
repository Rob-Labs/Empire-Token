const { expect } = require("chai");
const { ethers } = require("hardhat");

const { zeroAddress, uniswapV2RouterAddress } = require("./helpers/address");
const {
  EMPIRE_TOTAL_SUPPLY,
  MaxUint256,
  parseUnits,
} = require("./helpers/utils");

describe("Empire Token Write Function Test", function () {
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

  describe("Public Write Methods", function () {
    describe("Approval Function", function () {
      it("Should emit Approval events", async function () {
        expect(
          token
            .connect(client1)
            .approve(bridgeAddr.address, EMPIRE_TOTAL_SUPPLY)
        )
          .to.emit(token.address, "Approval")
          .withArgs(client1.address, bridgeAddr.address, EMPIRE_TOTAL_SUPPLY);
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
            .increaseAllowance(bridgeAddr.address, INCREASE_VALUE)
        )
          .to.emit(token.address, "Approval")
          .withArgs(client1.address, bridgeAddr.address, INCREASE_VALUE);
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
        token.connect(client1).approve(bridgeAddr.address, INITIAL_ALLOWANCE);
      });

      it("Should emit Approval events", async function () {
        expect(
          token
            .connect(client1)
            .decreaseAllowance(bridgeAddr.address, VALID_DECREASE_VALUE)
        )
          .to.emit(token.address, "Approval")
          .withArgs(
            client1.address,
            bridgeAddr.address,
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
        expect(token.connect(deployer).deliver(DELIVER_AMOUNT))
          .to.emit(token.address, "LogDeliver")
          .withArgs(deployer.address, DELIVER_AMOUNT);
      });

      it("Deliver function can't be call by excluded from reward address", async function () {
        await token.connect(deployer).excludeFromReward(client2.address);
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
        expect(token.connect(deployer).excludeFromReward(newWallet.address))
          .to.emit(token.address, "LogExcludeFromReward")
          .withArgs(newWallet.address);
      });

      it("Function should correct change state", async function () {
        await token.connect(deployer).excludeFromReward(client2.address);

        expect(
          await token.connect(deployer).isExcludedFromReward(client2.address)
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
          token.connect(deployer).includeInReward(newWallet.address)
        ).to.be.revertedWith("Account is already excluded");
      });

      it("Should emit LogIncludeInReward event", async function () {
        // first need exclude wallet,
        await token.connect(deployer).excludeFromReward(newWallet.address);
        expect(token.connect(deployer).includeInReward(newWallet.address))
          .to.emit(token.address, "LogIncludeInReward")
          .withArgs(newWallet.address);
      });

      it("Function should correct change state", async function () {
        await token.connect(deployer).excludeFromReward(client2.address);
        await token.connect(deployer).includeInReward(client2.address);
        expect(
          await token.connect(deployer).isExcludedFromReward(client2.address)
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
            .connect(deployer)
            .setAutomatedMarketMakerPair(newWallet.address, true)
        )
          .to.emit(token.address, "LogSetAutomatedMarketMakerPair")
          .withArgs(newWallet.address, true);
      });

      it("Function should correct change state", async function () {
        await token
          .connect(deployer)
          .setAutomatedMarketMakerPair(newWallet.address, true);
        await token
          .connect(deployer)
          .setAutomatedMarketMakerPair(client10.address, false);
        expect(token.automatedMarketMakerPairs(newWallet.address)).to.be.equal(
          true
        );
        expect(token.automatedMarketMakerPairs(client10.address)).to.be.equal(
          false
        );
      });
    });

    describe("setBridge Function", function () {
      it("Only deployer can use this function", async function () {
        expect(
          token.connect(client1).setBridge(newWallet.address)
        ).to.be.revertedWith("Ownable: caller is not the deployer");
      });

      it("Should Reverted if bridge address is same with current bridge address", async function () {
        await token.connect(deployer).setBridge(newWallet.address);
        expect(
          token.connect(deployer).setBridge(newWallet.address)
        ).to.be.revertedWith("Same Bridge!");
      });

      it("Should emit LogSetBridge event", async function () {
        expect(token.connect(deployer).setBridge(newWallet.address))
          .to.emit(token.address, "LogSetBridge")
          .withArgs(deployer.address, newWallet.address);
      });
    });

    describe("setBurnWallet Function", function () {
      it("Only deployer can use this function", async function () {
        expect(
          token.connect(client1).setBurnWallet(newWallet.address)
        ).to.be.revertedWith("Ownable: caller is not the deployer");
      });

      it("Should emit LogSetBridge event", async function () {
        expect(token.connect(deployer).setBurnWallet(newWallet.address))
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
        expect(token.connect(deployer).setBuyFees(2, 2, 2, 2, 2)).to.emit(
          token.address,
          "LogSetBuyFees"
        );
      });
    });

    describe("setSellFees Function", function () {
      it("Only deployer can use this function", async function () {
        expect(
          token.connect(client1).setSellFees(1, 1, 1, 1, 1)
        ).to.be.revertedWith("Ownable: caller is not the deployer");
      });

      it("Should emit LogSetSellFees event", async function () {
        expect(token.connect(deployer).setSellFees(2, 2, 2, 2, 2)).to.emit(
          token.address,
          "LogSetSellFees"
        );
      });
    });

    describe("setEnableTrading Function", function () {
      it("Only deployer can use this function", async function () {
        expect(
          token.connect(client1).setEnableTrading(true)
        ).to.be.revertedWith("Ownable: caller is not the deployer");
      });

      it("Should emit LogSetEnableTrading event", async function () {
        expect(token.connect(deployer).setEnableTrading(true))
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
          token.connect(deployer).setExcludeFromFee(newWallet.address, true)
        )
          .to.emit(token.address, "LogSetExcludeFromFee")
          .withArgs(deployer.address, newWallet.address, true);
      });
    });

    describe("setMarketingWallet Function", function () {
      it("Only deployer can use this function", async function () {
        expect(
          token.connect(client1).setMarketingWallet(newWallet.address)
        ).to.be.revertedWith("Ownable: caller is not the deployer");
      });

      it("Should emit LogSetMarketingWallet event", async function () {
        expect(token.connect(deployer).setMarketingWallet(newWallet.address))
          .to.emit(token.address, "LogSetMarketingWallet")
          .withArgs(deployer.address, newWallet.address);
      });
    });

    describe("setTeamWallet Function", function () {
      it("Only deployer can use this function", async function () {
        expect(
          token.connect(client1).setTeamWallet(newWallet.address)
        ).to.be.revertedWith("Ownable: caller is not the deployer");
      });

      it("Should emit LogSetTeamWallet event", async function () {
        expect(token.connect(deployer).setTeamWallet(newWallet.address))
          .to.emit(token.address, "LogSetTeamWallet")
          .withArgs(deployer.address, newWallet.address);
      });
    });

    describe("setRouterAddress Function", function () {
      it("Only deployer can use this function", async function () {
        expect(
          token.connect(client1).setRouterAddress(newWallet.address)
        ).to.be.revertedWith("Ownable: caller is not the deployer");
      });

      it("Should emit LogSetRouterAddress event", async function () {
        expect(token.connect(deployer).setRouterAddress(newWallet.address))
          .to.emit(token.address, "LogSetRouterAddress")
          .withArgs(deployer.address, newWallet.address);
      });
    });

    describe("setSwapAndLiquifyEnabled Function", function () {
      it("Only deployer can use this function", async function () {
        expect(
          token.connect(client1).setSwapAndLiquifyEnabled(true)
        ).to.be.revertedWith("Ownable: caller is not the deployer");
      });

      it("Should emit LogSwapAndLiquifyEnabledUpdated event", async function () {
        expect(token.connect(deployer).setSwapAndLiquifyEnabled(true))
          .to.emit(token.address, "LogSwapAndLiquifyEnabledUpdated")
          .withArgs(deployer.address, true);
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
        expect(token.connect(deployer).setSwapTokensAmount(TOKEN_AMOUNT))
          .to.emit(token.address, "LogSetSwapTokensAmount")
          .withArgs(deployer.address, TOKEN_AMOUNT);
      });
    });
  });
});
