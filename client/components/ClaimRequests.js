import { useEffect, useState } from "react"
import {
    createStyles,
    Table,
    ScrollArea,
    Modal,
    Text,
    Skeleton,
    Textarea,
    Button,
} from "@mantine/core"
import { insuranceAbi } from "../constants"
import { useAccount, useSigner } from "wagmi"
import { ethers } from "ethers"
import { useRouter } from "next/router"
import { IconCheck, IconX } from "@tabler/icons"
import { showNotification, updateNotification } from "@mantine/notifications"

const useStyles = createStyles((theme) => ({
    header: {
        position: "sticky",
        top: 0,
        backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
        transition: "box-shadow 150ms ease",

        "&::after": {
            content: '""',
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            borderBottom: `1px solid ${
                theme.colorScheme === "dark" ? theme.colors.dark[3] : theme.colors.gray[2]
            }`,
        },
    },

    scrolled: {
        boxShadow: theme.shadows.sm,
    },
}))

export function ClaimRequests({ contractAddress, totalClaimRequests }) {
    const { classes, cx } = useStyles()
    const [scrolled, setScrolled] = useState(false)
    const [claimRequests, setClaimRequests] = useState([])
    const [modalOpened, setModalOpened] = useState(false)
    const [addressSelected, setAddressSelected] = useState("")
    const [description, setDescription] = useState("")
    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)

    const { isConnected } = useAccount()
    const { data: signer, isError, isLoading } = useSigner()
    const router = useRouter()

    useEffect(() => {
        // const handleScroll = () => {
        //     if (window.scrollY > 0) {
        //         setScrolled(true)
        //     } else {
        //         setScrolled(false)
        //     }
        // }
        // window.addEventListener("scroll", handleScroll)
        // return () => window.removeEventListener("scroll", handleScroll)
        fetchMemberRequests()
    }, [])

    const fetchMemberRequests = async () => {
        console.log("fetching member requests")
        const contractInstance = new ethers.Contract(
            contractAddress,
            insuranceAbi,
            signer
                ? signer
                : ethers.getDefaultProvider(process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL)
        )

        for (let i = 1; i <= totalRequests; i++) {
            const member = await contractInstance.getClaimById(i)
            setClaimRequests((members) => [...members, member])
        }
    }

    const handleAccept = async () => {
        showNotification({
            id: "load-data",
            loading: true,
            title: "Accepting...",
            message: "Please wait...",
            autoClose: false,
            disallowClose: true,
        })
        try {
            const contractInstance = new ethers.Contract(
                contractAddress,
                insuranceAbi,
                signer
                    ? signer
                    : ethers.getDefaultProvider(process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL)
            )

            const id = await contractInstance.getClaimIdByAddress(addressSelected)
            const tx = await contractInstance.updateInsurance(id, true, "")
            console.log("tx done")

            console.log("tx hash")
            console.log(tx.hash)
            console.log("-----------------------------")

            const response = await tx.wait()
            console.log("DONE!!!!!!!!!!!!!!!!!!")

            console.log("response")
            console.log(response)

            // console.log("response hash")
            // console.log(response.hash)
            console.log("-----------------------------")
            setModalOpened(false)
            updateNotification({
                id: "load-data",
                color: "teal",
                title: "Accepted Successfully",
                icon: <IconCheck size={16} />,
                autoClose: 2000,
            })
            router.reload()
        } catch (error) {
            console.log(error)
            updateNotification({
                id: "load-data",
                autoClose: 5000,
                title: "Unable to accept",
                message: "Check console for more details",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
        }
    }

    const handleReject = async () => {
        if (!reason) {
            showNotification({
                id: "hello-there",
                autoClose: 5000,
                title: "Please enter a reason for rejecting",
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
            title: "Rejecting...",
            message: "Please wait...",
            autoClose: false,
            disallowClose: true,
        })
        try {
            const contractInstance = new ethers.Contract(
                contractAddress,
                insuranceAbi,
                signer
                    ? signer
                    : ethers.getDefaultProvider(process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL)
            )

            const resForJsonCid = await fetch(
                process.env.NEXT_PUBLIC_API_URL + "/api/json-upload-ipfs",
                {
                    method: "POST",
                    body: JSON.stringify({
                        description: description,
                    }),
                    headers: { "Content-Type": "application/json" },
                }
            )

            const jsonOfResForJsonCid = await resForJsonCid.json()

            const jsonCid = jsonOfResForJsonCid.cid
            console.log("stored json with cid:", jsonCid)

            const id = await contractInstance.getClaimIdByAddress(addressSelected)
            const tx = await await contractInstance.acceptJoiningRequest(id, false, jsonCid)
            console.log("tx done")

            console.log("tx hash")
            console.log(tx.hash)
            console.log("-----------------------------")

            const response = await tx.wait()
            console.log("DONE!!!!!!!!!!!!!!!!!!")

            console.log("response")
            console.log(response)

            // console.log("response hash")
            // console.log(response.hash)
            console.log("-----------------------------")
            setModalOpened(false)
            updateNotification({
                id: "load-data",
                color: "teal",
                title: "Rejected Successfully",
                icon: <IconCheck size={16} />,
                autoClose: 2000,
            })
            router.reload()
        } catch (error) {
            console.log(error)
            updateNotification({
                id: "load-data",
                autoClose: 5000,
                title: "Unable to reject",
                message: "Check console for more details",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
        }
    }

    const handleClick = async (address, requestUri) => {
        showNotification({
            id: "load-data",
            loading: true,
            title: "Loading details...",
            message: "Please wait...",
            autoClose: false,
            disallowClose: true,
        })
        setAddressSelected(address)
        const contractInstance = new ethers.Contract(
            contractAddress,
            insuranceAbi,
            signer
                ? signer
                : ethers.getDefaultProvider(process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL)
        )
        const selfId = await contractInstance.getMemberIdByAddress(await signer.getAddress())
        const id = await contractInstance.getClaimIdByAddress(address)
        const judgement = await contractInstance.getJudgement(selfId, id)

        if (
            (judgement.accepted == false && judgement.reasonUri.length != 0) ||
            judgement.accepted == true
        ) {
            showNotification({
                id: "hello-there",
                autoClose: 5000,
                title: "Already Accepted",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }
        setModalOpened(true)
        const res = await fetch(`https://${baseUri}.ipfs.nftstorage.link/data.json`)
        const data = await res.json()
        console.log(data)
        setDescription(data.description)
        setLoading(false)
        updateNotification({
            id: "load-data",
            color: "teal",
            title: "Details Loaded Successfully",
            icon: <IconCheck size={16} />,
            autoClose: 2000,
        })
    }

    const rows = claimRequests.map((member) => (
        <tr key={member.memberAddress}>
            <td>{member.memberAddress}</td>
            <td>{ethers.utils.formatEther(member.amount)}</td>
            <td>{member.accepted.toString()}</td>
            <td>
                <Button
                    radius="xl"
                    onClick={() => {
                        handleClick(member.memberAddress, member.requestUri)
                    }}
                >
                    check details
                </Button>
            </td>
        </tr>
    ))

    return (
        <Table>
            <thead className={cx(classes.header, { [classes.scrolled]: scrolled })}>
                <tr>
                    <th>Account Address</th>
                    <th>Amount</th>
                    <th>Acceptance</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>{rows}</tbody>
            <Modal
                opened={modalOpened}
                onClose={() => setModalOpened(false)}
                title="Claim request"
                overflow="inside"
            >
                <Skeleton sx={loading ? { height: "85vh" } : null} visible={loading}>
                    <Text
                        // component="span"
                        align="center"
                        // variant="gradient"
                        // gradient={{ from: "red", to: "red", deg: 45 }}
                        size="xl"
                        weight={700}
                        style={{
                            fontFamily: "Greycliff CF, sans-serif",
                            marginTop: "10px",
                        }}
                    >
                        {description}
                    </Text>

                    <Textarea
                        label="Reason to reject (only enter if you want to reject)"
                        placeholder="Your description"
                        mt="md"
                        autosize
                        minRows={2}
                        maxRows={4}
                        value={reason}
                        onChange={(event) => setReason(event.currentTarget.value)}
                    />
                    <Button
                        radius="xl"
                        onClick={() => {
                            handleAccept()
                        }}
                    >
                        Accept
                    </Button>
                    <Button
                        radius="xl"
                        onClick={() => {
                            handleReject()
                        }}
                    >
                        Reject
                    </Button>
                </Skeleton>
            </Modal>
        </Table>
    )
}
