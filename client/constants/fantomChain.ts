import { Chain } from "wagmi"

export const fantomChain: Chain = {
    id: 4002,
    name: "Fantom Testnet",
    network: "Fantom Testnet",
    nativeCurrency: {
        name: "Binance Chain Native Token",
        symbol: "FTM",
        decimals: 18,
    },
    rpcUrls: {
        default: process.env.NEXT_PUBLIC_FANTOM_TESTNET_RPC_URL!,
    },
    blockExplorers: {
        default: { name: "Ftmscan", url: "https://testnet.ftmscan.com" },
    },
    testnet: true,
}
