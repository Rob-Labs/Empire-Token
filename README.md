# NEW Empire Token

## BSC Testnet Deployment

Bridge Vault deployed to: https://testnet.bscscan.com/address/0xb5f85FeECeB0db58E9322246186027E7E7c23dEd#code

EmpireToken deployed to: https://testnet.bscscan.com/address/0x62f35EFC09EFAEa46172Dc4A52def6184f0ED22d#code

Bridge deployed to: https://testnet.bscscan.com/address/0x784585F7847F3AAe9d5fb8a85f0b8C9786b60D51#code

## Test Result

### EMPIRE TOKEN TEST RESULT

Empire Token Deployment Test

    ✔ Has a correct name 'EmpireToken'
    ✔ Has a correct symbol 'EMPIRE'
    ✔ Has 9 decimals
    ✔ Has 1 billion tokens with 9 decimal units (10^18)
    ✔ Correct Marketing address wallet
    ✔ Correct Team address wallet
    ✔ Correct Liquidity address wallet set to Deployer Address
    ✔ Correct Dead (burn) address wallet
    ✔ Trading is disabled by default
    ✔ All Empire Token supply send to deployer address

Empire Token Write Function Test

    Public Write Methods
      Approval Function
        ✔ Should emit Approval events
        ✔ Spender Can't be ZERO Address (0x)
      Increase Allowance Function
        ✔ Should emit Approval events
        ✔ Spender Can't be ZERO Address (0x)
      Decrease Allowance Function
        ✔ Should emit Approval events
        ✔ Allowance MUST not below 0 (zero)
      Deliver Function
        ✔ Should emit LogDeliver events
        ✔ Deliver function can't be call by excluded from reward address (63ms)

    Only Owner Write Methods
      excludeFromReward Function
        ✔ Only deployer can use this function
        ✔ Should emit LogExcludeFromReward event
        ✔ Function should correct change state (1004ms)
      includeInReward Function
        ✔ Only deployer can use this function
        ✔ Should Reverted if already include in reward
        ✔ Should emit LogIncludeInReward event (354ms)
        ✔ Function should correct change state (51ms)
      setAutomatedMarketMakerPair Function
        ✔ Only deployer can use this function
        ✔ Should emit LogSetAutomatedMarketMakerPair event
        ✔ Function should correct change state
      setBridge Function
        ✔ Only deployer can use this function
        ✔ Should Reverted if bridge address is same with current bridge address (1298ms)
        ✔ Should emit LogSetBridge event
      setBurnWallet Function
        ✔ Only deployer can use this function
        ✔ Should emit LogSetBridge event
      setBuyFees Function
        ✔ Only deployer can use this function
        ✔ Should emit LogSetBuyFees event
      setSellFees Function
        ✔ Only deployer can use this function
        ✔ Should emit LogSetSellFees event
      setEnableTrading Function
        ✔ Only deployer can use this function
        ✔ Should emit LogSetEnableTrading event
      setExcludeFromFee Function
        ✔ Only deployer can use this function
        ✔ Should emit LogSetExcludeFromFee event
      setMarketingWallet Function
        ✔ Only deployer can use this function
        ✔ Should emit LogSetMarketingWallet event
      setTeamWallet Function
        ✔ Only deployer can use this function
        ✔ Should emit LogSetTeamWallet event
      setRouterAddress Function
        ✔ Only deployer can use this function
        ✔ Should emit LogSetRouterAddress event
      setSwapAndLiquifyEnabled Function
        ✔ Only deployer can use this function
        ✔ Should emit LogSwapAndLiquifyEnabledUpdated event
      setSwapTokensAmount Function
        ✔ Only deployer can use this function
        ✔ Should emit LogSetSwapTokensAmount event

Empire Token Interaction with bridge

    Check Lock and Unlock from Bridge
      ✔ Correct balance change after lock (112ms)
      ✔ Correct balance change after unlock (44ms)

Empire Token Transfer Test

    Transfer at Presale Time
      ✔ Transfer when Presale Time require sender and receiver is excluded from fee (1295ms)

    Transfer after Presale Time
      Transfers tokens between accounts
        ✔ Transfer fails when sender doesn't have enough tokens
        ✔ Correct updates balances after transfers (44ms)

    Liquidity, Trade and Reflection Test
      Liquidity Test
        ✔ Should be able to add liquidity (2032ms)
        ✔ Should be able to remove liquidity (3087ms)
      Trading (Buy /Sell) Test
        ✔ User should be able to buy and sell EMPIRE on AMM (5293ms)
        ✔ Should be take fee when buy/sell EMPIRE from Include in Fee address (6544ms)
        ✔ Should not be take fee when buy/sell EMPIRE from Exclude in Fee address (3334ms)
        ✔ Should be take correct fee when buy Empire and Reflect Fee to Holder (992ms)

62 passing (12m)

### BRIDGE CONTRACT TEST RESULT

Bridge Contract Test Case

    Set Fee Function
      ✔ Only Owner can call this function
      ✔ Should emit LogSetFee event
      ✔ Function should correct change state
    Set Maximal Amount Function
      ✔ Only Owner can call this function
      ✔ New Maximal Amount should be greater than or equal with Minimal Amount
      ✔ Should emit LogSetMaxAmount event
      ✔ Function should correct change state
    Set Miniminal Amount Function
      ✔ Only Owner can call this function
      ✔ New Miniminal Amount should be lower than or equal with Maximal Amount
      ✔ Should emit LogSetMinAmount event
      ✔ Function should correct change state
    Set New Validator Address Function
      ✔ Only Owner can call this function
      ✔ Should emit LogSetValidator event
      ✔ Function should correct change state
    Set New Treasury Address Function
      ✔ Only Owner can call this function
      ✔ Should emit LogSetTreasury event
      ✔ Function should correct change state
    Set Token Pair List Function
      ✔ Only Owner can call this function
      ✔ Should emit LogUpdateBridgeTokenPairList event
      ✔ Function should correct change state

Interact with EMPIRE Token

    SWAP Function
      ✔ Swap will fail if its on paused state
      ✔ Swap will fail if amount below Minimum amount set by bridge
      ✔ Swap will fail if amount greater than Maximum amount set by bridge
      ✔ Swap will fail if token not supported by bridge
      ✔ Swap will fail if fee not fulfilled
      ✔ Swap should need approval from token holder
      ✔ Swap should emit LogSwap event
      ✔ Swap should transfer fee to treasury address (44ms)
      ✔ Swap should emit LogLockByBridge on EMPIRE Contract
      ✔ Swap should transfer token from holder to BRIDGE VAULT (47ms)
    Redeem Function
      ✔ Only Validator can use this function
      ✔ Redeem amount should be greater or equal than minimum amount bridge set
      ✔ Redeem amount should be lower or equal than maximum amount bridge set
      ✔ Redeem will fail if redeemed twice or more
      ✔ Redeem should emit LogRedeem
      ✔ Redeem should emit LogUnlockByBridge on EMPIRE Contract
      ✔ Redeem should transfer balance from BRIDGE VAULT to holder address

37 passing (6m)
