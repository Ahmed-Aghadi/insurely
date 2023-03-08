import {
    Button,
    Center,
    Select,
    Skeleton,
    Table,
    Text,
    TextInput,
    Tooltip,
    Group,
    Avatar,
    Paper,
    Loader,
} from "@mantine/core"
import { showNotification, updateNotification } from "@mantine/notifications"
import { IconCheck, IconX } from "@tabler/icons"
import { ethers } from "ethers"
import { useRouter } from "next/router"
import React, { useEffect, useState, forwardRef } from "react"
import { useAccount, useSigner } from "wagmi"
import {
    currency,
    erc20Abi,
    exchangeAbi,
    exchangeFactoryAbi,
    exchangeFactoryContractAddress,
    tokenContractAddress,
} from "../constants"

const initialTokens = [
    {
        label: currency,
        value: "native",
        description: currency,
    },

    {
        label: "TEST",
        value: tokenContractAddress,
        description: tokenContractAddress,
    },
]

const SelectItem = forwardRef(({ label, description, ...others }, ref) => (
    <div ref={ref} {...others}>
        <div>
            <Text size="sm">{label}</Text>
            <Text size="xs" opacity={0.65}>
                {description}
            </Text>
        </div>
    </div>
))

function Swap() {
    const [tokens, setTokens] = useState(initialTokens)
    const [selectedToken1, setSelectedToken1] = useState(initialTokens[0].value)
    const [selectedToken2, setSelectedToken2] = useState(initialTokens[1].value)
    const [tokenBalance1, setTokenBalance1] = useState(undefined)
    const [tokenBalance2, setTokenBalance2] = useState(undefined)

    const [tokenAmount1, setTokenAmount1] = useState(0)
    const [tokenAmount1Opened, setTokenAmount1Opened] = useState(false)
    const tokenAmount1Valid =
        !!tokenAmount1 && Number.isInteger(parseInt(tokenAmount1)) && tokenAmount1 > 0

    const [tokenAmount2Calculating, setTokenAmount2Calculating] = useState(false)
    const [tokenAmount2, setTokenAmount2] = useState(0)
    const [tokenAmount2Opened, setTokenAmount2Opened] = useState(false)
    const tokenAmount2Valid =
        !!tokenAmount2 && Number.isInteger(parseInt(tokenAmount2)) && tokenAmount2 > 0

    const isValid = tokenAmount1Valid && !!selectedToken1 && !!selectedToken2

    const [tokenName, setTokenName] = useState("")

    const [tokenBalance, setTokenBalance] = useState(undefined)
    const [nativeBalance, setNativeBalance] = useState(undefined)

    const [exchangeAddress1, setExchangeAddress1] = useState(undefined)
    const [exchangeAddress2, setExchangeAddress2] = useState(undefined)
    const isBothTokens = selectedToken1 !== "native" && selectedToken2 !== "native"

    const [nativeReserve1, setNativeReserve1] = useState(0)
    const [nativeReserve2, setNativeReserve2] = useState(0)
    const [tokenReserve1, setTokenReserve1] = useState(0)
    const [tokenReserve2, setTokenReserve2] = useState(0)
    const [isLoadingReserves, setIsLoadingReserves] = useState(false)

    const isLoading = isLoadingReserves || tokenAmount2Calculating

    const { address, isConnected } = useAccount()
    const { data: signer } = useSigner()

    const [mounted, setMounted] = useState(false) // To fix hydration issue

    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (isConnected) {
            ;(async () => {
                const provider = ethers.getDefaultProvider(
                    process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL
                )
                if (selectedToken1 === "native") {
                    setTokenBalance1(ethers.utils.formatEther(await provider.getBalance(address)))
                } else if (!!selectedToken1) {
                    const contractInstance = new ethers.Contract(
                        selectedToken1,
                        erc20Abi,
                        ethers.getDefaultProvider(process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL)
                    )
                    setTokenBalance1(
                        ethers.utils.formatEther(await contractInstance.balanceOf(address))
                    )
                } else {
                    setTokenBalance1(undefined)
                }
                if (selectedToken2 === "native") {
                    setTokenBalance2(ethers.utils.formatEther(await provider.getBalance(address)))
                } else if (!!selectedToken2) {
                    const contractInstance = new ethers.Contract(
                        selectedToken2,
                        erc20Abi,
                        ethers.getDefaultProvider(process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL)
                    )
                    setTokenBalance2(
                        ethers.utils.formatEther(await contractInstance.balanceOf(address))
                    )
                } else {
                    setTokenBalance2(undefined)
                }
            })()
        }
    }, [selectedToken1, selectedToken2, isConnected])

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
        if (isConnected && !!selectedToken1 && !!selectedToken2) {
            setTokenAmount1(0)
            setTokenAmount2(0)
            ;(async () => {
                const contractInstance = new ethers.Contract(
                    exchangeFactoryContractAddress,
                    exchangeFactoryAbi,
                    ethers.getDefaultProvider(process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL)
                )
                const provider = ethers.getDefaultProvider(
                    process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL
                )
                if (selectedToken1 === "native") {
                    const exchangeAddress = await contractInstance.getExchange(selectedToken2)
                    setExchangeAddress1(exchangeAddress)
                    const tokenContractInstance = new ethers.Contract(
                        selectedToken2,
                        erc20Abi,
                        ethers.getDefaultProvider(process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL)
                    )
                    setNativeReserve1(
                        ethers.utils.formatEther(await provider.getBalance(exchangeAddress))
                    )
                    setTokenReserve1(
                        ethers.utils.formatEther(
                            await tokenContractInstance.balanceOf(exchangeAddress)
                        )
                    )
                } else if (selectedToken2 === "native") {
                    const exchangeAddress = await contractInstance.getExchange(selectedToken1)
                    setExchangeAddress2(exchangeAddress)
                    const tokenContractInstance = new ethers.Contract(
                        selectedToken1,
                        erc20Abi,
                        ethers.getDefaultProvider(process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL)
                    )
                    setNativeReserve2(
                        ethers.utils.formatEther(await provider.getBalance(exchangeAddress))
                    )
                    setTokenReserve2(
                        ethers.utils.formatEther(
                            await tokenContractInstance.balanceOf(exchangeAddress)
                        )
                    )
                } else {
                    const exchangeAddress1 = await contractInstance.getExchange(selectedToken1)
                    setExchangeAddress1(exchangeAddress1)
                    const tokenContractInstance1 = new ethers.Contract(
                        selectedToken1,
                        erc20Abi,
                        ethers.getDefaultProvider(process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL)
                    )
                    setNativeReserve1(
                        ethers.utils.formatEther(await provider.getBalance(exchangeAddress1))
                    )
                    setTokenReserve1(
                        ethers.utils.formatEther(
                            await tokenContractInstance1.balanceOf(exchangeAddress1)
                        )
                    )
                    const exchangeAddress2 = await contractInstance.getExchange(selectedToken2)
                    setExchangeAddress2(exchangeAddress2)
                    const tokenContractInstance2 = new ethers.Contract(
                        selectedToken2,
                        erc20Abi,
                        ethers.getDefaultProvider(process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL)
                    )
                    setNativeReserve2(
                        ethers.utils.formatEther(await provider.getBalance(exchangeAddress2))
                    )
                    setTokenReserve2(
                        ethers.utils.formatEther(
                            await tokenContractInstance2.balanceOf(exchangeAddress2)
                        )
                    )
                }
                setIsLoadingReserves(false)
            })()
            ;(async () => {})()
        }
    }, [selectedToken1, selectedToken2, isLoadingReserves])

    useEffect(() => {
        if (isConnected && !!selectedToken1 && !!selectedToken2) {
            ;(async () => {
                setTokenAmount2Calculating(true)
                console.log("tokenAmount1", tokenAmount1)
                if (tokenAmount1 == 0 || !tokenAmount1) {
                    setTokenAmount2(0)
                    setTokenAmount2Calculating(false)
                    return
                }
                if (nativeReserve1 != 0 && (isBothTokens ? nativeReserve2 != 0 : true)) {
                    // setToken2Amount(
                    //     (
                    //         (event.target.value * tokenReserve1) /
                    //         nativeReserve1
                    //     ).toString()
                    // )
                    const exchange1ContractInstance = new ethers.Contract(
                        exchangeAddress1,
                        exchangeAbi,
                        ethers.getDefaultProvider(process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL)
                    )
                    if (selectedToken1 === "native") {
                        setTokenAmount2(
                            ethers.utils.formatEther(
                                await exchange1ContractInstance.getTokenAmount(
                                    ethers.utils.parseEther(tokenAmount1)
                                )
                            )
                        )
                    } else if (selectedToken2 === "native") {
                        setTokenAmount2(
                            ethers.utils.formatEther(
                                await exchange1ContractInstance.getEthAmount(
                                    ethers.utils.parseEther(tokenAmount1)
                                )
                            )
                        )
                    } else {
                        const token1ToNative = ethers.utils.formatEther(
                            await exchange1ContractInstance.getEthAmount(
                                ethers.utils.parseEther(tokenAmount1)
                            )
                        )
                        const exchange2ContractInstance = new ethers.Contract(
                            exchangeAddress2,
                            exchangeAbi,
                            ethers.getDefaultProvider(
                                process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL
                            )
                        )
                        const nativeToToken2 = ethers.utils.formatEther(
                            await exchange2ContractInstance.getTokenAmount(
                                ethers.utils.parseEther(token1ToNative)
                            )
                        )
                        setTokenAmount2(nativeToToken2)
                    }
                }
                setTokenAmount2Calculating(false)
            })()
        }
    }, [
        tokenAmount1,
        selectedToken1,
        selectedToken2,
        isConnected,
        exchangeAddress1,
        exchangeAddress2,
        nativeReserve1,
        nativeReserve2,
    ])

    const handleSwap = async () => {
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
                title: "Cannot swap",
                message:
                    "Please select two different tokens and enter a valid amount of tokens to swap",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }
        if (ethers.utils.parseEther(tokenAmount1).gt(ethers.utils.parseEther(tokenBalance1))) {
            showNotification({
                id: "hello-there",
                // onClose: () => console.log("unmounted"),
                // onOpen: () => console.log("mounted"),
                autoClose: 5000,
                title: "Cannot add liquidity",
                message:
                    "You don't have enough tokens ( " +
                    tokens.find((token) => token.value === selectedToken1).label +
                    " ) to swap",
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
            title: "Swapping tokens",
            message: "Please wait...",
            autoClose: false,
            disallowClose: true,
        })
        try {
            if (selectedToken1 !== "native" && exchangeAddress1 === ethers.constants.AddressZero) {
                updateNotification({
                    id: "load-data",
                    autoClose: 5000,
                    title:
                        "Exchange not found for " +
                        tokens.find((token) => token.value === selectedToken1).label,
                    message: "Please create an exchange first",
                    color: "red",
                    icon: <IconX />,
                    className: "my-notification-class",
                    loading: false,
                })
                return
            }
            if (selectedToken2 !== "native" && exchangeAddress2 === ethers.constants.AddressZero) {
                updateNotification({
                    id: "load-data",
                    autoClose: 5000,
                    title:
                        "Exchange not found for " +
                        tokens.find((token) => token.value === selectedToken2).label,
                    message: "Please create an exchange first",
                    color: "red",
                    icon: <IconX />,
                    className: "my-notification-class",
                    loading: false,
                })
                return
            }
            if (selectedToken1 !== "native") {
                const tokenContractInstance = new ethers.Contract(selectedToken1, erc20Abi, signer)
                const allowance = await tokenContractInstance.allowance(address, exchangeAddress1)
                if (allowance.lt(ethers.utils.parseEther(tokenAmount1))) {
                    const tx = await tokenContractInstance.approve(
                        exchangeAddress1,
                        ethers.utils.parseEther(tokenAmount1)
                    )
                    await tx.wait()
                }
            }
            const contractInstance = new ethers.Contract(exchangeAddress1, exchangeAbi, signer)

            let tx
            if (selectedToken1 === "native") {
                tx = await contractInstance.ethToTokenSwap(ethers.utils.parseEther(tokenAmount2), {
                    value: ethers.utils.parseEther(tokenAmount1),
                })
            } else if (selectedToken2 === "native") {
                tx = await contractInstance.tokenToEthSwap(
                    ethers.utils.parseEther(tokenAmount1),
                    ethers.utils.parseEther(tokenAmount2)
                )
            } else {
                tx = await contractInstance.tokenToTokenSwap(
                    ethers.utils.parseEther(tokenAmount1),
                    ethers.utils.parseEther(tokenAmount2),
                    selectedToken2
                )
            }

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
                title: "Tokens swapped",
                icon: <IconCheck size={16} />,
                autoClose: 2000,
            })

            router.reload()
        } catch (error) {
            console.log("error", error)
            updateNotification({
                id: "load-data",
                autoClose: 5000,
                title: "Unable to swap tokens",
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
            {mounted && (
                <>
                    <Select
                        label="From"
                        placeholder="Pick one or type contract address"
                        itemComponent={SelectItem}
                        data={tokens}
                        value={selectedToken1}
                        onChange={(value) => {
                            if (value !== selectedToken1) {
                                setIsLoadingReserves(true)
                            }
                            if (value === selectedToken2) {
                                setSelectedToken2(null)
                            }
                            setSelectedToken1(value)
                        }}
                        searchable
                        maxDropdownHeight={400}
                        nothingFound="Nobody here"
                        filter={(value, item) =>
                            item.label.toLowerCase().includes(value.toLowerCase().trim()) ||
                            item.description.toLowerCase().includes(value.toLowerCase().trim())
                        }
                        creatable
                        getCreateLabel={(query) => `+ Add ${query}`}
                        onCreate={(query) => {
                            if (!ethers.utils.isAddress(query)) {
                                showNotification({
                                    id: "hello-there",
                                    // onClose: () => console.log("unmounted"),
                                    // onOpen: () => console.log("mounted"),
                                    autoClose: 5000,
                                    title: "Invalid address",
                                    message: "Please enter a valid contract address",
                                    color: "red",
                                    icon: <IconX />,
                                    className: "my-notification-class",
                                    loading: false,
                                })
                                return
                            }
                            const contractInstance = new ethers.Contract(
                                exchangeFactoryContractAddress,
                                exchangeFactoryAbi,
                                ethers.getDefaultProvider(
                                    process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL
                                )
                            )
                            contractInstance.getExchange(query).then((exchangeAddress) => {
                                if (exchangeAddress === ethers.constants.AddressZero) {
                                    showNotification({
                                        id: "hello-there",
                                        // onClose: () => console.log("unmounted"),
                                        // onOpen: () => console.log("mounted"),
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
                                if (!tokens.find((token) => token.value === query)) {
                                    const contractInstance = new ethers.Contract(
                                        query,
                                        erc20Abi,
                                        ethers.getDefaultProvider(
                                            process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL
                                        )
                                    )
                                    contractInstance.name().then((name) => {
                                        const item = {
                                            value: query,
                                            label: name,
                                            description: query,
                                        }
                                        setTokens((current) => [...current, item])
                                        return item
                                    })
                                } else {
                                    console.log(tokens.find((token) => token.value === query))
                                    return tokens.find((token) => token.value === query)
                                }
                            })
                        }}
                    />
                    <Select
                        label="To"
                        placeholder="Pick one or type contract address"
                        itemComponent={SelectItem}
                        data={tokens}
                        value={selectedToken2}
                        onChange={(value) => {
                            if (value !== selectedToken2) {
                                setIsLoadingReserves(true)
                            }
                            if (value === selectedToken1) {
                                setSelectedToken1(null)
                            }
                            setSelectedToken2(value)
                        }}
                        searchable
                        maxDropdownHeight={400}
                        nothingFound="Nobody here"
                        filter={(value, item) =>
                            item.label.toLowerCase().includes(value.toLowerCase().trim()) ||
                            item.description.toLowerCase().includes(value.toLowerCase().trim())
                        }
                        creatable
                        getCreateLabel={(query) => `+ Add ${query}`}
                        onCreate={(query) => {
                            if (!ethers.utils.isAddress(query)) {
                                showNotification({
                                    id: "hello-there",
                                    // onClose: () => console.log("unmounted"),
                                    // onOpen: () => console.log("mounted"),
                                    autoClose: 5000,
                                    title: "Invalid address",
                                    message: "Please enter a valid contract address",
                                    color: "red",
                                    icon: <IconX />,
                                    className: "my-notification-class",
                                    loading: false,
                                })
                                return
                            }
                            const contractInstance = new ethers.Contract(
                                exchangeFactoryContractAddress,
                                exchangeFactoryAbi,
                                ethers.getDefaultProvider(
                                    process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL
                                )
                            )
                            contractInstance.getExchange(query).then((exchangeAddress) => {
                                if (exchangeAddress === ethers.constants.AddressZero) {
                                    showNotification({
                                        id: "hello-there",
                                        // onClose: () => console.log("unmounted"),
                                        // onOpen: () => console.log("mounted"),
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
                                if (!tokens.find((token) => token.value === query)) {
                                    const contractInstance = new ethers.Contract(
                                        query,
                                        erc20Abi,
                                        ethers.getDefaultProvider(
                                            process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL
                                        )
                                    )
                                    contractInstance.name().then((name) => {
                                        const item = {
                                            value: query,
                                            label: name,
                                            description: query,
                                        }
                                        setTokens((current) => [...current, item])
                                        return item
                                    })
                                } else {
                                    console.log(tokens.find((token) => token.value === query))
                                    return tokens.find((token) => token.value === query)
                                }
                            })
                        }}
                    />

                    {isConnected ? (
                        selectedToken1 &&
                        selectedToken2 && (
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
                                            <td>
                                                {
                                                    tokens.find(
                                                        (token) => token.value === selectedToken1
                                                    ).label
                                                }
                                            </td>
                                            <td>
                                                <Skeleton visible={tokenBalance1 === undefined}>
                                                    {tokenBalance1 ? tokenBalance1 : 0}
                                                </Skeleton>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                {
                                                    tokens.find(
                                                        (token) => token.value === selectedToken2
                                                    ).label
                                                }
                                            </td>
                                            <td>
                                                <Skeleton visible={tokenBalance2 === undefined}>
                                                    {tokenBalance2 ? tokenBalance2 : 0}
                                                </Skeleton>
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>
                                <Skeleton visible={isLoadingReserves}>
                                    <Tooltip
                                        label={
                                            tokenAmount1Valid
                                                ? "All good!"
                                                : "amount should be greater than 0"
                                        }
                                        position="bottom-start"
                                        withArrow
                                        opened={tokenAmount1Opened}
                                        color={tokenAmount1Valid ? "teal" : undefined}
                                    >
                                        <TextInput
                                            label={
                                                tokens.find(
                                                    (token) => token.value === selectedToken1
                                                ).label
                                            }
                                            required
                                            placeholder="Amount"
                                            onFocus={() => setTokenAmount1Opened(true)}
                                            onBlur={() => setTokenAmount1Opened(false)}
                                            mt="md"
                                            value={tokenAmount1}
                                            type="number"
                                            min={0}
                                            step="1"
                                            onWheel={(e) => e.target.blur()}
                                            onChange={async (event) => {
                                                setTokenAmount1(event.target.value)
                                                // updating setTokenAmount2 using useEffect
                                            }}
                                        />
                                    </Tooltip>

                                    <Tooltip
                                        label={
                                            tokenAmount2Valid
                                                ? "All good!"
                                                : "amount should be greater than 0"
                                        }
                                        position="bottom-start"
                                        withArrow
                                        opened={tokenAmount2Opened}
                                        color={tokenAmount2Valid ? "teal" : undefined}
                                    >
                                        <TextInput
                                            label={
                                                tokens.find(
                                                    (token) => token.value === selectedToken2
                                                ).label
                                            }
                                            // required
                                            disabled
                                            placeholder="Amount"
                                            rightSection={
                                                tokenAmount2Calculating ? (
                                                    <Loader size="xs" />
                                                ) : null
                                            }
                                            onFocus={() => setTokenAmount2Opened(true)}
                                            onBlur={() => setTokenAmount2Opened(false)}
                                            mt="md"
                                            value={tokenAmount2}
                                            type="number"
                                            // min={0}
                                            // step="1"
                                            // onWheel={(e) => e.target.blur()}
                                            // onChange={(event) => {
                                            //     setTokenAmount2(event.target.value)
                                            //     if (tokenReserve1 != 0) {
                                            //         setTokenAmount1(
                                            //             (event.target.value * nativeReserve1) / tokenReserve1
                                            //         )
                                            //     }
                                            // }}
                                        />
                                    </Tooltip>

                                    {tokenReserve1 != 0 ? (
                                        <Center mt="md">
                                            <div>
                                                <Text mt="md" mb="md">
                                                    1{" "}
                                                    {
                                                        tokens.find(
                                                            (token) =>
                                                                token.value === selectedToken1
                                                        ).label
                                                    }{" "}
                                                    ={" "}
                                                    {selectedToken1 === "native"
                                                        ? tokenReserve1 / nativeReserve1
                                                        : (nativeReserve1 / tokenReserve1) *
                                                          (tokenReserve2 / nativeReserve2)}{" "}
                                                    {
                                                        tokens.find(
                                                            (token) =>
                                                                token.value === selectedToken2
                                                        ).label
                                                    }
                                                </Text>
                                                <Text mt="md" mb="md">
                                                    1{" "}
                                                    {
                                                        tokens.find(
                                                            (token) =>
                                                                token.value === selectedToken2
                                                        ).label
                                                    }{" "}
                                                    ={" "}
                                                    {selectedToken1 === "native"
                                                        ? nativeReserve1 / tokenReserve1
                                                        : (tokenReserve1 / nativeReserve1) *
                                                          (nativeReserve2 / tokenReserve2)}{" "}
                                                    {
                                                        tokens.find(
                                                            (token) =>
                                                                token.value === selectedToken1
                                                        ).label
                                                    }
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
                                            // disabled={isLoading}
                                            loading={isLoading}
                                            gradient={{ from: "teal", to: "lime", deg: 105 }}
                                            onClick={() => {
                                                handleSwap()
                                            }}
                                        >
                                            Swap
                                        </Button>
                                    </Center>
                                </Skeleton>
                            </>
                        )
                    ) : (
                        <Center mt="md">
                            <Text mt="md" mb="md">
                                Connect your wallet to Swap
                            </Text>
                        </Center>
                    )}
                </>
            )}
        </>
    )
}

export default Swap
