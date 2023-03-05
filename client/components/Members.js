import { useEffect, useState } from "react"
import { createStyles, Table, ScrollArea } from "@mantine/core"
import { insuranceAbi } from "../constants"
import { useAccount, useSigner } from "wagmi"
import { ethers } from "ethers"

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

export function Members({ contractAddress, totalMembers }) {
    const { classes, cx } = useStyles()
    const [scrolled, setScrolled] = useState(false)
    const [members, setMembers] = useState([])

    const { isConnected } = useAccount()
    const { data: signer, isError, isLoading } = useSigner()

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
        fetchMembers()
    }, [])

    const fetchMembers = async () => {
        const contractInstance = new ethers.Contract(
            contractAddress,
            insuranceAbi,
            signer
                ? signer
                : ethers.getDefaultProvider(process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL)
        )

        for (let i = 0; i < totalMembers; i++) {
            const member = await contractInstance.getMemberById(i)
            setMembers((members) => [...members, member])
        }
        // setMembers([
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        //     "0x0000000000000000000000000000000000000000",
        // ])
    }

    const rows = members.map((member) => (
        <tr key={member}>
            <td>{member}</td>
        </tr>
    ))

    return (
        <Table>
            <thead className={cx(classes.header, { [classes.scrolled]: scrolled })}>
                <tr>
                    <th>Account Address</th>
                </tr>
            </thead>
            <tbody>{rows}</tbody>
        </Table>
    )
}
