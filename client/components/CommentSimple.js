import { createStyles, Text, Avatar, Group } from "@mantine/core"

const useStyles = createStyles((theme) => ({
    body: {
        paddingLeft: 54,
        paddingTop: theme.spacing.sm,
    },
}))

export function CommentSimple({ id, postedAt, body, chatOwnerAddress, userAddress }) {
    const { classes } = useStyles()
    return (
        <div
            style={
                userAddress &&
                chatOwnerAddress &&
                userAddress.toLowerCase() === chatOwnerAddress.toLowerCase()
                    ? {
                          textAlign: "right",
                          width: "100%",
                      }
                    : {
                          textAlign: "left",
                          width: "100%",
                      }
            }
        >
            <Group>
                <div
                    style={
                        userAddress &&
                        chatOwnerAddress &&
                        userAddress.toLowerCase() === chatOwnerAddress.toLowerCase()
                            ? {
                                  textAlign: "right",
                                  width: "100%",
                              }
                            : {
                                  textAlign: "left",
                                  width: "100%",
                              }
                    }
                >
                    <Text size="sm" color="dimmed">
                        {chatOwnerAddress}
                    </Text>
                    <Text size="xs" color="dimmed">
                        {postedAt}
                    </Text>
                </div>
            </Group>
            <Text size="sm">{body}</Text>
        </div>
    )
}
