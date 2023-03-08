import { Button, Center, Skeleton, Table, Text, TextInput, Tooltip } from "@mantine/core"
import { showNotification, updateNotification } from "@mantine/notifications"
import { IconCheck, IconX } from "@tabler/icons"
import { ethers } from "ethers"
import { useRouter } from "next/router"
import React, { useEffect, useState } from "react"
import { useAccount, useSigner } from "wagmi"
import {
    currency,
    erc20Abi,
    exchangeAbi,
    exchangeFactoryAbi,
    exchangeFactoryContractAddress,
} from "../constants"

function RemoveLiquidity() {
    const [tokenBalance, setTokenBalance] = useState(undefined)
    const [nativeBalance, setNativeBalance] = useState(undefined)
    const [swapTokenBalance, setSwapTokenBalance] = useState(undefined)

    const [swapAmount, setSwapAmount] = useState(0)
    const [swapAmountOpened, setSwapAmountOpened] = useState(false)
    const swapAmountValid =
        !!swapAmount &&
        Number.isInteger(parseInt(swapAmount)) &&
        swapAmount > 0 &&
        swapAmount <= swapTokenBalance

    const [nativeAmount, setNativeAmount] = useState(0)
    const nativeAmountValid =
        !!nativeAmount && Number.isInteger(parseInt(nativeAmount)) && nativeAmount > 0
    const [tokenAmount, setTokenAmount] = useState(0)
    const tokenAmountValid =
        !!tokenAmount && Number.isInteger(parseInt(tokenAmount)) && tokenAmount > 0

    const [totalSwapSupply, setTotalSwapSupply] = useState(0)
    const [isTotalSwapSupplyLoading, setIsTotalSwapSupplyLoading] = useState(false)

    const [tokenAddressOpened, setTokenAddressOpened] = useState(false)
    const [tokenAddress, setTokenAddress] = useState("")
    const tokenAddressValid = ethers.utils.isAddress(tokenAddress)

    const isValid = swapAmountValid && tokenAmountValid && tokenAddressValid

    const [tokenAddressAdded, setTokenAddressAdded] = useState(false)

    const [tokenName, setTokenName] = useState("")

    const [exchangeAddress, setExchangeAddress] = useState(undefined)

    const [nativeReserve, setNativeReserve] = useState(0)
    const [tokenReserve, setTokenReserve] = useState(0)
    const [isLoadingReserves, setIsLoadingReserves] = useState(false)

    const isLoading = isLoadingReserves || isTotalSwapSupplyLoading

    const { address, isConnected } = useAccount()
    const { data: signer } = useSigner()

    const router = useRouter()

    useEffect(() => {
        if (isConnected) {
            ;(async () => {
                const provider = ethers.getDefaultProvider(
                    process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL
                )
                const nativeBalance = ethers.utils.formatEther(await provider.getBalance(address))
                setNativeBalance(nativeBalance)
            })()
        }
    }, [isConnected])

    useEffect(() => {
        if (tokenAddressAdded && tokenAddressValid) {
            ;(async () => {
                const contractInstance = new ethers.Contract(
                    tokenAddress,
                    erc20Abi,
                    ethers.getDefaultProvider(process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL)
                )
                setTokenName(await contractInstance.name())
                setTokenBalance(ethers.utils.formatEther(await contractInstance.balanceOf(address)))
            })()
        }
    }, [tokenAddressAdded, tokenAddress, tokenAddressValid])

    useEffect(() => {
        if (exchangeAddress) {
            ;(async () => {
                const contractInstance = new ethers.Contract(
                    tokenAddress,
                    erc20Abi,
                    ethers.getDefaultProvider(process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL)
                )
                const tokenReserve = ethers.utils.formatEther(
                    await contractInstance.balanceOf(exchangeAddress)
                )
                setTokenReserve(tokenReserve)

                const provider = ethers.getDefaultProvider(
                    process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL
                )
                const nativeReserve = ethers.utils.formatEther(
                    await provider.getBalance(exchangeAddress)
                )
                setNativeReserve(nativeReserve)

                setIsLoadingReserves(false)
            })()
            ;(async () => {
                const contractInstance = new ethers.Contract(
                    exchangeAddress,
                    exchangeAbi,
                    ethers.getDefaultProvider(process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL)
                )

                const totalSwapSupply = ethers.utils.formatEther(
                    await contractInstance.totalSupply()
                )
                setTotalSwapSupply(totalSwapSupply)
                setIsTotalSwapSupplyLoading(false)
                const swapTokenBalance = ethers.utils.formatEther(
                    await contractInstance.balanceOf(address)
                )
                setSwapTokenBalance(swapTokenBalance)
            })()
        }
    }, [
        exchangeAddress,
        // isLoadingReserves,
        address,
    ])

    useEffect(() => {
        if (swapAmountValid) {
            if (totalSwapSupply != 0) {
                // uint256 ethAmount = (address(this).balance * _amount) / totalSupply();
                // uint256 tokenAmount = (getReserve() * _amount) / totalSupply();
                setNativeAmount(
                    ethers.utils.formatEther(
                        ethers.utils
                            .parseEther(nativeReserve.toString())
                            .mul(ethers.utils.parseEther(swapAmount.toString()))
                            .div(ethers.utils.parseEther(totalSwapSupply.toString()))
                    )
                )
                setTokenAmount(
                    ethers.utils.formatEther(
                        ethers.utils
                            .parseEther(tokenReserve.toString())
                            .mul(ethers.utils.parseEther(swapAmount.toString()))
                            .div(ethers.utils.parseEther(totalSwapSupply.toString()))
                    )
                )
            }
        }
    }, [swapAmount, swapAmountValid, nativeReserve, tokenReserve, totalSwapSupply])

    const handleRemoveLiquidity = async () => {
        if (!isConnected) {
            showNotification({
                id: "hello-there",
                autoClose: 5000,
                title: "Connect Wallet",
                message: "Please connect your wallet to create an exchange",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }
        if (!isValid) {
            showNotification({
                id: "hello-there",
                // onClose: () => console.log("unmounted"),
                // onOpen: () => console.log("mounted"),
                autoClose: 5000,
                title: "Cannot add liquidity",
                message:
                    "Please enter valid values for all fields ( amount should be greater than 0 )",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }
        if (swapAmount > swapTokenBalance) {
            showNotification({
                id: "hello-there",
                // onClose: () => console.log("unmounted"),
                // onOpen: () => console.log("mounted"),
                autoClose: 5000,
                title: "Cannot remove liquidity",
                message: "You don't have enough swap tokens to remove liquidity",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }
        showNotification({
            id: "load-data",
            loading: true,
            title: "Removing liquidity...",
            message: "Please wait...",
            autoClose: false,
            disallowClose: true,
        })

        try {
            if (exchangeAddress === ethers.constants.AddressZero) {
                updateNotification({
                    id: "load-data",
                    autoClose: 5000,
                    title: "Exchange not found",
                    message: "Please create an exchange first",
                    color: "red",
                    icon: <IconX />,
                    className: "my-notification-class",
                    loading: false,
                })
                return
            }
            const contractInstance = new ethers.Contract(exchangeAddress, exchangeAbi, signer)

            const tx = await contractInstance.removeLiquidity(
                ethers.utils.parseEther(swapAmount.toString())
            )

            console.log("tx")
            console.log(tx)

            console.log("tx done")

            console.log("tx hash")
            console.log(tx.hash)
            console.log("-----------------------------")

            const response = await tx.wait()
            console.log("DONE!!!!!!!!!!!!!!!!!!")

            console.log("response")
            console.log(response)

            console.log("response hash")
            console.log(response.hash)
            console.log("-----------------------------")

            updateNotification({
                id: "load-data",
                color: "teal",
                title: "Liquidity removed successfully",
                icon: <IconCheck size={16} />,
                autoClose: 2000,
            })

            router.reload()
        } catch (error) {
            console.log("error", error)
            updateNotification({
                id: "load-data",
                autoClose: 5000,
                title: "Unable to remove liquidity",
                message: "Check console for more details",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
        }
    }

    return (
        <>
            <Tooltip
                label={tokenAddressValid ? "All good!" : "Invalid Token Address"}
                position="bottom-start"
                withArrow
                opened={tokenAddressOpened}
                color={tokenAddressValid ? "teal" : undefined}
            >
                <TextInput
                    disabled={tokenAddressAdded}
                    label={"Token Address"}
                    required
                    placeholder={"Token Address"}
                    onFocus={() => setTokenAddressOpened(true)}
                    onBlur={() => setTokenAddressOpened(false)}
                    mt="md"
                    value={tokenAddress}
                    onChange={(event) => {
                        setTokenAddress(event.target.value)
                    }}
                />
            </Tooltip>

            <Center mt="md">
                <Button
                    variant="gradient"
                    gradient={
                        tokenAddressAdded
                            ? { from: "orange", to: "red" }
                            : { from: "teal", to: "lime", deg: 105 }
                    }
                    onClick={() => {
                        if (!tokenAddressAdded) {
                            if (!isConnected) {
                                showNotification({
                                    id: "hello-there",
                                    autoClose: 5000,
                                    title: "Connect Wallet",
                                    message: "Please connect your wallet to create an exchange",
                                    color: "red",
                                    icon: <IconX />,
                                    className: "my-notification-class",
                                    loading: false,
                                })
                                return
                            }
                            if (tokenAddressValid) {
                                const contractInstance = new ethers.Contract(
                                    exchangeFactoryContractAddress,
                                    exchangeFactoryAbi,
                                    ethers.getDefaultProvider(
                                        process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL
                                    )
                                )

                                contractInstance
                                    .getExchange(tokenAddress)
                                    .then((exchangeAddress) => {
                                        if (exchangeAddress === ethers.constants.AddressZero) {
                                            showNotification({
                                                id: "hello-there",
                                                // onClose: () => console.log("unmounted"),
                                                // onOpen: () => console.log("mounted"),
                                                autoClose: 5000,
                                                title: "Exchange does not exist",
                                                message: "Create an exchange for this token first",
                                                color: "red",
                                                icon: <IconX />,
                                                className: "my-notification-class",
                                                loading: false,
                                            })
                                            return
                                        }

                                        setIsLoadingReserves(true)
                                        setExchangeAddress(exchangeAddress)
                                        setTokenAddressAdded(true)
                                    })
                            }
                        } else {
                            setTokenAddressAdded(false)
                            // setTokenAddress("")
                        }
                    }}
                >
                    {tokenAddressAdded ? "Remove Token" : "Select Token"}
                </Button>
            </Center>

            {tokenAddressAdded && (
                <>
                    <Table mt="xl" mb="xl">
                        <thead>
                            <tr>
                                <th>Token</th>
                                <th>Your Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Swap token ( SWAP )</td>
                                <td>
                                    <Skeleton visible={swapTokenBalance === undefined}>
                                        {swapTokenBalance} SWAP
                                    </Skeleton>
                                </td>
                            </tr>
                        </tbody>
                    </Table>
                    <Skeleton visible={isLoading}>
                        <Tooltip
                            label={
                                swapAmountValid
                                    ? "All good!"
                                    : "amount should be greater than 0 and less than your balance"
                            }
                            position="bottom-start"
                            withArrow
                            opened={swapAmountOpened}
                            color={swapAmountValid ? "teal" : undefined}
                        >
                            <TextInput
                                label={
                                    "Amount of Swap tokens ( SWAP ) you want to remove from the liquidity pool"
                                }
                                required
                                placeholder="Amount"
                                onFocus={() => setSwapAmountOpened(true)}
                                onBlur={() => setSwapAmountOpened(false)}
                                mt="md"
                                value={swapAmount}
                                type="number"
                                min={0}
                                step="1"
                                onWheel={(e) => e.target.blur()}
                                onChange={(event) => {
                                    setSwapAmount(event.target.value)
                                    if (event.target.value == 0 || event.target.value == "") {
                                        setNativeAmount(0)
                                        setTokenAmount(0)
                                    }
                                }}
                            />
                        </Tooltip>

                        <Table mt="xl" mb="xl">
                            <thead>
                                <tr>
                                    <th>Token</th>
                                    <th>You will get</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Native token ( {currency} )</td>
                                    <td>
                                        <Skeleton visible={nativeBalance === undefined}>
                                            {nativeAmount} {currency}
                                        </Skeleton>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        Token ({" "}
                                        {tokenName ? tokenName : "unable to fetch token name"} )
                                    </td>
                                    <td>
                                        <Skeleton visible={tokenBalance === undefined}>
                                            {tokenAmount} {tokenName ? tokenName : ""}
                                        </Skeleton>
                                    </td>
                                </tr>
                            </tbody>
                        </Table>

                        {/* {tokenReserve != 0 ? (
                            <Center mt="md">
                                <div>
                                    <Text mt="md" mb="md">
                                        1 {tokenName} = {nativeReserve / tokenReserve} {currency}
                                    </Text>
                                    <Text mt="md" mb="md">
                                        1 {currency} = {tokenReserve / nativeReserve} {tokenName}
                                    </Text>
                                </div>
                            </Center>
                        ) : (
                            <Center mt="md">
                                <Text mt="md" mb="md">
                                    Exchange have no liquidity
                                </Text>
                            </Center>
                        )} */}

                        <Center mt="md">
                            <Button
                                variant="gradient"
                                gradient={{ from: "teal", to: "lime", deg: 105 }}
                                onClick={() => {
                                    handleRemoveLiquidity()
                                }}
                            >
                                Remove Liquidity
                            </Button>
                        </Center>
                    </Skeleton>
                </>
            )}
        </>
    )
}

export default RemoveLiquidity
