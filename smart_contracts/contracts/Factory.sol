// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./Insurance.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

contract Factory is AutomationCompatibleInterface, VRFConsumerBaseV2 {
    struct ContractInfo {
        address contractAddress;
        uint256 judgingStartTime;
        uint256 judgingEndTime;
    }
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;

    address private immutable i_exchangeFactoryAddress;

    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    mapping(uint256 => address) private s_requestIdToContractAddress;

    // address[] private s_insuranceContracts;
    ContractInfo[] private s_contractInfos;

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane, // keyH
        uint32 callbackGasLimit,
        address exchangeFactoryAddress // address of exchange factory contract
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        i_exchangeFactoryAddress = exchangeFactoryAddress;
    }

    function createInsurance(
        string memory baseUri,
        uint256 minMembers,
        uint256 requestTime, // (in seconds) time before one can make a request
        uint256 validity, // (in seconds) insurance valid after startBefore seconds and user can claim insurance after validity
        uint256 claimTime, // (in seconds) time before use can make a insurance claim request, after this time judging will start.
        uint256 judgingTime, // (in seconds) time before judges should judge insurance claim requests.
        uint256 judgesLength, // number of judges
        uint256 amount, // amount everyone should put in the pool
        uint256 percentDivideIntoJudges, // percent of total pool amount that should be divided into judges (total pool amount = amount * members.length where members.length == s_memberNumber - 1) (only valid for judges who had judged every claim request)
        bool useLiquidityPool, // if true, the insurance contract will add funds to liquidity pool
        address liquidityTokenAddress, // address of liquidity token
        uint256 liquidityTokenAmount, // amount of liquidity token to add to liquidity pool
        string memory groupId
    ) public payable returns (address) {
        Insurance newInsurance = new Insurance(
            baseUri,
            minMembers,
            requestTime,
            validity,
            claimTime,
            judgingTime,
            judgesLength,
            amount,
            percentDivideIntoJudges,
            i_exchangeFactoryAddress,
            useLiquidityPool,
            liquidityTokenAddress,
            liquidityTokenAmount,
            groupId
        );

        uint256 judgingStartTime = block.timestamp + requestTime + validity + claimTime;

        // s_insuranceContracts.push(address(newInsurance));
        uint256 judgingEndTime = judgingStartTime + judgingTime;

        s_contractInfos.push(ContractInfo(address(newInsurance), judgingStartTime, judgingEndTime));
        return address(newInsurance);
    }

    // Assumes the subscription is funded sufficiently.
    function getRandomNumbers(address contractAddress) public payable returns (uint256 requestId) {
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        s_requestIdToContractAddress[requestId] = contractAddress;
    }

    function performUpkeep(bytes calldata performData) external override {
        (uint256 index, uint256 which) = abi.decode(performData, (uint256, uint256));
        address contractAddress = s_contractInfos[index].contractAddress;
        if (which == 0) {
            s_contractInfos[index].judgingStartTime = 0;
            getRandomNumbers(contractAddress);
            return;
        }
        s_contractInfos[index].judgingEndTime = 0;
        Insurance(contractAddress).fullfillRequests();
    }

    /**
     * @dev This is the function that Chainlink VRF node
     * calls.
     */
    function fulfillRandomWords(
        uint256 requestId /* requestId */,
        uint256[] memory randomWords
    ) internal override {
        Insurance insurance = Insurance(s_requestIdToContractAddress[requestId]);
        insurance.selectJudges(randomWords[0]);
    }

    function checkUpkeep(
        bytes calldata /* checkData */
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = false;
        for (uint256 i = 0; i < s_contractInfos.length; i++) {
            if (
                s_contractInfos[i].judgingStartTime != 0 &&
                s_contractInfos[i].judgingStartTime < block.timestamp &&
                s_contractInfos[i].judgingEndTime > block.timestamp
            ) {
                upkeepNeeded = true;
                performData = abi.encode(i, 0); // index, which (0 = getRandomNumbers for selecting judges, 1 = fullfillRequests for fullfilling insurance claim requests)
                break;
            }
            if (
                s_contractInfos[i].judgingEndTime != 0 &&
                s_contractInfos[i].judgingEndTime < block.timestamp
            ) {
                upkeepNeeded = true;
                performData = abi.encode(i, 1);
                break;
            }
        }
    }

    function getContracts() public view returns (ContractInfo[] memory) {
        return s_contractInfos;
    }

    function getContractsLength() public view returns (uint256) {
        return s_contractInfos.length;
    }

    function getContract(uint256 index) public view returns (ContractInfo memory) {
        return s_contractInfos[index];
    }

    // function getContractAddress(uint256 index) public view returns (address) {
    //     return s_contractInfos[index].contractAddress;
    // }
}
