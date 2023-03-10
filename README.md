# Insurely

## Details

A decentralised p2p insurance and a trading platform.

All the funds in the insurance pool can be used to provide liquidity to the exchange.
And if opted to use pool funds in liquidity, rate of native token to liquidity token will be considered as rate at the time of removing liquidity from the exchange. So the exchange will act as a price oracle. Liquidity will be removed after judging period is over. And Liquidity will be keep on adding as members joins.

Any user can become liquidity provider in general and can use Exchange to swap tokens.

Exchange fees is 1% which will be divided among liquidity providers.

Every user can create an insurance contract, which will have following informations:

1. Title
2. Description
3. Minimum members
4. Time after which no new user can enter and insurance will start
5. validity, that is for how long insurance will remains
6. claim time: that is for how long after insurance ended, can a user make an insurance claim for their loss.
7. Percentage divided among judges
8. judging time: how much time will judge get to judge all the claims.

After an insurance contract is created, anyone who wants join a particular contract is supposed to send a request for membership. If every member of that contract accept the request then the user can add himself to the contract.

Judges are selected using chainlink oracles, one for getting random numbers to select judges randomly and other to perform function after certain period which is also done using oracles. So custom logic based automation + random number is used from chainlink oracles.

If no judges had fullfilled their jobs then everyone except those judges will get their fund inside the pool back. If no claim have majority votes then judges who didn't fullfilled won't get their funds back and everyone else will get their funds back. If claim request is fullfilled then remaining amount is distributed among all the members. Also first judges get their percentage from total pool amount as a prize for fullfilling their job.
[Fullfillment logic in smart contract](https://github.com/Ahmed-Aghadi/insurely/blob/main/smart_contracts/contracts/Insurance.sol#L336)

All contracts are deployed on fantom testnet.
[smart contract address](https://github.com/Ahmed-Aghadi/insurely/blob/main/client/constants/contractAddress.json)


#### Smart Contracts

[Insurance Factory](https://testnet.ftmscan.com/address/0x3A8bB33E60ca28fA6b27F69A763a5978259f75E2)

[Exchange Factory](https://testnet.ftmscan.com/address/0x7Fc29F9cFAD302505B7Ece08eB94bd2f209bb6A3)

[Test Token](https://testnet.ftmscan.com/address/0x5452fD02e04Abc7101588014BB7A44d1e761e261)


| Tech stack used           |
| ------------------------- |
| [Fantom](#fantom)         |
| [Chainlink](#chainlink)   |
| [Mantine UI](#mantine-ui) |

## Deployements

Deployed website at Vercel: [Insurely](https://insurely.vercel.app/)

## Getting Started

To run frontend :

```bash
cd client/my-app

yarn run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

To deploy smart contracts to localhost :

```bash
cd smart_contracts/

yarn hardhat deploy --network localhost
```

## Sponsors Used

### Fantom

All the smart contracts are deployed on fantom testnet.

#### Atleast one example:

[Deployements](https://github.com/Ahmed-Aghadi/insurely/tree/main/smart_contracts/deployments/fantomtest)

[Smart Contracts](https://github.com/Ahmed-Aghadi/insurely/tree/main/smart_contracts/contracts)

### Chainlink

Chainlink was used to randomly select an image out of all images of the post while also considering rarities assigned while minting.

#### Atleast one example:

[perform upkeep](https://github.com/Ahmed-Aghadi/insurely/blob/main/smart_contracts/contracts/Factory.sol#L97)

[fulfill random words](https://github.com/Ahmed-Aghadi/insurely/blob/main/smart_contracts/contracts/Factory.sol#L113)

### Mantine UI

Mantine ui was heavily used in front end for styling.
