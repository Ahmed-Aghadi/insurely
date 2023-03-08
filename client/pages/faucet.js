import { Button, Center, Text, TextInput, Tooltip } from "@mantine/core"
import { showNotification, updateNotification } from "@mantine/notifications"
import { IconCheck, IconX } from "@tabler/icons"
import { ethers } from "ethers"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { useAccount, useSigner } from "wagmi"
import { currency, erc20Abi, tokenAbi, tokenContractAddress } from "../constants"
import "../styles/Home.module.css"

export default function Home() {
    const [amount, setAmount] = useState(0)
    const [amountOpened, setAmountOpened] = useState(false)
    const amountValid = !!amount && Number.isInteger(parseInt(amount)) && amount > 0

    const [amountOwned, setAmountOwned] = useState(0)

    const { address, isConnected } = useAccount()
    const { data: signer } = useSigner()

    const router = useRouter()

    useEffect(() => {
        const getAmountOwned = async () => {
            const contractInstance = new ethers.Contract(tokenContractAddress, erc20Abi, signer)
            const amountOwned = await contractInstance.balanceOf(address)
            setAmountOwned(ethers.utils.formatUnits(amountOwned, 18))
        }
        if (isConnected && address && signer) {
            getAmountOwned()
        }
    }, [address, isConnected, signer])

    const handleSubmit = async () => {
        if (!isConnected) {
            showNotification({
                id: "hello-there",
                autoClose: 5000,
                title: "Connect Wallet",
                message: "Please connect your wallet to receive tokens",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }
        if (!amountValid) {
            showNotification({
                id: "hello-there",
                // onClose: () => console.log("unmounted"),
                // onOpen: () => console.log("mounted"),
                autoClose: 5000,
                title: "Cannot request tokens",
                message: "Please enter a valid amount",
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
            title: "Requesting tokens",
            message: "Please wait...",
            autoClose: false,
            disallowClose: true,
        })

        try {
            const contractInstance = new ethers.Contract(tokenContractAddress, tokenAbi, signer)

            const tx = await contractInstance.mint(
                address,
                ethers.utils.parseUnits(amount.toString(), 18)
            )
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
                title: "Tokens received",
                icon: <IconCheck size={16} />,
                autoClose: 2000,
            })

            router.reload()
        } catch (error) {
            console.log("error", error)
            updateNotification({
                id: "load-data",
                autoClose: 5000,
                title: "Unable to request tokens",
                message: "Check console for more details",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
        }
    }

    return (
        <div>
            <Tooltip
                label={amountValid ? "All good!" : "amount should be greater than 0"}
                position="bottom-start"
                withArrow
                opened={amountOpened}
                color={amountValid ? "teal" : undefined}
            >
                <TextInput
                    label={"Amount of token you want to receive"}
                    required
                    placeholder="Amount"
                    onFocus={() => setAmountOpened(true)}
                    onBlur={() => setAmountOpened(false)}
                    mt="md"
                    value={amount}
                    type="number"
                    min={0}
                    step="1"
                    onWheel={(e) => e.target.blur()}
                    onChange={(event) => {
                        setAmount(event.target.value)
                    }}
                />
            </Tooltip>

            <Center mt="md">
                <Button
                    variant="gradient"
                    gradient={{ from: "teal", to: "lime", deg: 105 }}
                    onClick={() => {
                        handleSubmit()
                    }}
                >
                    Submit
                </Button>
            </Center>

            {/* <TextInput label={"Amount of token you owns"} disabled mt="md" value={amountOwned} /> */}
            <Text mt="md" size="sm">
                Amount of token you owns: {amountOwned}
            </Text>
            <Text mt="md" size="sm">
                Contract Address: 0x5452fD02e04Abc7101588014BB7A44d1e761e261
            </Text>
        </div>
    )
}
