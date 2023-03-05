import Head from "next/head"
import Image from "next/image"
import styles from "../styles/Home.module.css"
import { ethers } from "ethers"
import { AppShell, Navbar, Header } from "@mantine/core"
import { NavbarMinimal } from "../components/Navigation"
import { useAccount, useSigner } from "wagmi"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { factoryAbi, factoryContractAddress } from "../constants"
import Insurances from "../components/Insurances"

export default function Home() {
    const { isConnected } = useAccount()
    const router = useRouter()
    const { data: signer, isError, isLoading } = useSigner()

    const [insurances, setInsurances] = useState([])

    useEffect(() => {
        setInsurances([])
        fetchInsurances()
    }, [])

    const fetchInsurances = async () => {
        console.log("retrieving insurances")
        const contractInstance = new ethers.Contract(
            factoryContractAddress,
            factoryAbi,
            ethers.getDefaultProvider(process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL)
        )
        const data = await contractInstance.getContracts()
        setInsurances(data)
        console.log("data", data)
    }

    return (
        <div className={styles.container}>
            <Insurances insurances={insurances} />
        </div>
    )
}
