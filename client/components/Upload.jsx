import React, { useRef, useState, useContext } from "react"
import {
    Text,
    Group,
    Button,
    createStyles,
    Title,
    TextInput,
    Tooltip,
    Progress,
    Skeleton,
    Container,
    Image,
    Badge,
    Center,
    NumberInput,
    NumberInputHandlers,
    ActionIcon,
    Switch,
    Slider,
    Modal,
    Textarea,
    Grid,
    SimpleGrid,
    Checkbox,
} from "@mantine/core"
import { ethers } from "ethers"
import { IconCloudUpload, IconX, IconDownload, IconCheck } from "@tabler/icons"
import { showNotification, updateNotification } from "@mantine/notifications"
import { useAccount } from "wagmi"
import { useSigner } from "wagmi"
import { useContractRead, useContractWrite, usePrepareContractWrite, useSignMessage } from "wagmi"
import {
    factoryAbi,
    factoryContractAddress,
    currency,
    exchangeFactoryContractAddress,
    exchangeFactoryAbi,
} from "../constants"
import { Orbis } from "@orbisclub/orbis-sdk"
import { useRouter } from "next/router"

const useStyles = createStyles((theme) => ({
    wrapper: {
        position: "relative",
        marginBottom: 30,
        marginTop: 30,
    },

    dropzone: {
        borderWidth: 1,
        paddingBottom: 50,
    },

    icon: {
        color: theme.colorScheme === "dark" ? theme.colors.dark[3] : theme.colors.gray[4],
    },

    control: {
        position: "absolute",
        width: 250,
        left: "calc(50% - 125px)",
        bottom: -20,
    },

    button: {
        marginTop: 20,
        marginBottom: 30,
    },

    progress: {
        position: "absolute",
        bottom: -1,
        right: -1,
        left: -1,
        top: -1,
        height: "auto",
        backgroundColor: "transparent",
        zIndex: 0,
    },

    label: {
        position: "relative",
        zIndex: 1,
    },
    card: {
        transition: "transform 150ms ease, box-shadow 150ms ease",

        "&:hover": {
            transform: "scale(1.01)",
            boxShadow: theme.shadows.md,
            cursor: "pointer",
        },
    },
}))

// string memory baseUri,
// uint256 minMembers,
// uint256 requestTime, // (in seconds) time before one can make a request
// uint256 validity, // (in seconds) insurance valid after startBefore seconds and user can claim insurance after validity
// uint256 claimTime, // (in seconds) time before use can make a insurance claim request, after this time judging will start.
// uint256 judgingTime, // (in seconds) time before judges should judge insurance claim requests.
// uint256 judgesLength, // number of judges
// uint256 amount, // amount everyone should put in the pool
// uint8 percentDivideIntoJudges // percent of total pool amount that should be divided into judges (total pool amount = amount * members.length where members.length == s_memberNumber - 1) (only valid for judges who had judged every claim request)

