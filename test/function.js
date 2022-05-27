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

    const Token = await ethers.getContractFactory("EmpireToken");
    token = await Token.deploy(
      uniswapV2RouterAddress,
      marketingWallet.address,
      teamWallet.address
    );
    await token.deployed();
  });

  //   describe("Public Write Methods", function () {
  //     describe("Approval Function", function () {
  //       it("Should emit Approval events", async function () {
  //         expect(
  //           token
  //             .connect(client1)
  //             .approve(bridgeAddr.address, EMPIRE_TOTAL_SUPPLY)
  //         )
  //           .to.emit(token.address, "Approval")
  //           .withArgs(client1.address, bridgeAddr.address, EMPIRE_TOTAL_SUPPLY);
  //       });
  //       it("Spender Can't be ZERO Address (0x)", async function () {
  //         expect(
  //           token.connect(client1).approve(zeroAddress, EMPIRE_TOTAL_SUPPLY)
  //         ).to.be.revertedWith("ERC20: approve to the zero address");
  //       });
  //     });
  //     describe("Increase Allowance Function", function () {
  //       const INCREASE_VALUE = parseUnits("10000", 9);
  //       it("Should emit Approval events", async function () {
  //         expect(
  //           token
  //             .connect(client1)
  //             .increaseAllowance(bridgeAddr.address, INCREASE_VALUE)
  //         )
  //           .to.emit(token.address, "Approval")
  //           .withArgs(client1.address, bridgeAddr.address, INCREASE_VALUE);
  //       });

  //       it("Spender Can't be ZERO Address (0x)", async function () {
  //         expect(
  //           token.connect(client1).approve(zeroAddress, INCREASE_VALUE)
  //         ).to.be.revertedWith("ERC20: approve to the zero address");
  //       });
  //     });

  //     describe("Decrease Allowance Function", function () {
  //       const INITIAL_ALLOWANCE = parseUnits("10000", 9);
  //       const VALID_DECREASE_VALUE = parseUnits("1000", 9);
  //       const INVALID_DECREASE_VALUE = parseUnits("100000", 9);

  //       beforeEach(async function () {
  //         token.connect(client1).approve(bridgeAddr.address, INITIAL_ALLOWANCE);
  //       });

  //       it("Should emit Approval events", async function () {
  //         expect(
  //           token
  //             .connect(client1)
  //             .decreaseAllowance(bridgeAddr.address, VALID_DECREASE_VALUE)
  //         )
  //           .to.emit(token.address, "Approval")
  //           .withArgs(
  //             client1.address,
  //             bridgeAddr.address,
  //             INITIAL_ALLOWANCE.sub(VALID_DECREASE_VALUE)
  //           );
  //       });

  //       it("Allowance MUST not below 0 (zero)", async function () {
  //         expect(
  //           token
  //             .connect(client1)
  //             .decreaseAllowance(zeroAddress, INVALID_DECREASE_VALUE)
  //         ).to.be.revertedWith("ERC20: decreased allowance below zero");
  //       });
  //     });

  //     describe("Deliver Function", function () {
  //       const DELIVER_AMOUNT = parseUnits("1000", 9);
  //       it("Should emit LogDeliver events", async function () {
  //         expect(token.connect(deployer).deliver(DELIVER_AMOUNT))
  //           .to.emit(token.address, "LogDeliver")
  //           .withArgs(deployer.address, DELIVER_AMOUNT);
  //       });

  //       it("Deliver function can't be call by excluded from reward address", async function () {
  //         await token.connect(deployer).excludeFromReward(client2.address);
  //         expect(
  //           token.connect(client2).deliver(DELIVER_AMOUNT)
  //         ).to.be.revertedWith("Excluded addresses cannot call this function");
  //       });
  //     });
  //   });

  describe("Only Owner Write Methods", function () {
    describe("excludeFromReward Function", function () {
      it("Only deployer can use this function", async function () {
        expect(
          token.connect(client1).excludeFromReward(newWallet.address)
        ).to.be.revertedWith("Ownable: caller is not the deployer");
        await expect(
          token.connect(deployer).excludeFromReward(newWallet.address)
        ).to.not.be.reverted;
      });

      it("Should emit LogExcludeFromReward event", async function () {
        expect(token.connect(deployer).excludeFromReward(newWallet.address))
          .to.emit(token.address, "LogExcludeFromReward")
          .withArgs(newWallet.address);
      });

      it("Should emit LogExcludeFromReward event", async function () {
        expect(token.connect(deployer).excludeFromReward(newWallet.address))
          .to.emit(token.address, "LogExcludeFromReward")
          .withArgs(newWallet.address);
      });
    });

    it("Approval Function (Approve, Increase Allowance, ", async function () {
      /**
       * Approve should emit Approval events
       */
      expect(
        token.connect(client1).approve(bridgeAddr.address, EMPIRE_TOTAL_SUPPLY)
      )
        .to.emit(token.address, "Approval")
        .withArgs(client1.address, bridgeAddr.address, EMPIRE_TOTAL_SUPPLY);

      /**
       * Spender can't be zero address
       */
      expect(
        token.connect(client1).approve(zeroAddress, EMPIRE_TOTAL_SUPPLY)
      ).to.be.revertedWith("ERC20: approve to the zero address");
    });

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
