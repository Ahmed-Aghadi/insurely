const factoryAbi = require("./Factory.abi.json")
const insuranceAbi = require("./Insurance.abi.json")
const exchangeFactoryAbi = require("./ExchangeFactory.abi.json")
const exchangeAbi = require("./Exchange.abi.json")
const erc20Abi = require("./ERC20.abi.json")
const tokenAbi = require("./Token.abi.json")
const contractAddress = require("./contractAddress.json")
const factoryContractAddress = contractAddress.factory
const exchangeFactoryContractAddress = contractAddress.exchangeFactory
const tokenContractAddress = contractAddress.token
const currency = "FTM"
const chainId = 4002
module.exports = {
    factoryAbi,
    insuranceAbi,
    exchangeFactoryAbi,
    exchangeAbi,
    erc20Abi,
    tokenAbi,
    factoryContractAddress,
    exchangeFactoryContractAddress,
    tokenContractAddress,
    currency,
    chainId,
}
