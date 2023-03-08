import { Button, Center, TextInput, Tooltip } from "@mantine/core"
import { showNotification, updateNotification } from "@mantine/notifications"
import { IconCheck, IconX } from "@tabler/icons"
import { ethers } from "ethers"
import { useRouter } from "next/router"
import React, { useEffect, useState } from "react"
import { useAccount, useSigner } from "wagmi"
import { exchangeFactoryAbi, exchangeFactoryContractAddress } from "../constants"

function CreateExchange() {
    const [tokenAddressOpened, setTokenAddressOpened] = useState(false)
    const [tokenAddress, setTokenAddress] = useState("")
    const tokenAddressValid = ethers.utils.isAddress(tokenAddress)

    const { address, isConnected } = useAccount()
    const { data: signer } = useSigner()

    const router = useRouter()

    const handleSubmit = async () => {
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
        if (!tokenAddressValid) {
            showNotification({
                id: "hello-there",
                // onClose: () => console.log("unmounted"),
                // onOpen: () => console.log("mounted"),
                autoClose: 5000,
                title: "Cannot create exchange",
                message: "Please enter a valid token address",
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
            title: "Creating exchange",
            message: "Please wait...",
            autoClose: false,
            disallowClose: true,
        })

        try {
            const contractInstance = new ethers.Contract(
                exchangeFactoryContractAddress,
                exchangeFactoryAbi,
                signer
            )

            const exchangeAddress = await contractInstance.getExchange(tokenAddress)
            if (exchangeAddress !== ethers.constants.AddressZero) {
                updateNotification({
                    id: "load-data",
                    autoClose: 5000,
                    title: "Exchange already exists",
                    message: "Please use the existing exchange",
                    color: "red",
                    icon: <IconX />,
                    className: "my-notification-class",
                    loading: false,
                })
                return
            }

            const tx = await contractInstance.createExchange(tokenAddress)
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
                title: "Exchange created",
                icon: <IconCheck size={16} />,
                autoClose: 2000,
            })

            router.reload()
        } catch (error) {
            console.log("error", error)
            updateNotification({
                id: "load-data",
                autoClose: 5000,
                title: "Unable to create exchange",
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
                    gradient={{ from: "teal", to: "lime", deg: 105 }}
                    onClick={() => {
                        handleSubmit()
                    }}
                >
                    Create
                </Button>
            </Center>
        </>
    )
}

export default CreateExchange
