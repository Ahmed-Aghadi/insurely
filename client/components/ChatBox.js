import React, { useEffect, useRef, useState } from "react"
import {
    createStyles,
    SimpleGrid,
    Card,
    Image,
    Text,
    Container,
    AspectRatio,
    Button,
    TextInput,
    ScrollArea,
    Skeleton,
    Input,
    Stack,
    Center,
} from "@mantine/core"
import { Orbis } from "@orbisclub/orbis-sdk"
import { useAccount, useSigner } from "wagmi"
import { IconSend } from "@tabler/icons"
import { CommentSimple } from "./CommentSimple"

function ChatBox({ groupId, modalOpen }) {
    const { isConnected, address } = useAccount()
    const { data: signer, isError, isLoading } = useSigner()
    const [typedMessage, setTypedMessage] = useState("")
    const [chats, setChats] = useState([])
    const [isMessageLoading, setIsMessageLoading] = useState(true)
    const bottomScrollRef = useRef()

    useEffect(() => {
        getMessages()
    }, [address, modalOpen])
    useEffect(() => {
        scrollToBottom()
    }, [isMessageLoading, bottomScrollRef])

    const scrollToBottom = () => {
        if (bottomScrollRef.current) {
            bottomScrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }

    // const createGroup = async () => {
    //     let orbis = new Orbis()
    //     let resIsConnect = await orbis.isConnected()
    //     if (resIsConnect.status !== 200) {
    //         let resConnect = await orbis.connect()
    //         console.log("resConnect", resConnect)
    //         if (resConnect.status !== 200) {
    //             return
    //         }
    //     }
    //     let resCreateGroup = await orbis.createGroup({
    //         pfp: "https://bafybeidnpzpfwzrby3xttaugdqxfszc6wgokh3lbjwr4jqt26v2fuf66da.ipfs.dweb.link/image",
    //         name: "Test Group 1",
    //     })
    //     console.log("resCreateGroup", resCreateGroup)
    //     // resCreateGroup {status: 200, doc: 'kjzl6cwe1jw149dblylqsgnu4uwiom7wqqrfvb7o42u8yr6e4osk06aeg830jvo', result: 'Success creating TileDocument.'}
    //     //         _result: {status: 200, result: 'Indexed stream with success.', stream: 'kjzl6cwe1jw149dblylqsgnu4uwiom7wqqrfvb7o42u8yr6e4osk06aeg830jvo'}
    //     // index.js?45bf:29 Indexed kjzl6cwe1jw149dblylqsgnu4uwiom7wqqrfvb7o42u8yr6e4osk06aeg830jvo with success.
    // }
    // const checkConnected = async () => {
    //     let orbis = new Orbis()
    //     let resIsConnect = await orbis.isConnected()
    //     console.log("resConnect", resIsConnect)
    //     console.log({ groupId })
    // }

    const sendMessage = async () => {
        const msg = typedMessage
        if (msg === "") return
        console.log("msg", msg)
        setTypedMessage("")
        let orbis = new Orbis()
        let resIsConnect = await orbis.isConnected()
        if (resIsConnect.status !== 200) {
            let resConnect = await orbis.connect()
            if (resConnect.status !== 200) {
                return
            }
        }
        try {
            let resSetMember = await orbis.setGroupMember(groupId, true)
            console.log("resSetMember", resSetMember)
        } catch (error) {
            console.log("error", error)
        }
        let resSendMessage = await orbis.createPost({
            context: groupId,
            body: msg,
        })
        console.log("resSendMessage", resSendMessage)
        setTimeout(() => getMessages(), 250)
        setTimeout(() => getMessages(), 500)
        setTimeout(() => getMessages(), 750)
    }

    const getMessages = async () => {
        let orbis = new Orbis()
        let resIsConnect = await orbis.isConnected()
        if (resIsConnect.status !== 200) {
            let resConnect = await orbis.connect()
            if (resConnect.status !== 200) {
                return
            }
        }
        let { data: resGetMessages, error } = await orbis.getPosts({
            context: groupId,
        })
        if (!error) {
            resGetMessages.reverse()
            setChats((oldMessages) => {
                if (oldMessages.length !== resGetMessages.length) {
                    setTimeout(() => {
                        scrollToBottom()
                    }, 250)
                }
                return resGetMessages
            })
        } else {
            console.log("error", error)
        }
        console.log("resGetMessages", resGetMessages)
        setIsMessageLoading(false)
    }

    const messageSkeletons = Array(8).fill(
        <>
            <Skeleton style={{ marginLeft: "0px" }} height={25} width="40%" radius="xl" mt={15} />
            <Skeleton style={{ marginLeft: "auto" }} height={25} width="40%" radius="xl" mt={15} />
        </>
    )

    return (
        <div style={{ position: "relative", paddingRight: "10px" }}>
            <ScrollArea style={{ width: "100%", height: "100%" }} type="never">
                {isMessageLoading ? (
                    messageSkeletons
                ) : (
                    <Stack mb="lg">
                        {chats.length !== 0 ? (
                            chats.map((chat, index) => {
                                return (
                                    <CommentSimple
                                        key={chat.stream_id}
                                        body={chat.content.body}
                                        postedAt={new Date(chat.timestamp * 1000).toLocaleString()}
                                        chatOwnerAddress={chat.creator_details.metadata.address}
                                        userAddress={address}
                                    />
                                )
                            })
                        ) : (
                            <Center m="lg">
                                <Text size="xl">No comments yet</Text>
                            </Center>
                        )}
                        <div ref={bottomScrollRef} />
                    </Stack>
                )}
            </ScrollArea>
            <div
                style={{
                    position: "fixed",
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "50%",
                    marginBottom: "10px",
                }}
            >
                <Input
                    mt="md"
                    placeholder="Enter message"
                    value={typedMessage}
                    onChange={(e) => {
                        // console.log(e.target.value)
                        setTypedMessage(e.target.value)
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            console.log("Enter")
                            sendMessage()
                        }
                    }}
                    rightSection={
                        <div>
                            <IconSend size={18} style={{ display: "block", opacity: 0.5 }} />
                        </div>
                    }
                />
            </div>
        </div>
    )
}

export default ChatBox
