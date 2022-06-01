# How To Running Local Test EMPIRE Token

1. Clone Repo and Install dependencies

   First clone this repository to local computer

   ```sh
   git clone https://github.com/Rob-Labs/Empire-Token.git
   ```

   Install dependency

   ```sh
   # if using NPM
   npm i

   #if yusing yarn
   yarn
   ```

2. Make sure we set **INIT_CODE_PAIR_HASH** on PancakeLibrary first

   ```sh
   # run this command to get INIT_CODE_PAIR_HASH
   npx hardhat test test/001_pancake.js
   ```

   you will see result like this

   ```
   Pancake Factory Deploy
   Please Change init pair hash on `PancakeLibrary.sol` at line 38 to 0xcddf3c2fd2627b5bd4be13837d39b94819fe2ee301c7cf30c59531cc4278339c without `0x` before run complete test
       ✔ Get INIT_CODE_PAIR_HASH (67ms)
   ```

   check **PancakeLibrary.sol** file at `contracts/uniswap/libraries/PancakeLibrary.sol`, then change ` hex"cddf3c2fd2627b5bd4be13837d39b94819fe2ee301c7cf30c59531cc4278339c" // init code hash` with result from test, without `0x`

3. Running test

   ```sh
   # Command to run all test
   npx hardhat test
   ```

4. Test Result

   You will find there's 1 (one) test fail `Swap should need approval from token holder` because now to lock empire we doesn't need approval from holder
