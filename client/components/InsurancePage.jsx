import React, { useContext, useEffect, useState } from "react"
// import { useLocation, useNavigate, useParams } from "react-router-dom";
import { showNotification, updateNotification } from "@mantine/notifications"
import {
    createStyles,
    SimpleGrid,
    Container,
    AspectRatio,
    Badge,
    Button,
    Card,
    Image,
    Modal,
    Text,
    Tooltip,
    ActionIcon,
    Group,
    Center,
    Avatar,
    Skeleton,
    Slider,
    Timeline,
    Textarea,
    TextInput,
} from "@mantine/core"
import {
    IconCloudUpload,
    IconX,
    IconDownload,
    IconCheck,
    IconGitBranch,
    IconGitCommit,
    IconGitPullRequest,
    IconMessageDots,
} from "@tabler/icons"
import { ethers } from "ethers"
import { insuranceAbi, chainId, currency } from "../constants"
import { useRouter } from "next/router"
import { useAccount, useSigner } from "wagmi"
import { Members } from "./Members"
import { MemberRequests } from "./MemberRequests"
import { ClaimRequests } from "./ClaimRequests"
import ChatBox from "./ChatBox"

function InsurancePage() {
    // const params = useParams();
    const router = useRouter()
    const { postAddress: postContractAddress } = router.query
    const { isConnected } = useAccount()
    const { data: signer, isError, isLoading } = useSigner()
    // const [postContractAddress, setPostContractAddress] = useState("")

    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [minMembers, setMinMembers] = useState(0)
    const [members, setMembers] = useState(0)
    const [memberRequests, setMemberRequests] = useState(0)
    const [totalClaims, setTotalClaims] = useState(0)
    const [totalClaimsAccepted, setTotalClaimsAccepted] = useState(0)
    const [totalJudgesFullfilledJobs, setTotalJudgesFullfilledJobs] = useState(0)
    const [insuranceStartTime, setInsuranceStartTime] = useState(0)
    const [insuranceEndTime, setInsuranceEndTime] = useState(0)
    const [judgingStartTime, setJudgingStartTime] = useState(0)
    const [judgingEndTime, setJudgingEndTime] = useState(0)
    const [isMinMembersReachedCalculated, setIsMinMembersReachedCalculated] = useState(false)
    const [isMinMembersReached, setIsMinMembersReached] = useState(false)
    const [totalClaimAmountRequested, setTotalClaimAmountRequested] = useState(0)
    const [totalClaimAmountApproved, setTotalClaimAmountApproved] = useState(0)
    const [isFinalJudgementCalculated, setIsFinalJudgementCalculated] = useState(false)
    // const [isFullfilled, setIsFullfilled] = useState(false)
    const [amount, setAmount] = useState(0)
    const [judgesLength, setJudgesLength] = useState(0)
    const [percentDivideIntoJudges, setPercentDivideIntoJudges] = useState(0)
    const [active, setActive] = useState(false) // for timeline
    const [loading, setLoading] = useState(true)
    const [found, setFound] = useState(false)

    const [joiningDescription, setJoiningDescription] = useState("")
    const [claimDescription, setClaimDescription] = useState("")
    const [claimAmount, setClaimAmount] = useState(0)
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
    const [isClaimRequestModalOpen, setIsClaimRequestModalOpen] = useState(false)
    const [isUserMember, setIsUserMember] = useState(0) // 0 = not checked, 1 = member, 2 = member request pending, 3 = not member
    const [isUserJudge, setIsUserJudge] = useState(0) // 0 = not checked, 1 = judge, 2 = not judge

    const [isJoininRequestModalOpen, setIsJoininRequestModalOpen] = useState(false)
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)

    const [userBalance, setUserBalance] = useState(0)

    const [canUserAddAsMember, setCanUserAddAsMember] = useState(false)

    const [membersModalOpened, setMembersModalOpened] = useState(false)
    const [groupId, setGroupId] = useState()
    const [chatModalOpened, setChatModalOpened] = useState(false)
    useEffect(() => {
        if (router.isReady) {
            console.log("router.query.insuranceAddress", router.query.insuranceAddress)
            setLoading(true)
            fetchFromContract()
        }
    }, [router.isReady, signer])

    useEffect(() => {
        if (router.isReady && signer) {
            ;(async () => {
                if ((await signer.provider.getNetwork()).chainId == chainId) {
                    console.log("CHAIN ID IS CORRECT")
                    checkIsUserMember()
                }
            })()
        }
    }, [router.isReady, signer])

    // const checkSigner = async () => {
    //     const res = await window.ethereum.send("eth_requestAccounts")
    //     console.log("res", res)
    //     console.log("signer", signer)
    //     const provider1 = new ethers.providers.Web3Provider(window.ethereum)
    //     const signer1 = provider1.getSigner()
    //     console.log("signer1", signer1)
    // }

    const checkIsUserMember = async () => {
        console.log("checkIsUserMember", signer)
        const contractInstance = new ethers.Contract(
            router.query.insuranceAddress,
            insuranceAbi,
            signer
        )
        // console.log(
        //     "ddd",
        //     ethers.utils.formatEther(
        //         (await contractInstance.getClaimsAccepted())[0].amount.toString()
        //     )
        // )

        const id = (
            await contractInstance.getMemberIdByAddress(await signer.getAddress())
        ).toString()
        console.log("id", id)
        if (id != 0) {
            setIsUserMember(1)
            checkUserBalance()
            checkIsUserJudge()
        } else {
            const id2 = await contractInstance.getRequestIdByAddress(await signer.getAddress())
            if (id2 != 0) {
                setIsUserMember(2)
                checkUserRequestStatus(id2)
            } else {
                setIsUserMember(3)
            }
        }
    }

    const checkUserRequestStatus = async (requestId) => {
        console.log("checkUserRequestStatus", signer)
        const contractInstance = new ethers.Contract(
            router.query.insuranceAddress,
            insuranceAbi,
            signer
        )

        const tM = (await contractInstance.getTotalMembers()).toString()

        const request = await contractInstance.getRequestById(requestId)
        if (request.accepted == tM) {
            setCanUserAddAsMember(true)
        } else {
            setCanUserAddAsMember(false)
        }
    }

    const checkUserBalance = async () => {
        console.log("checkUserBalance", signer)
        const contractInstance = new ethers.Contract(
            router.query.insuranceAddress,
            insuranceAbi,
            signer
        )

        const balance = ethers.utils.formatEther(
            await contractInstance.getBalance(await signer.getAddress())
        )
        setUserBalance(balance)
    }

    const checkIsUserJudge = async () => {
        console.log("checkIsUserJudge", signer)
        const contractInstance = new ethers.Contract(
            router.query.insuranceAddress,
            insuranceAbi,
            signer
        )
        console.log("checking")

        const id = (
            await contractInstance.getJudgeIdByAddress(await signer.getAddress())
        ).toString()
        console.log("id judge", id)
        if (id != 0) {
            setIsUserJudge(1)
        } else {
            setIsUserJudge(2)
        }
    }

    const fetchFromContract = async () => {
        try {
            console.log("fetchFromContract", router.query.insuranceAddress)
            const contractInstance = new ethers.Contract(
                router.query.insuranceAddress,
                insuranceAbi,
                ethers.getDefaultProvider(process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL)
            )
            console.log("contractInstance", contractInstance)
            const baseUri = await contractInstance.getBaseUri()
            // const res = await fetch(`https://ipfs.io/ipfs/${baseUri}/data.json`)
            const res = await fetch(`https://${baseUri}.ipfs.nftstorage.link/data.json`)
            const data = await res.json()
            console.log(data)
            setTitle(data.title)
            setDescription(data.description)
            const gId = await contractInstance.getGroupId()
            setGroupId(gId)
            const mM = (await contractInstance.getMinMembers()).toString()
            console.log("minMembers", mM)
            setMinMembers(mM)
            const tM = (await contractInstance.getTotalMembers()).toString()
            console.log("totalMembers", tM)
            setMembers(tM)
            // (new Date(et * 1000)).toLocaleString()
            const a = ethers.utils.formatEther(await contractInstance.getAmount()).toString()
            console.log("amount", a)
            setAmount(a)
            const jL = (await contractInstance.getJudgesLength()).toString()
            console.log("judgesLength", jL)
            setJudgesLength(jL)
            const pD = (await contractInstance.getPercentageDividedIntoJudges()).toString()
            console.log("percentDivideIntoJudges", pD)
            setPercentDivideIntoJudges(pD)
            setFound(true)

            const timeNow = Date.now() / 1000

            const iST = (await contractInstance.getRequestBefore()).toString()
            console.log("entryTime", iST)
            setInsuranceStartTime(iST)
            const iET = (await contractInstance.getValidity()).toString()
            console.log("insuranceEndTime", iET)
            setInsuranceEndTime(iET)
            const jST = (await contractInstance.getJudgingStartTime()).toString()
            console.log("judgingStartTime", jST)
            setJudgingStartTime(jST)
            const jET = (await contractInstance.getJudgingEndTime()).toString()
            console.log("judgingEndTime", jET)
            setJudgingEndTime(jET)

            setMemberRequests((await contractInstance.getTotalRequests()).toString())
            setActive(0)
            if (timeNow > iST) {
                setActive(1)
            }
            if (timeNow > iET) {
                setActive(2)
                setTotalClaims((await contractInstance.getTotalClaims()).toString())
                setTotalClaimAmountRequested(
                    ethers.utils.formatEther(await contractInstance.getTotalClaimAmountRequested())
                )
            }
            if (timeNow > jST) {
                setActive(3)
                setIsMinMembersReachedCalculated(
                    await contractInstance.getIsMinimumMembersReachedCalculated()
                )
                setIsMinMembersReached(await contractInstance.getIsMinimumMembersReached())
            }
            if (timeNow > jET) {
                setActive(4)
                setTotalJudgesFullfilledJobs(
                    (await contractInstance.getTotalJudgesFullFilledJobs()).toString()
                )
                setIsFinalJudgementCalculated(await contractInstance.getIsClaimFullfilled())
                // setIsFullfilled(await contractInstance.getIsFullfilled())
                setTotalClaimsAccepted((await contractInstance.getClaimAcceptedLength()).toString())
                setTotalClaimAmountApproved(
                    ethers.utils.formatEther(await contractInstance.getTotalClaimAmountAccepted())
                )
            }
            setFound(true)
            setLoading(false)
        } catch (error) {
            console.log("error", error)
            setFound(false)
        }
        setLoading(false)
    }

    const handleClaimRequestClick = async () => {
        if (!isConnected) {
            showNotification({
                id: "hello-there",
                autoClose: 5000,
                title: "Connect Wallet",
                message: "Please connect your wallet",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
            return
        }
        if (claimAmount == 0) {
            showNotification({
                id: "hello-there",
                autoClose: 5000,
                title: "Claim Amount cannot be 0",
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
            title: "Making claim request...",
            message: "Please wait...",
            autoClose: false,
            disallowClose: true,
        })
        try {
            const contractInstance = new ethers.Contract(
                router.query.insuranceAddress,
                insuranceAbi,
                signer
            )
            const resForJsonCid = await fetch(
                process.env.NEXT_PUBLIC_API_URL + "/api/json-upload-ipfs",
                {
                    method: "POST",
                    body: JSON.stringify({
                        description: claimDescription,
                    }),
                    headers: { "Content-Type": "application/json" },
                }
            )

            const jsonOfResForJsonCid = await resForJsonCid.json()

            const jsonCid = jsonOfResForJsonCid.cid
            console.log("stored json with cid:", jsonCid)

            const tx = await contractInstance.requestForInsurance(
                jsonCid,
                ethers.utils.parseEther(claimAmount)
            )
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
            updateNotification({
                id: "load-data",
                color: "teal",
                title: "Upload Successfully",
                icon: <IconCheck size={16} />,
                autoClose: 2000,
            })
            router.reload()
        } catch (error) {
            console.log("error", error)
            updateNotification({
                id: "load-data",
                autoClose: 5000,
                title: "Unable to join",
                message: "Check console for more details",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
        }
    }

    const handleJoinRequestClick = async () => {
        if (!isConnected) {
            showNotification({
                id: "hello-there",
                autoClose: 5000,
                title: "Connect Wallet",
                message: "Please connect your wallet",
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
            title: "Making joining request...",
            message: "Please wait...",
            autoClose: false,
            disallowClose: true,
        })
        try {
            const contractInstance = new ethers.Contract(
                router.query.insuranceAddress,
                insuranceAbi,
                signer
            )
            const resForJsonCid = await fetch(
                process.env.NEXT_PUBLIC_API_URL + "/api/json-upload-ipfs",
                {
                    method: "POST",
                    body: JSON.stringify({
                        description: joiningDescription,
                    }),
                    headers: { "Content-Type": "application/json" },
                }
            )

            const jsonOfResForJsonCid = await resForJsonCid.json()

            const jsonCid = jsonOfResForJsonCid.cid
            console.log("stored json with cid:", jsonCid)

            const tx = await contractInstance.makeJoiningRequest(jsonCid, {
                value: ethers.utils.parseEther(amount),
            })
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
            updateNotification({
                id: "load-data",
                color: "teal",
                title: "Upload Successfully",
                icon: <IconCheck size={16} />,
                autoClose: 2000,
            })
            router.reload()
        } catch (error) {
            console.log("error", error)
            updateNotification({
                id: "load-data",
                autoClose: 5000,
                title: "Unable to join",
                message: "Check console for more details",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
        }
    }

    const handleAddAsMember = async () => {
        if (!isConnected) {
            showNotification({
                id: "hello-there",
                autoClose: 5000,
                title: "Connect Wallet",
                message: "Please connect your wallet",
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
            title: "Adding as a member...",
            message: "Please wait...",
            autoClose: false,
            disallowClose: true,
        })
        try {
            const contractInstance = new ethers.Contract(
                router.query.insuranceAddress,
                insuranceAbi,
                signer
            )

            const tx = await contractInstance.addAsMember()
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
            updateNotification({
                id: "load-data",
                color: "teal",
                title: "Added as member Successfully",
                icon: <IconCheck size={16} />,
                autoClose: 2000,
            })
            router.reload()
        } catch (error) {
            console.log("error", error)
            updateNotification({
                id: "load-data",
                autoClose: 5000,
                title: "Unable to add as member",
                message: "Check console for more details",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            })
        }
    }

    const withdraw = async () => {
        if (userBalance == 0) {
            showNotification({
                id: "hello-there",
                autoClose: 5000,
                title: "Cannot withdraw 0 balance",
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
            title: "Withdrawing...",
            message: "Please wait...",
            autoClose: false,
            disallowClose: true,
        })
        try {
            const contractInstance = new ethers.Contract(
                router.query.insuranceAddress,
                insuranceAbi,
                signer
            )
            const tx = await contractInstance.withdraw()
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
            updateNotification({
                id: "load-data",
                color: "teal",
                title: "Withdraw Successfully",
                icon: <IconCheck size={16} />,
                autoClose: 2000,
            })
            router.reload()
        } catch (error) {
            console.log("error", error)
            updateNotification({
                id: "load-data",
                autoClose: 5000,
                title: "Unable to withdraw",
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
            <Skeleton sx={loading ? { height: "85vh" } : null} visible={loading}>
                {found ? (
                    <>
                        {/* <Button onClick={checkSigner}>Check Signer</Button> */}
                        <Text
                            // component="span"
                            align="center"
                            // variant="gradient"
                            // gradient={{ from: "red", to: "red", deg: 45 }}
                            size="xl"
                            weight={700}
                            mb="md"
                            style={{
                                fontFamily: "Greycliff CF, sans-serif",
                            }}
                        >
                            {title}
                        </Text>

                        <Text
                            // component="span"
                            align="center"
                            // variant="gradient"
                            // gradient={{ from: "red", to: "red", deg: 45 }}
                            size="md"
                            // weight={700}
                            mb="md"
                            style={{
                                fontFamily: "Greycliff CF, sans-serif",
                            }}
                        >
                            {description}
                        </Text>

                        {isUserMember == 1 && (
                            <>
                                <Center>
                                    <Button
                                        radius="xl"
                                        onClick={() => {
                                            withdraw()
                                        }}
                                    >
                                        Withdraw {userBalance} {currency}
                                    </Button>
                                </Center>
                                {active == 0 && (
                                    <Center>
                                        <Button
                                            mt="md"
                                            radius="xl"
                                            onClick={() => {
                                                setIsJoininRequestModalOpen(true)
                                            }}
                                        >
                                            You're a member. Click here to accept or reject other
                                            member requests
                                        </Button>
                                    </Center>
                                )}

                                {active == 2 && (
                                    <Center>
                                        <Button
                                            mt="md"
                                            radius="xl"
                                            onClick={() => {
                                                setIsClaimRequestModalOpen(true)
                                            }}
                                        >
                                            Make an insurance claim
                                        </Button>
                                    </Center>
                                )}
                            </>
                        )}

                        {isUserJudge == 1 && (
                            <Center>
                                <Button
                                    radius="xl"
                                    onClick={() => {
                                        setIsClaimModalOpen(true)
                                    }}
                                >
                                    You're a judge! Click here to judge
                                </Button>
                            </Center>
                        )}

                        <Center mt="lg">
                            <Badge
                                color="cyan"
                                variant="outline"
                                size="sm"
                                style={{
                                    fontFamily: "Greycliff CF, sans-serif",
                                }}
                                sx={{
                                    borderRadius: "10px",
                                    padding: "10px",
                                    fontWeight: "bold",
                                    ":hover": {
                                        cursor: "pointer",
                                    },
                                }}
                                onClick={() => {
                                    setMembersModalOpened(true)
                                }}
                            >
                                {members} members
                            </Badge>
                        </Center>
                        <Center mt="lg">
                            <Badge
                                color="green"
                                variant="outline"
                                size="sm"
                                style={{
                                    fontFamily: "Greycliff CF, sans-serif",
                                }}
                            >
                                Minimum {minMembers} members required
                            </Badge>
                        </Center>
                        <Center mt="lg">
                            <Badge
                                color="yellow"
                                variant="outline"
                                size="sm"
                                style={{
                                    fontFamily: "Greycliff CF, sans-serif",
                                }}
                            >
                                Total {judgesLength} judges will get selected
                            </Badge>
                        </Center>
                        <Center mt="lg">
                            <Badge
                                color="yellow"
                                variant="outline"
                                size="sm"
                                style={{
                                    fontFamily: "Greycliff CF, sans-serif",
                                }}
                            >
                                Judges will get {percentDivideIntoJudges}% of the total pool prize
                            </Badge>
                        </Center>
                        <Timeline active={active} bulletSize={24} lineWidth={2}>
                            <Timeline.Item
                                bullet={<IconGitBranch size={12} />}
                                title="Joining time"
                            >
                                <Text color="dimmed" size="sm">
                                    Anyone can make a joining request.
                                </Text>
                                <Text color="dimmed" size="sm">
                                    Total joining requests: {memberRequests}
                                </Text>
                                <Text size="xs" mt={4}>
                                    Ending Time:
                                    {new Date(insuranceStartTime * 1000).toLocaleString()}
                                </Text>
                            </Timeline.Item>

                            <Timeline.Item
                                bullet={<IconGitCommit size={12} />}
                                title="Insurance Started"
                            >
                                <Text color="dimmed" size="sm">
                                    Noone can make a joining request.
                                </Text>
                                <Text size="xs" mt={4}>
                                    Ending Time:
                                    {new Date(insuranceEndTime * 1000).toLocaleString()}
                                </Text>
                            </Timeline.Item>

                            <Timeline.Item
                                title="Insurance Ended"
                                bullet={<IconGitPullRequest size={12} />}
                                // lineVariant="dashed"
                            >
                                <Text color="dimmed" size="sm">
                                    Anyone can make an insurance claim request.
                                </Text>
                                <Text color="dimmed" size="sm">
                                    Total claim requests: {totalClaims}
                                </Text>
                                <Text color="dimmed" size="sm">
                                    Total claim amount requests: {totalClaimAmountRequested}{" "}
                                    {currency}
                                </Text>
                                <Text size="xs" mt={4}>
                                    Ending Time:
                                    {new Date(judgingStartTime * 1000).toLocaleString()}
                                </Text>
                            </Timeline.Item>

                            <Timeline.Item
                                title="Judging started"
                                bullet={<IconMessageDots size={12} />}
                            >
                                {isMinMembersReachedCalculated ? (
                                    isMinMembersReached ? (
                                        <Text color="dimmed" size="sm">
                                            judges are selected
                                        </Text>
                                    ) : (
                                        <Text color="dimmed" size="sm">
                                            Minimum members didn't joined. So everyone will get
                                            their amount back.
                                        </Text>
                                    )
                                ) : (
                                    <Text color="dimmed" size="sm">
                                        judges aren't selected yet
                                    </Text>
                                )}
                                <Text size="xs" mt={4}>
                                    Ending Time:
                                    {new Date(judgingEndTime * 1000).toLocaleString()}
                                </Text>
                            </Timeline.Item>

                            <Timeline.Item
                                title="Judging ended"
                                bullet={<IconMessageDots size={12} />}
                            >
                                {isFinalJudgementCalculated ? (
                                    <>
                                        <Text color="dimmed" size="sm">
                                            Final judgement is calculated
                                        </Text>
                                        {totalJudgesFullfilledJobs > 0 ? (
                                            <>
                                                <Text color="dimmed" size="sm">
                                                    Total judges who fullfilled their jobs:
                                                    {totalJudgesFullfilledJobs}. So they will get
                                                    the judging amount.
                                                </Text>
                                                {totalClaimAmountApproved > 0 ? (
                                                    <Text color="dimmed" size="sm">
                                                        Total claims accepted: {totalClaimsAccepted}
                                                    </Text>
                                                ) : (
                                                    <Text color="dimmed" size="sm">
                                                        Remaining will be distributed among all the
                                                        members
                                                    </Text>
                                                )}
                                            </>
                                        ) : (
                                            <Text color="dimmed" size="sm">
                                                No judges fullfilled their jobs. So every members
                                                except judges will get their money back.
                                            </Text>
                                        )}
                                    </>
                                ) : (
                                    <Text color="dimmed" size="sm">
                                        Final judgement isn't yet calculated.
                                    </Text>
                                )}
                            </Timeline.Item>
                        </Timeline>

                        <Center>
                            {insuranceStartTime * 1000 > Date.now() ? (
                                <>
                                    {isUserMember == 0 && (
                                        <Button radius="xl" disabled>
                                            Please wait...
                                        </Button>
                                    )}{" "}
                                    {isUserMember == 1 && (
                                        <Button radius="xl" disabled>
                                            Already a member
                                        </Button>
                                    )}{" "}
                                    {isUserMember == 2 &&
                                        (canUserAddAsMember ? (
                                            <Button
                                                radius="xl"
                                                onClick={() => {
                                                    handleAddAsMember()
                                                }}
                                            >
                                                Add as member (everyone accepted you as a member)
                                            </Button>
                                        ) : (
                                            <Button radius="xl" disabled>
                                                Wait for all members to accept your request
                                            </Button>
                                        ))}{" "}
                                    {isUserMember == 3 && (
                                        <Button
                                            radius="xl"
                                            onClick={() => {
                                                setIsJoinModalOpen(true)
                                            }}
                                        >
                                            join
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <Button color="red" radius="xl">
                                    Closed
                                </Button>
                            )}
                        </Center>
                        <Modal
                            opened={chatModalOpened}
                            size="55%"
                            overflow="inside"
                            onClose={() => setChatModalOpened(false)}
                            title="Comments"
                        >
                            <ChatBox groupId={groupId} modalOpen={chatModalOpened} />
                        </Modal>
                        <Center>
                            <Button
                                mt="md"
                                variant="outline"
                                radius="md"
                                size="md"
                                onClick={() => {
                                    setChatModalOpened(true)
                                }}
                            >
                                see comments
                            </Button>
                        </Center>
                    </>
                ) : (
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
                        Insurance not found
                    </Text>
                )}
                <Modal
                    opened={membersModalOpened}
                    onClose={() => setMembersModalOpened(false)}
                    title="Members"
                    overflow="inside"
                >
                    <Members
                        contractAddress={router.query.insuranceAddress}
                        totalMembers={members}
                    />
                </Modal>
                <Modal
                    opened={isJoininRequestModalOpen}
                    onClose={() => setIsJoininRequestModalOpen(false)}
                    title="Member requests"
                    overflow="inside"
                >
                    <MemberRequests
                        contractAddress={router.query.insuranceAddress}
                        totalRequests={memberRequests}
                    />
                </Modal>
                <Modal
                    opened={isClaimModalOpen}
                    onClose={() => setIsClaimModalOpen(false)}
                    title="Claim requests"
                    size="70%"
                    overflow="inside"
                >
                    <ClaimRequests
                        contractAddress={router.query.insuranceAddress}
                        totalClaimRequests={totalClaims}
                    />
                </Modal>
                <Modal
                    opened={isJoinModalOpen}
                    onClose={() => setIsJoinModalOpen(false)}
                    title="Members"
                    overflow="inside"
                >
                    <Textarea
                        label="Description"
                        placeholder="Your description"
                        mt="md"
                        autosize
                        minRows={2}
                        maxRows={4}
                        value={joiningDescription}
                        onChange={(event) => setJoiningDescription(event.currentTarget.value)}
                    />
                    <Button
                        radius="xl"
                        onClick={() => {
                            handleJoinRequestClick()
                        }}
                    >
                        Get now
                    </Button>
                </Modal>
                <Modal
                    opened={isClaimRequestModalOpen}
                    onClose={() => setIsClaimRequestModalOpen(false)}
                    title="Members"
                    overflow="inside"
                >
                    <Textarea
                        label="Description"
                        placeholder="Your description"
                        mt="md"
                        autosize
                        minRows={2}
                        maxRows={4}
                        value={claimDescription}
                        onChange={(event) => setClaimDescription(event.currentTarget.value)}
                    />
                    <TextInput
                        label="Claim Amount"
                        required
                        placeholder={"Claim Amount"}
                        mt="md"
                        value={claimAmount}
                        // type="number"
                        min={0}
                        step="1"
                        onChange={(event) => {
                            setClaimAmount(event.target.value)
                        }}
                    />
                    <Button
                        radius="xl"
                        onClick={() => {
                            handleClaimRequestClick()
                        }}
                    >
                        Get now
                    </Button>
                </Modal>
            </Skeleton>
        </>
    )
}

export default InsurancePage