function Upload() {
    const router = useRouter()
    const { isConnected } = useAccount()
    const { data: signer, isError, isLoading } = useSigner()
    const [minMembers, setMinMembers] = useState(0)
    const [minMembersOpened, setMinMembersOpened] = useState(false)
    const minMembersValid = !!minMembers && Number.isInteger(parseInt(minMembers)) && minMembers > 0
    const [requestTime, setRequestTime] = useState(0)
    const [requestTimeOpened, setRequestTimeOpened] = useState(false)
    const requestTimeValid =
        !!requestTime && Number.isInteger(parseInt(requestTime)) && requestTime > 0
    const [validity, setValidity] = useState(0)
    const [validityOpened, setValidityOpened] = useState(false)
    const validityValid = !!validity && Number.isInteger(parseInt(validity)) && validity > 0
    const [claimTime, setClaimTime] = useState(0)
    const [claimTimeOpened, setClaimTimeOpened] = useState(false)
    const claimTimeValid = !!claimTime && Number.isInteger(parseInt(claimTime)) && claimTime > 0
    const [judgingTime, setJudgingTime] = useState(0)
    const [judgingTimeOpened, setJudgingTimeOpened] = useState(false)
    const judgingTimeValid =
        !!judgingTime && Number.isInteger(parseInt(judgingTime)) && judgingTime > 0
    const [judgesLength, setJudgesLength] = useState(0)
    const [judgesLengthOpened, setJudgesLengthOpened] = useState(false)
    const judgesLengthValid =
        !!judgesLength && Number.isInteger(parseInt(judgesLength)) && judgesLength > 0
    const [amount, setAmount] = useState(0)
    const [amountOpened, setAmountOpened] = useState(false)
    const amountValid = !!amount && Number.isInteger(parseInt(amount)) && amount > 0
    const [percentDivideIntoJudges, setPercentDivideIntoJudges] = useState(0)
    const [percentDivideIntoJudgesOpened, setPercentDivideIntoJudgesOpened] = useState(false)
    const percentDivideIntoJudgesValid =
        !!percentDivideIntoJudges &&
        Number.isInteger(parseInt(percentDivideIntoJudges)) &&
        percentDivideIntoJudges > 0
    const [titleOpened, setTitleOpened] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const titleValid = title.length > 0

    const [useLiquidity, setUseLiquidity] = useState(false)
    const [liquidityTokenAddressOpened, setLiquidityTokenAddressOpened] = useState(false)
    const [liquidityTokenAddress, setLiquidityTokenAddress] = useState("")
    const liquidityTokenAddressValid = ethers.utils.isAddress(liquidityTokenAddress)
    const [liquidityTokenAmountOpened, setLiquidityTokenAmountOpened] = useState(false)
    const [liquidityTokenAmount, setLiquidityTokenAmount] = useState(0)
    const liquidityTokenAmountValid =
        !!liquidityTokenAmount &&
        Number.isInteger(parseInt(liquidityTokenAmount)) &&
        liquidityTokenAmount > 0

    const postValid =
        titleValid &&
        minMembersValid &&
        requestTimeValid &&
        validityValid &&
        claimTimeValid &&
        judgingTimeValid &&
        judgesLengthValid &&
        amountValid &&
        percentDivideIntoJudgesValid &&
        (useLiquidity ? liquidityTokenAddressValid && liquidityTokenAmountValid : true)

    const handleCreate = async () => {
        if (!isConnected) {
            showNotification({
                id: "hello-there",
                autoClose: 5000,
                title: "Connect Wallet",
                message: "Please connect your wallet to create insurance contract",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }
        if (!postValid) {
            showNotification({
                id: "hello-there",
                // onClose: () => console.log("unmounted"),
                // onOpen: () => console.log("mounted"),
                autoClose: 5000,
                title: "Cannot create insurance contract",
                message: "Filled in all the required fields",
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
            title: "Creating...",
            message: "Please wait while we create your insurance contract",
            autoClose: false,
            disallowClose: true,
        })

        try {
            const ExchangeFactorycontractInstance = new ethers.Contract(
                exchangeFactoryContractAddress,
                exchangeFactoryAbi,
                signer
            )
            const exchangeAddress = await ExchangeFactorycontractInstance.getExchange(
                liquidityTokenAddress
            )
            if (exchangeAddress == ethers.constants.AddressZero) {
                showNotification({
                    id: "hello-there",
                    autoClose: 5000,
                    title: "Cannot create insurance contract",
                    message: "No exchange for this token adddress",
                    color: "red",
                    icon: <IconX />,
                    className: "my-notification-class",
                    loading: false,
                })
                return
            }

            const resForJsonCid = await fetch(
                process.env.NEXT_PUBLIC_API_URL + "/api/json-upload-ipfs",
                {
                    method: "POST",
                    body: JSON.stringify({
                        title: title,
                        description: description,
                    }),
                    headers: { "Content-Type": "application/json" },
                }
            )

            const jsonOfResForJsonCid = await resForJsonCid.json()

            const jsonCid = jsonOfResForJsonCid.cid
            console.log("stored json with cid:", jsonCid)

            // const parsedAmount = ethers.utils.parseUnits(goal, "ether")

            const contractInstance = new ethers.Contract(factoryContractAddress, factoryAbi, signer)
            // string memory baseUri,
            // uint256 minMembers,
            // uint256 requestTime, // (in seconds) time before one can make a request
            // uint256 validity, // (in seconds) insurance valid after startBefore seconds and user can claim insurance after validity
            // uint256 claimTime, // (in seconds) time before use can make a insurance claim request, after this time judging will start.
            // uint256 judgingTime, // (in seconds) time before judges should judge insurance claim requests.
            // uint256 judgesLength, // number of judges
            // uint256 amount, // amount everyone should put in the pool
            // uint8 percentDivideIntoJudges // percent of total pool amount that should be divided into judges (total pool amount = amount * members.length where members.length == s_memberNumber - 1) (only valid for judges who had judged every claim request)

            let orbis = new Orbis()
            console.log("orbis", orbis)
            let resIsConnect = await orbis.isConnected()
            console.log("resIsConnect", resIsConnect)
            if (resIsConnect.status !== 200) {
                console.log("not connected")
                let resConnect = await orbis.connect()
                console.log("resConnect", resConnect)
                if (resConnect.status !== 200) {
                    updateNotification({
                        id: "load-data",
                        autoClose: 5000,
                        title: "Unable to connect with ceramic on orbis",
                        message: "Check console for more details",
                        color: "red",
                        icon: <IconX />,
                        className: "my-notification-class",
                        loading: false,
                    })
                    return
                }
            }

            let resGroup = await orbis.createGroup({
                name: title,
            })

            if (resGroup.status !== 200) {
                console.log("resGroup", resGroup)
                updateNotification({
                    id: "load-data",
                    autoClose: 5000,
                    title: "Unable to create group with ceramic on orbis",
                    message: "Check console for more details",
                    color: "red",
                    icon: <IconX />,
                    className: "my-notification-class",
                    loading: false,
                })
                return
            }

            console.log(
                jsonCid,
                minMembers,
                requestTime,
                validity,
                claimTime,
                judgingTime,
                judgesLength,
                ethers.utils.parseUnits(amount.toString(), "ether"),
                percentDivideIntoJudges,
                resGroup.doc
            )

            // string memory baseUri,
            // uint256 minMembers,
            // uint256 requestTime, // (in seconds) time before one can make a request
            // uint256 validity, // (in seconds) insurance valid after startBefore seconds and user can claim insurance after validity
            // uint256 claimTime, // (in seconds) time before use can make a insurance claim request, after this time judging will start.
            // uint256 judgingTime, // (in seconds) time before judges should judge insurance claim requests.
            // uint256 judgesLength, // number of judges
            // uint256 amount, // amount everyone should put in the pool
            // uint256 percentDivideIntoJudges, // percent of total pool amount that should be divided into judges (total pool amount = amount * members.length where members.length == s_memberNumber - 1) (only valid for judges who had judged every claim request)
            // bool useLiquidityPool, // if true, the insurance contract will add funds to liquidity pool
            // address liquidityTokenAddress, // address of liquidity token
            // uint256 liquidityTokenAmount, // amount of liquidity token to add to liquidity pool
            // string memory groupId

            const tx = await contractInstance.createInsurance(
                jsonCid,
                minMembers,
                requestTime,
                validity,
                claimTime,
                judgingTime,
                judgesLength,
                ethers.utils.parseUnits(amount.toString(), "ether"),
                percentDivideIntoJudges,
                useLiquidity,
                useLiquidity ? liquidityTokenAddress : ethers.constants.AddressZero,
                useLiquidity
                    ? ethers.utils.parseUnits(liquidityTokenAmount.toString(), "ether")
                    : 0,
                resGroup.doc
                // { gasLimit: 1000000 }
            )
            console.log("tx done")

            console.log("tx hash")
            console.log(tx.hash)
            console.log("-----------------------------")

            const response = await tx.wait()
            console.log("DONE!!!!!!!!!!!!!!!!!!")

            console.log("response")
            console.log(response)
            const insuranceAddress = response.logs[0].address
            console.log("insuranceAddress", insuranceAddress)

            // console.log("response hash")
            // console.log(response.hash)
            console.log("-----------------------------")

            updateNotification({
                id: "load-data",
                color: "teal",
                title: "Insurance created",
                icon: <IconCheck size={16} />,
                autoClose: 2000,
            })

            router.push(`/insurance/${insuranceAddress}`)
        } catch (error) {
            console.log("error", error)
            updateNotification({
                id: "load-data",
                autoClose: 5000,
                title: "Unable to create insurance contract",
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
                label={titleValid ? "All good!" : "Title shouldn't be empty"}
                position="bottom-start"
                withArrow
                opened={titleOpened}
                color={titleValid ? "teal" : undefined}
            >
                <TextInput
                    label="Title"
                    required
                    placeholder="Your title"
                    onFocus={() => setTitleOpened(true)}
                    onBlur={() => setTitleOpened(false)}
                    mt="md"
                    value={title}
                    onChange={(event) => setTitle(event.currentTarget.value)}
                />
            </Tooltip>

            <Textarea
                label="Description"
                placeholder="Your description"
                mt="md"
                autosize
                minRows={2}
                maxRows={4}
                value={description}
                onChange={(event) => setDescription(event.currentTarget.value)}
            />

            <Tooltip
                label={minMembersValid ? "All good!" : "minimum supply should be greater than 0"}
                position="bottom-start"
                withArrow
                opened={minMembersOpened}
                color={minMembersValid ? "teal" : undefined}
            >
                <TextInput
                    label="Minimum Members"
                    required
                    placeholder={"Minimum Members"}
                    onFocus={() => setMinMembersOpened(true)}
                    onBlur={() => setMinMembersOpened(false)}
                    mt="md"
                    value={minMembers}
                    // type="number"
                    min={1}
                    step="1"
                    onChange={(event) => {
                        let value = 0
                        if (event.target.value == "" || !event.target.value) {
                            value = 0
                            setMinMembers(value)
                        } else if (Number.isInteger(parseInt(event.target.value))) {
                            value = parseInt(event.target.value)
                            setMinMembers(value)
                        }
                    }}
                />
            </Tooltip>

            <Tooltip
                label={requestTimeValid ? "All good!" : "request time should be greater than 0"}
                position="bottom-start"
                withArrow
                opened={requestTimeOpened}
                color={requestTimeValid ? "teal" : undefined}
            >
                <TextInput
                    label="Request Time (in seconds)"
                    required
                    placeholder={"Request Time"}
                    onFocus={() => setRequestTimeOpened(true)}
                    onBlur={() => setRequestTimeOpened(false)}
                    mt="md"
                    value={requestTime}
                    // type="number"
                    min={1}
                    step="1"
                    onChange={(event) => {
                        let value = 0
                        if (event.target.value == "" || !event.target.value) {
                            value = 0
                            setRequestTime(value)
                        } else if (Number.isInteger(parseInt(event.target.value))) {
                            value = parseInt(event.target.value)
                            setRequestTime(value)
                        }
                    }}
                />
            </Tooltip>

            <Text
                // component="span"
                mt="md"
                align="center"
                variant="gradient"
                gradient={{ from: "yellow", to: "red", deg: 45 }}
                size="md"
                weight={700}
                style={{ fontFamily: "Greycliff CF, sans-serif" }}
            >
                Time after insurance starts and time before members can be added
            </Text>

            <Tooltip
                label={validityValid ? "All good!" : "validity should be greater than 0"}
                position="bottom-start"
                withArrow
                opened={validityOpened}
                color={validityValid ? "teal" : undefined}
            >
                <TextInput
                    label="Validity (in seconds)"
                    required
                    placeholder={"Validity"}
                    onFocus={() => setValidityOpened(true)}
                    onBlur={() => setValidityOpened(false)}
                    mt="md"
                    value={validity}
                    // type="number"
                    min={1}
                    step="1"
                    onChange={(event) => {
                        let value = 0
                        if (event.target.value == "" || !event.target.value) {
                            value = 0
                            setValidity(value)
                        } else if (Number.isInteger(parseInt(event.target.value))) {
                            value = parseInt(event.target.value)
                            setValidity(value)
                        }
                    }}
                />
            </Tooltip>

            <Text
                // component="span"
                mt="md"
                align="center"
                variant="gradient"
                gradient={{ from: "yellow", to: "red", deg: 45 }}
                size="md"
                weight={700}
                style={{ fontFamily: "Greycliff CF, sans-serif" }}
            >
                Time after insurance is over
            </Text>

            <Tooltip
                label={claimTimeValid ? "All good!" : "claim time should be greater than 0"}
                position="bottom-start"
                withArrow
                opened={claimTimeOpened}
                color={claimTimeValid ? "teal" : undefined}
            >
                <TextInput
                    label="Claim Time (in seconds)"
                    required
                    placeholder={"Claim Time"}
                    onFocus={() => setClaimTimeOpened(true)}
                    onBlur={() => setClaimTimeOpened(false)}
                    mt="md"
                    value={claimTime}
                    // type="number"
                    min={1}
                    step="1"
                    onChange={(event) => {
                        let value = 0
                        if (event.target.value == "" || !event.target.value) {
                            value = 0
                            setClaimTime(value)
                        } else if (Number.isInteger(parseInt(event.target.value))) {
                            value = parseInt(event.target.value)
                            setClaimTime(value)
                        }
                    }}
                />
            </Tooltip>

            <Text
                // component="span"
                mt="md"
                align="center"
                variant="gradient"
                gradient={{ from: "yellow", to: "red", deg: 45 }}
                size="md"
                weight={700}
                style={{ fontFamily: "Greycliff CF, sans-serif" }}
            >
                Time before insurance can be claimed
            </Text>

            <Tooltip
                label={
                    percentDivideIntoJudgesValid
                        ? "All good!"
                        : "percent divide into judges should be greater than 0"
                }
                position="bottom-start"
                withArrow
                opened={percentDivideIntoJudgesOpened}
                color={percentDivideIntoJudgesValid ? "teal" : undefined}
            >
                <TextInput
                    label="Percent Divide Into Judges (in 1-100)"
                    required
                    placeholder={"Percent Divide Into Judges"}
                    onFocus={() => setPercentDivideIntoJudgesOpened(true)}
                    onBlur={() => setPercentDivideIntoJudgesOpened(false)}
                    mt="md"
                    value={percentDivideIntoJudges}
                    // type="number"
                    min={1}
                    step="1"
                    onChange={(event) => {
                        let value = 0
                        if (event.target.value == "" || !event.target.value) {
                            value = 0
                            setPercentDivideIntoJudges(value)
                        } else if (Number.isInteger(parseInt(event.target.value))) {
                            value = parseInt(event.target.value)
                            setPercentDivideIntoJudges(value)
                        }
                    }}
                />
            </Tooltip>

            <Tooltip
                label={judgingTimeValid ? "All good!" : "judging time should be greater than 0"}
                position="bottom-start"
                withArrow
                opened={judgingTimeOpened}
                color={judgingTimeValid ? "teal" : undefined}
            >
                <TextInput
                    label="Judging Time (in seconds)"
                    required
                    placeholder={"Judging Time"}
                    onFocus={() => setJudgingTimeOpened(true)}
                    onBlur={() => setJudgingTimeOpened(false)}
                    mt="md"
                    value={judgingTime}
                    // type="number"
                    min={1}
                    step="1"
                    onChange={(event) => {
                        let value = 0
                        if (event.target.value == "" || !event.target.value) {
                            value = 0
                            setJudgingTime(value)
                        } else if (Number.isInteger(parseInt(event.target.value))) {
                            value = parseInt(event.target.value)
                            setJudgingTime(value)
                        }
                    }}
                />
            </Tooltip>

            <Text
                // component="span"
                mt="md"
                align="center"
                variant="gradient"
                gradient={{ from: "yellow", to: "red", deg: 45 }}
                size="md"
                weight={700}
                style={{ fontFamily: "Greycliff CF, sans-serif" }}
            >
                Time for which judges can vote
            </Text>

            <Tooltip
                label={judgesLengthValid ? "All good!" : "judges length should be greater than 0"}
                position="bottom-start"
                withArrow
                opened={judgesLengthOpened}
                color={judgesLengthValid ? "teal" : undefined}
            >
                <TextInput
                    label="Judges Length"
                    required
                    placeholder={"Judges Length"}
                    onFocus={() => setJudgesLengthOpened(true)}
                    onBlur={() => setJudgesLengthOpened(false)}
                    mt="md"
                    value={judgesLength}
                    // type="number"
                    min={1}
                    step="1"
                    onChange={(event) => {
                        let value = 0
                        if (event.target.value == "" || !event.target.value) {
                            value = 0
                            setJudgesLength(value)
                        } else if (Number.isInteger(parseInt(event.target.value))) {
                            value = parseInt(event.target.value)
                            setJudgesLength(value)
                        }
                    }}
                />
            </Tooltip>

            <Tooltip
                label={amountValid ? "All good!" : "amount should be greater than 0"}
                position="bottom-start"
                withArrow
                opened={amountOpened}
                color={amountValid ? "teal" : undefined}
            >
                <TextInput
                    label={"Amount ( in " + currency + " )"}
                    required
                    placeholder={"Amount in " + currency}
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

            <Checkbox
                mt="xl"
                checked={useLiquidity}
                onChange={(event) => setUseLiquidity(event.currentTarget.checked)}
                label="Use funds in insurance to provide liquidity in the exchange"
            />

            {useLiquidity && (
                <>
                    <Tooltip
                        label={liquidityTokenAddressValid ? "All good!" : "Invalid Token Address"}
                        position="bottom-start"
                        withArrow
                        opened={liquidityTokenAddressOpened}
                        color={liquidityTokenAddressValid ? "teal" : undefined}
                    >
                        <TextInput
                            label={"Token Address for Liquidity pair with native token"}
                            required
                            placeholder={"Token Address"}
                            onFocus={() => setLiquidityTokenAddressOpened(true)}
                            onBlur={() => setLiquidityTokenAddressOpened(false)}
                            mt="md"
                            value={liquidityTokenAddress}
                            onChange={(event) => {
                                setLiquidityTokenAddress(event.target.value)
                            }}
                        />
                    </Tooltip>

                    <Tooltip
                        label={
                            liquidityTokenAmountValid
                                ? "All good!"
                                : "amount should be greater than 0"
                        }
                        position="bottom-start"
                        withArrow
                        opened={liquidityTokenAmountOpened}
                        color={liquidityTokenAmountValid ? "teal" : undefined}
                    >
                        <TextInput
                            label={"Token Amount for Liquidity pair with native token"}
                            required
                            placeholder={"Amount in " + currency}
                            onFocus={() => setLiquidityTokenAmountOpened(true)}
                            onBlur={() => setLiquidityTokenAmountOpened(false)}
                            mt="md"
                            value={liquidityTokenAmount}
                            type="number"
                            min={0}
                            step="1"
                            onWheel={(e) => e.target.blur()}
                            onChange={(event) => {
                                setLiquidityTokenAmount(event.target.value)
                            }}
                        />
                    </Tooltip>
                </>
            )}

            <Center mt="md">
                <Button
                    variant="gradient"
                    gradient={{ from: "teal", to: "lime", deg: 105 }}
                    onClick={() => {
                        handleCreate()
                    }}
                >
                    Upload
                </Button>
            </Center>
        </>
    )
}

export default Upload
