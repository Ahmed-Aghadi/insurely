import React, { useEffect, useState } from "react"
import { Carousel } from "@mantine/carousel"
import {
    IconBookmark,
    IconHeart,
    IconShare,
    IconGasStation,
    IconGauge,
    IconManualGearbox,
    IconUsers,
    IconFriends,
    IconUserPlus,
    IconReceiptTax,
    IconCash,
} from "@tabler/icons"
import {
    Badge,
    Card,
    Image,
    Text,
    ActionIcon,
    Group,
    Center,
    Avatar,
    Skeleton,
    createStyles,
    Button,
} from "@mantine/core"
import { ethers } from "ethers"
import { insuranceAbi, currency, sigmatorNFTAbi } from "../constants"
import { useRouter } from "next/router"
import { useAccount, useSigner } from "wagmi"
import { useContext } from "react"

const useStyles = createStyles((theme) => ({
    card: {
        backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
        boxShadow: theme.shadows.sm,
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        "&:hover": {
            transform: "scale(1.01)",
            boxShadow: theme.shadows.xl,
        },
    },

    imageSection: {
        padding: theme.spacing.md,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderBottom: `1px solid ${
            theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[3]
        }`,
    },

    label: {
        marginBottom: theme.spacing.xs,
        lineHeight: 1,
        fontWeight: 700,
        fontSize: theme.fontSizes.xs,
        letterSpacing: -0.25,
        textTransform: "uppercase",
    },

    section: {
        padding: theme.spacing.md,
        borderTop: `1px solid ${
            theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[3]
        }`,
    },

    icon: {
        marginRight: 5,
        color: theme.colorScheme === "dark" ? theme.colors.dark[2] : theme.colors.gray[5],
    },
}))

const mockdata = [
    { label: "4 passengers", icon: IconUsers },
    { label: "100 km/h in 4 seconds", icon: IconGauge },
    { label: "Automatic gearbox", icon: IconManualGearbox },
    { label: "Electric", icon: IconGasStation },
]

