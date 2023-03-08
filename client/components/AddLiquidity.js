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

function AddLiquidity() {
    const [nativeAmount, setNativeAmount] = useState(0)
    const [nativeAmountOpened, setNativeAmountOpened] = useState(false)
    const nativeAmountValid =
        !!nativeAmount && Number.isInteger(parseInt(nativeAmount)) && nativeAmount > 0

    const [tokenAmount, setTokenAmount] = useState(0)
    const [tokenAmountOpened, setTokenAmountOpened] = useState(false)
    const tokenAmountValid =
        !!tokenAmount && Number.isInteger(parseInt(tokenAmount)) && tokenAmount > 0

    const [tokenAddressOpened, setTokenAddressOpened] = useState(false)
    const [tokenAddress, setTokenAddress] = useState("")
    const tokenAddressValid = ethers.utils.isAddress(tokenAddress)

    const isValid = nativeAmountValid && tokenAmountValid && tokenAddressValid

    const [tokenAddressAdded, setTokenAddressAdded] = useState(false)

    const [tokenName, setTokenName] = useState("")

    const [tokenBalance, setTokenBalance] = useState(undefined)
    const [nativeBalance, setNativeBalance] = useState(undefined)

    const [exchangeAddress, setExchangeAddress] = useState(undefined)

    const [nativeReserve, setNativeReserve] = useState(0)
    const [tokenReserve, setTokenReserve] = useState(0)
    const [isLoadingReserves, setIsLoadingReserves] = useState(false)

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
            ;(async () => {})()
        }
    }, [
        exchangeAddress,
        // isLoadingReserves
    ])

    const handleAddLiquidity = async () => {
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
        if (tokenAmount > tokenBalance) {
            showNotification({
                id: "hello-there",
                // onClose: () => console.log("unmounted"),
                // onOpen: () => console.log("mounted"),
                autoClose: 5000,
                title: "Cannot add liquidity",
                message: "You don't have enough tokens to add liquidity",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }
        if (nativeAmount > nativeBalance) {
            showNotification({
                id: "hello-there",
                // onClose: () => console.log("unmounted"),
                // onOpen: () => console.log("mounted"),
                autoClose: 5000,
                title: "Cannot add liquidity",
                message: "You don't have enough native tokens to add liquidity",
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
            title: "Adding liquidity...",
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
            const tokenContractInstance = new ethers.Contract(tokenAddress, erc20Abi, signer)
            const allowance = await tokenContractInstance.allowance(address, exchangeAddress)
            if (allowance.lt(ethers.utils.parseEther(tokenAmount))) {
                const tx = await tokenContractInstance.approve(
                    exchangeAddress,
                    ethers.utils.parseEther(tokenAmount)
                )
                await tx.wait()
            }
            const contractInstance = new ethers.Contract(exchangeAddress, exchangeAbi, signer)

            const tx = await contractInstance.addLiquidity(ethers.utils.parseEther(tokenAmount), {
                value: ethers.utils.parseEther(nativeAmount),
            })

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
                title: "Liquidity added successfully",
                icon: <IconCheck size={16} />,
                autoClose: 2000,
            })

            router.reload()
        } catch (error) {
            console.log("error", error)
            updateNotification({
                id: "load-data",
                autoClose: 5000,
                title: "Unable to add liquidity",
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
                                <td>Native token ( {currency} )</td>
                                <td>
                                    <Skeleton visible={nativeBalance === undefined}>
                                        {nativeBalance} {currency}
                                    </Skeleton>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    Token ( {tokenName ? tokenName : "unable to fetch token name"} )
                                </td>
                                <td>
                                    <Skeleton visible={tokenBalance === undefined}>
                                        {tokenBalance} {tokenName ? tokenName : ""}
                                    </Skeleton>
                                </td>
                            </tr>
                        </tbody>
                    </Table>
                    <Skeleton visible={isLoadingReserves}>
                        <Tooltip
                            label={
                                nativeAmountValid ? "All good!" : "amount should be greater than 0"
                            }
                            position="bottom-start"
                            withArrow
                            opened={nativeAmountOpened}
                            color={nativeAmountValid ? "teal" : undefined}
                        >
                            <TextInput
                                label={
                                    "Amount of native token ( " +
                                    currency +
                                    " ) you want to deposit"
                                }
                                required
                                placeholder="Amount"
                                onFocus={() => setNativeAmountOpened(true)}
                                onBlur={() => setNativeAmountOpened(false)}
                                mt="md"
                                value={nativeAmount}
                                type="number"
                                min={0}
                                step="1"
                                onWheel={(e) => e.target.blur()}
                                onChange={(event) => {
                                    setNativeAmount(event.target.value)
                                    if (nativeReserve != 0) {
                                        setTokenAmount(
                                            (
                                                (event.target.value * tokenReserve) /
                                                nativeReserve
                                            ).toString()
                                        )
                                    }
                                }}
                            />
                        </Tooltip>

                        <Tooltip
                            label={
                                tokenAmountValid ? "All good!" : "amount should be greater than 0"
                            }
                            position="bottom-start"
                            withArrow
                            opened={tokenAmountOpened}
                            color={tokenAmountValid ? "teal" : undefined}
                        >
                            <TextInput
                                label={
                                    tokenName
                                        ? "Amount of token ( " + tokenName + " ) you want to send"
                                        : "Amount of token you want to send ( unable to fetch token name )"
                                }
                                required
                                placeholder="Amount"
                                onFocus={() => setTokenAmountOpened(true)}
                                onBlur={() => setTokenAmountOpened(false)}
                                mt="md"
                                value={tokenAmount}
                                type="number"
                                min={0}
                                step="1"
                                onWheel={(e) => e.target.blur()}
                                onChange={(event) => {
                                    setTokenAmount(event.target.value)
                                    if (tokenReserve != 0) {
                                        setNativeAmount(
                                            (event.target.value * nativeReserve) / tokenReserve
                                        )
                                    }
                                }}
                            />
                        </Tooltip>

                        {tokenReserve != 0 ? (
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
                        )}

                        <Center mt="md">
                            <Button
                                variant="gradient"
                                gradient={{ from: "teal", to: "lime", deg: 105 }}
                                onClick={() => {
                                    handleAddLiquidity()
                                }}
                            >
                                Add Liquidity
                            </Button>
                        </Center>
                    </Skeleton>
                </>
            )}
        </>
    )
}

export default AddLiquidity
