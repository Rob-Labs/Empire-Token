const { ethers } = require("hardhat");

const utils = ethers.utils;
const parseUnits = utils.parseUnits;
const formatUnits = utils.formatUnits;
const MaxUint256 = ethers.constants.MaxUint256;

// 1 billion, with 9 decimal
// or we can write formatUnits("1", 18)
const EMPIRE_TOTAL_SUPPLY = parseUnits("1000000000", 9);

module.exports = {
  utils,
  parseUnits,
  formatUnits,
  MaxUint256,
  EMPIRE_TOTAL_SUPPLY,
};
