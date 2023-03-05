import React, { useEffect, useState } from "react"
import InsuranceCard from "./InsuranceCard"
import { createStyles, SimpleGrid, Card, Image, Text, Container, AspectRatio } from "@mantine/core"

function Insurances({ insurances }) {
    return (
        <>
            <Container py="xl">
                <SimpleGrid cols={3} breakpoints={[{ maxWidth: "md", cols: 1 }]}>
                    {insurances.length > 0 ? (
                        insurances.map((insurance, index) => (
                            <InsuranceCard key={index} insurance={insurance} />
                        ))
                    ) : (
                        <Text>There are no insurances to show</Text>
                    )}
                </SimpleGrid>
            </Container>
        </>
    )
}

export default Insurances
