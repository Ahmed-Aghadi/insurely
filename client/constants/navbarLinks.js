import {
    IconHome2,
    IconGauge,
    IconCirclePlus,
    IconMessages,
    IconCash,
    IconWallet,
} from "@tabler/icons"

export default [
    // { path: "profile", props: { icon: IconGauge, label: "Your Profile" } },
    {
        path: "upload",
        props: { icon: IconCirclePlus, label: "Create" },
    },
    { path: "", props: { icon: IconHome2, label: "Home" } },
    { path: "exchange", props: { icon: IconCash, label: "Exchange" } },
    { path: "faucet", props: { icon: IconWallet, label: "Faucet" } },
    // { path: "messages", props: { icon: IconMessages, label: "Messages" } },
]
