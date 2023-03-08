import { Tabs } from "@mantine/core"
import { IconArrowsExchange, IconCirclePlus, IconDroplet, IconDropletFilled } from "@tabler/icons"
import AddLiquidity from "../components/AddLiquidity"
import CreateExchange from "../components/CreateExchange"
import RemoveLiquidity from "../components/RemoveLiquidity"
import Swap from "../components/Swap"
import "../styles/Home.module.css"

export default function Home() {
    return (
        <Tabs defaultValue="swap">
            <Tabs.List>
                <Tabs.Tab value="swap" icon={<IconArrowsExchange size="1.2rem" />}>
                    Swap
                </Tabs.Tab>
                <Tabs.Tab value="add" icon={<IconDropletFilled size="1.2rem" />}>
                    Add liquidity
                </Tabs.Tab>
                <Tabs.Tab value="remove" icon={<IconDroplet size="1.2rem" />}>
                    Remove liquidity
                </Tabs.Tab>
                <Tabs.Tab value="create" icon={<IconCirclePlus size="1.2rem" />}>
                    Create exchange
                </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="swap" pt="xs">
                <Swap />
            </Tabs.Panel>

            <Tabs.Panel value="add" pt="xs">
                <AddLiquidity />
            </Tabs.Panel>

            <Tabs.Panel value="remove" pt="xs">
                <RemoveLiquidity />
            </Tabs.Panel>

            <Tabs.Panel value="create" pt="xs">
                <CreateExchange />
            </Tabs.Panel>
        </Tabs>
    )
}