function InsuranceCard({ insurance }) {
    const { classes, cx, theme } = useStyles()
    const features = mockdata.map((feature) => (
        <Center key={feature.label}>
            <feature.icon size={18} className={classes.icon} stroke={1.5} />
            <Text size="xs">{feature.label}</Text>
        </Center>
    ))
    const router = useRouter()
    const { isConnected } = useAccount()
    const { data: signer, isError, isLoading } = useSigner()
    const insuranceContractAddress = insurance.contractAddress
    // uint256 minMembers,
    // uint256 requestTime, // (in seconds) time before one can make a request
    // uint256 validity, // (in seconds) insurance valid after startBefore seconds and user can claim insurance after validity
    // uint256 claimTime, // (in seconds) time before use can make a insurance claim request, after this time judging will start.
    // uint256 judgingTime, // (in seconds) time before judges should judge insurance claim requests.
    // uint256 judgesLength, // number of judges
    // uint256 amount, // amount everyone should put in the pool
    // uint8 percentDivideIntoJudges // percent of total pool amount that should be divided into judges (total pool amount = amount * members.length where members.length == s_memberNumber - 1) (only valid for judges who had judged every claim request)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [minMembers, setMinMembers] = useState(0)
    const [members, setMembers] = useState(0)
    const [entryTime, setEntryTime] = useState(0)
    const [amount, setAmount] = useState(0)
    const [useLiquidity, setUseLiquidity] = useState(false)
    const [tokenAddress, setTokenAddress] = useState("")
    const [tokenAmount, setTokenAmount] = useState(0)
    const [tokenSymbol, setTokenSymbol] = useState("")
    const [judgesLength, setJudgesLength] = useState(0)
    const [percentDivideIntoJudges, setPercentDivideIntoJudges] = useState(0)
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        fetchFromContract()
    }, [])

    const fetchFromContract = async () => {
        const contractInstance = new ethers.Contract(
            insuranceContractAddress,
            insuranceAbi,
            ethers.getDefaultProvider(process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL)
        )
        const baseUri = await contractInstance.getBaseUri()
        const res = await fetch(`https://${baseUri}.ipfs.nftstorage.link/data.json`)
        const data = await res.json()
        console.log(data)
        setTitle(data.title)
        setDescription(data.description)
        const mM = (await contractInstance.getMinMembers()).toString()
        console.log("minMembers", mM)
        setMinMembers(mM)
        const tM = (await contractInstance.getTotalMembers()).toString()
        console.log("totalMembers", tM)
        setMembers(tM)
        // (new Date(et * 1000)).toLocaleString()
        const eT = (await contractInstance.getRequestBefore()).toString()
        console.log("entryTime", eT)
        setEntryTime(eT)
        const a = ethers.utils.formatEther(await contractInstance.getAmount()).toString()
        console.log("amount", a)
        setAmount(a)
        const jL = (await contractInstance.getJudgesLength()).toString()
        console.log("judgesLength", jL)
        setJudgesLength(jL)
        const pD = (await contractInstance.getPercentageDividedIntoJudges()).toString()
        console.log("percentDivideIntoJudges", pD)
        setPercentDivideIntoJudges(pD)
        const uL = await contractInstance.getUseLiquidityPool()
        console.log("useLiquidity", uL)
        setUseLiquidity(uL)
        const tA = await contractInstance.getLiquidityTokenAddress()
        console.log("tokenAddress", tA)
        setTokenAddress(tA)
        const tA2 = ethers.utils
            .formatEther(await contractInstance.getLiquidityTokenAmount())
            .toString()
        console.log("tokenAmount", tA2)
        setTokenAmount(tA2)
        const tokenContractInstance = new ethers.Contract(
            tA,
            erc20Abi,
            ethers.getDefaultProvider(process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL)
        )
        const tS = await tokenContractInstance.symbol()
        console.log("tokenSymbol", tS)
        setTokenSymbol(tS)
        setLoading(false)
    }

    const handleClick = async () => {
        router.push(`/insurance/${insuranceContractAddress}`)
    }

    return (
        <Skeleton
            sx={{ maxWidth: 320, minHeight: 400 }}
            // height={200}
            visible={loading}
        >
            <Card withBorder radius="md" className={classes.card}>
                <Card.Section className={classes.imageSection}>
                    {/* <Image src="https://i.imgur.com/ZL52Q2D.png" alt="Tesla Model S" /> */}
                    <Group position="apart" mt="md">
                        <div>
                            <Text weight={500}>{title}</Text>
                            <Text size="xs" color="dimmed">
                                {description.length == 0
                                    ? description
                                    : description.substring(0, 180) + "..."}
                            </Text>
                        </div>
                    </Group>
                </Card.Section>

                <Group position="apart" mt="md">
                    <div>
                        <Text size="xs" color="dimmed">
                            Entry Date: {new Date(entryTime * 1000).toLocaleString()}
                        </Text>
                    </div>
                </Group>

                <Card.Section className={classes.section} mt="md">
                    <Text size="sm" color="dimmed" className={classes.label}>
                        Basic details
                    </Text>

                    <Group spacing={8} mb={-8}>
                        <Center>
                            <IconFriends size={18} className={classes.icon} stroke={1.5} />
                            <Text size="xs">{judgesLength} judges</Text>
                        </Center>
                        <Center>
                            <IconCash size={18} className={classes.icon} stroke={1.5} />
                            <Text size="xs">{percentDivideIntoJudges}% for judges</Text>
                        </Center>
                        <Center>
                            <IconUsers size={18} className={classes.icon} stroke={1.5} />
                            <Text size="xs"> Minimum {minMembers} members</Text>
                        </Center>
                        <Center>
                            <IconUserPlus size={18} className={classes.icon} stroke={1.5} />
                            <Text size="xs">Total {members} members</Text>
                        </Center>
                    </Group>
                </Card.Section>

                <Card.Section className={classes.section}>
                    <Group spacing={30}>
                        <div>
                            <Text size="xl" weight={700} sx={{ lineHeight: 1 }}>
                                {amount} {currency}{" "}
                                {useLiquidity ? `+ ${tokenAmount} ${tokenSymbol}` : ""}
                            </Text>
                            <Text
                                size="sm"
                                color="dimmed"
                                weight={500}
                                sx={{ lineHeight: 1 }}
                                mt={3}
                            >
                                per member
                            </Text>
                        </div>

                        {entryTime * 1000 > Date.now() ? (
                            <Button
                                radius="xl"
                                style={{ flex: 1 }}
                                onClick={() => {
                                    handleClick()
                                }}
                            >
                                Get now
                            </Button>
                        ) : (
                            <Button
                                color="red"
                                radius="xl"
                                style={{ flex: 1 }}
                                onClick={() => {
                                    handleClick()
                                }}
                            >
                                Closed
                            </Button>
                        )}
                    </Group>
                </Card.Section>
            </Card>
        </Skeleton>
    )
}

// <Card
//     p="md"
//     sx={{ maxWidth: 320 }}
//     radius="md"
//     // component="a"
//     // href="#"
//     className={classes.card}
//     height={200}
// >
//     <Text color="dimmed" size="xs" transform="uppercase" weight={700} mt="md">
//         {symbol}
//     </Text>
//     <Text className={classes.title} mt={5}>
//         {title}
//     </Text>
//     <Skeleton visible={loading}>
//         <Carousel mx="auto" withIndicators>
//             {images.map((image, index) => (
//                 <Carousel.Slide key={index}>
//                     <Image
//                         sx={{ maxWidth: 320 }}
//                         fit="contain"
//                         src={image}
//                         height={200}
//                     />
//                 </Carousel.Slide>
//             ))}
//         </Carousel>
//     </Skeleton>
// </Card>;

export default InsuranceCard
