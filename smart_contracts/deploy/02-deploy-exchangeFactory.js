const { network } = require("hardhat")
const {
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    networkConfig,
} = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS

    // log("----------------------------------------------------")
    // const arguments = []
    // const exchangeFactory = await deploy("ExchangeFactory", {
    //     from: deployer,
    //     args: arguments,
    //     log: true,
    //     waitConfirmations: waitBlockConfirmations,
    // })
    // console.log("exchangeFactory deployed to:", exchangeFactory.address)
    // await verify(exchangeFactory.address, arguments)
    // log("----------------------------------------------------")
}

const verify = async (contractAddress, args) => {
    console.log("Verifying contract...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
        console.log("verified")
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already Verified!")
        } else {
            console.log(e)
        }
    }
}

module.exports.tags = ["all", "exchangeFactory"]
