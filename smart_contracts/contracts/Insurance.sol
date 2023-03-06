// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IExchange {
    function addLiquidity(uint256 _tokenAmount) external payable returns (uint256);

    function removeLiquidity(uint256 _amount) external returns (uint256, uint256);
}

interface IExchangeFactory {
    function getExchange(address _tokenAddress) external returns (address);
}

error WithdrawFailed();

// rate of native token to liquidity token will be considered as rate at the time of removing liquidity from the exchange. So exchange will act as a price oracle.

contract Insurance is Ownable {
    struct MemberRequest {
        address memberAddress;
        string requestUri;
        uint256 accepted;
    }

    struct InsuranceClaimRequest {
        address memberAddress;
        string requestUri;
        uint256 amount;
        uint256 accepted;
    }

    // struct Acceptance {
    //     address memberAddress; // member address who will accept joining requests or judge address who will accept claims
    //     uint256 id;
    // }

    struct Judgement {
        bool accepted;
        string reasonUri;
    }

    struct ClaimAccepted {
        uint256 claimId;
        uint256 amount;
    }

    struct JudgementJobFullfilled {
        uint256 judgeId;
        uint256 amount; // amount judge will get
    }

    string private s_baseUri;
    uint256 private immutable i_minMembers;
    uint256 private immutable i_requestBefore;
    uint256 private immutable i_validity;
    uint256 private immutable i_judgingStartTime;
    uint256 private immutable i_judgingEndTime;
    uint256 private immutable i_judgesLength;
    uint256 private immutable i_amount;
    uint256 private immutable i_percentageDividedIntoJudges;
    address private immutable i_exchangeFactoryAddress;
    address private immutable i_exchangeAddress;
    bool private immutable i_useLiquidityPool;
    address private immutable i_liquidityTokenAddress;
    uint256 private immutable i_liquidityTokenAmount;
    string private s_groupId;
    bool private s_isMinMembersReachedCalculated; // also isJudges selected
    bool private s_isMinMembersReached;
    uint256 private s_totalClaimAmountRequested;
    uint256 private s_totalClaimAmountAccepted;
    bool private s_isFinalJudgementCalculated;
    // bool private s_isAnyClaimAccepted = s_claimAccepted.length > 0;
    // bool private s_isAnyJudgementFullfilledJob == s_judgesFullfilledJobs.length > 0;
    uint256 private s_memberNumber = 1; // total members exists + 1
    mapping(uint256 => address) private s_idToMemberAddress; // memberNumber (id) => s_memberAddresses
    mapping(address => uint256) private s_addressToMemberId; // memberAddress => memberNumber (id)
    uint256 private s_requestNumber = 1; // total requests exists + 1
    mapping(address => uint256) private s_addressToRequestId; // memberAddress => requestNumber (id)
    mapping(uint256 => MemberRequest) private s_idToMemberRequest; // request id number => request
    mapping(bytes => bool) private s_memberRequestAcceptances; // abi.encode(Acceptance) => member request accepted or not
    uint256 private s_claimNumber = 1; // total claims exists + 1
    mapping(address => uint256) s_addressToClaimId; // memberAddress => Insurance claimId
    mapping(uint256 => InsuranceClaimRequest) s_idToClaimRequest; // Insurance claimId => request
    mapping(address => uint256) s_addressToJudgeId; // memberAddress => Insurance claimId (even judge id starts from 1)
    mapping(uint256 => address) s_idToJudgeAddress; // Insurance claimId => memberAddress (even judge id starts from 1)
    mapping(bytes => Judgement) private s_judgements; // abi.encode(Acceptance) => accepted or not + reason
    mapping(address => uint256) private s_judged; // judge address => number of judgement

    JudgementJobFullfilled[] private s_judgesFullfilledJobs; // judges who fullfilled their job that is judged everyone && obviously index starts from 0
    ClaimAccepted[] private s_claimAccepted; // claims which are accepted that more than half of judges has accepted && obviously index starts from 0

    // here balance is in native token | refer withdraw function for more details
    mapping(address => uint256) private s_balance; // member address => balance (after claim accepted)

    constructor(
        string memory baseUri,
        uint256 minMembers,
        uint256 requestTime, // (in seconds) time before one can make a request
        uint256 validity, // (in seconds) insurance valid after requestTime seconds and user can claim insurance after validity
        uint256 claimTime, // (in seconds) time before use can make a insurance claim request, after this time judging will start.
        uint256 judgingTime, // (in seconds) time before judges should judge insurance claim requests.
        uint256 judgesLength, // number of judges
        uint256 amount, // amount everyone should put in the pool
        uint256 percentDivideIntoJudges, // percent of total pool amount that should be divided into judges (total pool amount = amount * members.length where members.length == s_memberNumber - 1) (only valid for judges who had judged every claim request)
        address exchangeFactoryAddress, // address of exchange factory contract
        bool useLiquidityPool, // if true, the insurance contract will add funds to liquidity pool
        address liquidityTokenAddress, // address of liquidity token
        uint256 liquidityTokenAmount, // amount of liquidity token to add to liquidity pool
        string memory groupId
    ) {
        require(minMembers > 0, "Insurance: minMembers should be greater than 0");
        require(requestTime > 0, "Insurance: requestTime should be greater than 0");
        require(validity > 0, "Insurance: validity should be greater than 0");
        require(claimTime > 0, "Insurance: judgingStartTime should be greater than 0");
        require(judgingTime > 0, "Insurance: judgingTime should be greater than 0");
        require(judgesLength > 0, "Insurance: judgesLength should be greater than 0");
        require(
            judgesLength <= minMembers,
            "Insurance: judgesLength should be less than or equal to minMembers"
        );
        require(amount > 0, "Insurance: amount should be greater than 0");
        require(
            percentDivideIntoJudges > 0,
            "Insurance: percentDivideIntoJudges should be greater than 0"
        );
        require(
            percentDivideIntoJudges <= 100,
            "Insurance: percentDivideIntoJudges should be less than or equal to 100"
        );
        require(
            exchangeFactoryAddress != address(0),
            "Insurance: exchangeFactoryAddress should not be 0x0"
        );
        require(
            useLiquidityPool == false || liquidityTokenAddress != address(0),
            "Insurance: liquidityTokenAddress should not be 0x0"
        );
        require(
            useLiquidityPool == false || liquidityTokenAmount > 0,
            "Insurance: liquidityTokenAmount should be greater than 0"
        );

        s_baseUri = baseUri;
        i_minMembers = minMembers;
        i_requestBefore = block.timestamp + requestTime;
        i_validity = i_requestBefore + validity;
        i_judgingStartTime = i_validity + claimTime;
        i_judgingEndTime = i_judgingStartTime + judgingTime;
        i_judgesLength = judgesLength;
        i_amount = amount;
        i_percentageDividedIntoJudges = percentDivideIntoJudges;
        i_exchangeFactoryAddress = exchangeFactoryAddress;
        i_exchangeAddress = useLiquidityPool
            ? IExchangeFactory(exchangeFactoryAddress).getExchange(liquidityTokenAddress)
            : address(0);
        require(
            useLiquidityPool == false || i_exchangeAddress != address(0),
            "Insurance: exchangeAddress should not be 0x0, try creating exchange in exchange factory first"
        );
        i_useLiquidityPool = useLiquidityPool;
        i_liquidityTokenAddress = liquidityTokenAddress;
        i_liquidityTokenAmount = liquidityTokenAmount;
        s_groupId = groupId;
    }

    // function getBaseUri() public view returns (string memory) {
    //     return s_baseUri;
    // }

    // function getMemberNumber(address memberAddress) public view returns (uint256) {
    //     return s_addressToMemberId[memberAddress];
    // }

    // function getMemberAddress(uint256 memberNumber) public view returns (address) {
    //     return s_idToMemberAddress[memberNumber];
    // }

    // function getMemberCount() public view returns (uint256) {
    //     return s_memberNumber - 1;
    // }

    // function getRequestNumber() public view returns (uint256) {
    //     return s_requestNumber - 1;
    // }

    // function getRequest(uint256 requestId) public view returns (MemberRequest memory) {
    //     return s_idToRequest[requestId];
    // }

    // function getAcceptance(uint256 requestId, address memberAddress) public view returns (bool) {
    //     return s_acceptances[Acceptance(memberAddress, requestId)];
    // }

    // function getClaimNumber() public view returns (uint256) {
    //     return s_claimNumber - 1;
    // }

    function addAsMember() public {
        require(block.timestamp < i_requestBefore, "Adding member is not valid anymore");
        require(s_addressToMemberId[msg.sender] == 0, "Already a member");
        require(
            s_idToMemberRequest[s_addressToRequestId[msg.sender]].accepted == s_memberNumber - 1,
            "Not all members accepted the request"
        );
        uint256 id = s_addressToRequestId[msg.sender];
        s_idToMemberRequest[id] = MemberRequest(address(0), "", 0);
        s_addressToRequestId[msg.sender] = 0;

        s_idToMemberAddress[s_memberNumber] = msg.sender;
        s_addressToMemberId[msg.sender] = s_memberNumber;
        s_memberNumber++;

        // add funds to liquidity pool
        if (i_useLiquidityPool) {
            uint tokenReserve = IERC20(i_liquidityTokenAddress).balanceOf(address(this));
            uint exchangeTokenReserve = IERC20(i_liquidityTokenAddress).balanceOf(
                i_exchangeAddress
            );
            uint balance = address(this).balance;
            if (exchangeTokenReserve == 0) {
                IExchange(i_exchangeAddress).addLiquidity{value: balance}(tokenReserve);
            } else {
                uint exchangeBalance = address(i_exchangeAddress).balance;
                if (tokenReserve * exchangeBalance >= exchangeTokenReserve * balance) {
                    IExchange(i_exchangeAddress).addLiquidity{value: balance}(tokenReserve);
                } else {
                    uint amount = (tokenReserve * exchangeBalance) / exchangeTokenReserve;
                    IExchange(i_exchangeAddress).addLiquidity{value: amount}(tokenReserve);
                }
            }
        }
    }

    // function addRequest(string memory requestUri) public {
    //     s_requests[s_requestNumber] = MemberRequest(msg.sender, requestUri, new uint256[](0));
    //     s_requestNumber++;
    // }

    function acceptJoiningRequest(uint256 requestId) public {
        require(s_addressToMemberId[msg.sender] != 0, "Not a member");
        require(
            s_idToMemberRequest[requestId].memberAddress != address(0),
            "Request does not exist"
        );
        require(
            s_memberRequestAcceptances[abi.encode(msg.sender, requestId)] == false,
            "Already accepted"
        );
        s_memberRequestAcceptances[abi.encode(msg.sender, requestId)] = true;
        s_idToMemberRequest[requestId].accepted += 1;
    }

    function makeJoiningRequest(string memory uri) public payable {
        require(msg.value == i_amount, "Amount sent isn't correct");
        require(block.timestamp < i_requestBefore, "Adding member is not valid anymore");
        require(s_addressToMemberId[msg.sender] == 0, "Member already exists");
        require(s_addressToRequestId[msg.sender] == 0, "Request already exists");
        if (i_useLiquidityPool) {
            IERC20 token = IERC20(i_liquidityTokenAddress);
            token.transferFrom(msg.sender, address(this), i_liquidityTokenAmount);
        }
        s_idToMemberRequest[s_requestNumber] = MemberRequest(msg.sender, uri, 0);
        s_addressToRequestId[msg.sender] = s_requestNumber;
        s_requestNumber++;
    }

    // here amount is in native token
    function requestForInsurance(string memory baseUri, uint256 amount) public {
        require(block.timestamp > i_validity, "Contract is not valid anymore");
        require(block.timestamp < i_judgingStartTime, "Judging already started");
        require(s_addressToMemberId[msg.sender] != 0, "Not a member");
        require(s_addressToClaimId[msg.sender] == 0, "Insurance already exists");
        s_addressToClaimId[msg.sender] = s_claimNumber;
        s_idToClaimRequest[s_claimNumber] = InsuranceClaimRequest(msg.sender, baseUri, amount, 0);
        s_totalClaimAmountRequested += amount;
        s_claimNumber++;
    }

    // judges will judge insurance claim requests
    function updateInsurance(uint256 claimId, bool accepted, string memory reasonUri) public {
        require(block.timestamp > i_judgingStartTime, "Judging not started yet");
        require(block.timestamp < i_judgingEndTime, "Judging already ended");
        require(s_addressToJudgeId[msg.sender] != 0, "Not a judge");
        require(
            s_idToClaimRequest[claimId].memberAddress != address(0),
            "Insurance does not exist"
        );
        if (
            (s_judgements[abi.encode(msg.sender, claimId)].accepted == false &&
                bytes(reasonUri).length != 0) ||
            (s_judgements[abi.encode(msg.sender, claimId)].accepted == true)
        ) {
            revert("Already updated");
        }
        if (!accepted) {
            require(bytes(reasonUri).length != 0, "Reason uri is empty");
        }
        s_judgements[abi.encode(msg.sender, claimId)] = Judgement(accepted, reasonUri);
        if (accepted) {
            s_idToClaimRequest[claimId].accepted += 1;
        }
        s_judged[msg.sender] += 1;
    }

    function selectJudges(uint256 randomNumber) public onlyOwner {
        require(block.timestamp > i_judgingStartTime, "Judging not started yet");
        require(block.timestamp < i_judgingEndTime, "Judging already ended");
        require(s_isMinMembersReachedCalculated == false, "Judges already selected");
        if (!s_isMinMembersReachedCalculated && s_memberNumber - 1 < i_minMembers) {
            s_isMinMembersReachedCalculated = true;
            s_isMinMembersReached = false;
            for (uint256 i = 1; i < s_memberNumber; i++) {
                s_balance[s_idToMemberAddress[i]] += i_amount;
            }
            return;
        }
        s_isMinMembersReachedCalculated = true;
        s_isMinMembersReached = true;
        uint256 index = randomNumber % (s_memberNumber - 1);
        for (uint256 i = 1; i <= i_judgesLength; i++) {
            address judgeAddress = s_idToMemberAddress[index + i]; // as index for member starts from 1
            if (s_addressToJudgeId[judgeAddress] != 0) {
                i--;
                index = (index + index + i + 1) % (s_memberNumber - 1); // 2 * index + 1
                continue;
            }
            index = (index + index + i) % (s_memberNumber - 1); // 2 * index + 1
            s_addressToJudgeId[judgeAddress] = i;
            s_idToJudgeAddress[i] = judgeAddress;
        }
    }

    function fullfillRequests() public {
        require(block.timestamp > i_judgingEndTime, "Judging not ended yet");
        require(s_isFinalJudgementCalculated == false, "Already fullfilled");

        uint256 amountPerMember = i_amount; // in native token
        // remove liquidity from pool
        if (i_useLiquidityPool) {
            IExchange(i_exchangeAddress).removeLiquidity(
                IERC20(i_exchangeAddress).balanceOf(address(this))
            );
            uint256 balance = address(this).balance; // native token balance
            amountPerMember = (balance * 2) / (s_memberNumber - 1); // total balance ( in native token ) is total native token + total liquidity token and rate of liquidity token is with respect reserve of both tokens. Therefore, total liquidity token = total native token.
        }

        s_isFinalJudgementCalculated = true;
        if (s_isMinMembersReachedCalculated && !s_isMinMembersReached) {
            return;
        }
        // if no judges were selected, then pay all members
        if (!s_isMinMembersReachedCalculated) {
            s_isMinMembersReachedCalculated = true;
            s_isMinMembersReached = false;
            for (uint256 i = 1; i < s_memberNumber; i++) {
                s_balance[s_idToMemberAddress[i]] += amountPerMember;
            }
            return;
        }

        // check whether there's atleast one judge who fullfilled his job that is accepted everyone's request
        for (uint256 i = 1; i <= i_judgesLength; i++) {
            if (s_judged[s_idToJudgeAddress[i]] == s_claimNumber - 1) {
                s_judgesFullfilledJobs.push(JudgementJobFullfilled(i, 0));
            }
        }

        // pay everyone except the judges as no one fullfilled their job
        if (s_judgesFullfilledJobs.length == 0) {
            uint256 amountForEachMember = (amountPerMember + i_judgesLength) / (s_memberNumber - 1);
            for (uint256 i = 1; i < s_memberNumber; i++) {
                if (s_addressToJudgeId[s_idToMemberAddress[i]] == 0) {
                    s_balance[s_idToMemberAddress[i]] += amountForEachMember; // no judge will get their money back
                }
            }
            return;
        }

        // pay all the judges who fullfilled their job
        uint256 amountForEachJudge = ((i_percentageDividedIntoJudges *
            (s_memberNumber - 1) *
            amountPerMember) / (100 * s_judgesFullfilledJobs.length));
        uint256 amountLeftForMembers = ((amountPerMember * (s_memberNumber - 1)) -
            (amountForEachJudge * s_judgesFullfilledJobs.length));
        for (uint256 i = 0; i < s_judgesFullfilledJobs.length; i++) {
            s_judgesFullfilledJobs[i].amount = amountForEachJudge;
            s_balance[s_idToJudgeAddress[s_judgesFullfilledJobs[i].judgeId]] += amountForEachJudge;
        }

        // check whether atleast one claim is accepted by majority of judges && calculate amount to be paid to insuranceClaimers who are accepted
        for (uint256 i = 1; i < s_claimNumber; i++) {
            if (s_idToClaimRequest[i].accepted > (i_judgesLength / 2)) {
                s_totalClaimAmountAccepted += s_idToClaimRequest[i].amount;
                s_claimAccepted.push(ClaimAccepted(i, 0));
            }
        }

        // pay everyone except the judges as no one fullfilled their job
        if (s_claimAccepted.length == 0) {
            uint256 amountForEachMember = amountLeftForMembers / (s_memberNumber - 1);

            // pay all the judges who fullfilled their job as amountForEachMember
            for (uint256 i = 0; i < s_judgesFullfilledJobs.length; i++) {
                s_balance[
                    s_idToJudgeAddress[s_judgesFullfilledJobs[i].judgeId]
                ] += amountForEachMember;
            }
            // pay everyone except the judges as amountForEachMember as either no one fullfilled their job or who fullfilled their job already got their money
            for (uint256 i = 1; i < s_memberNumber; i++) {
                if (s_addressToJudgeId[s_idToMemberAddress[i]] == 0) {
                    s_balance[s_idToMemberAddress[i]] += amountForEachMember;
                }
            }
            return;
        }
        uint256 extraAmount = 0;
        // calculate extra amount to be paid to insuranceClaimers who are accepted
        if (s_totalClaimAmountAccepted >= amountLeftForMembers) {
            extraAmount = s_totalClaimAmountAccepted - amountLeftForMembers;
            amountLeftForMembers = 0;
        } else {
            amountLeftForMembers -= s_totalClaimAmountAccepted;
        }

        // pay insuranceClaimers who are accepted
        for (uint256 i = 0; i < s_claimAccepted.length; i++) {
            uint256 amountRequested = s_idToClaimRequest[s_claimAccepted[i].claimId].amount;
            uint256 amountToPay = amountRequested -
                ((amountRequested * extraAmount) / s_totalClaimAmountAccepted);
            s_claimAccepted[i].amount = amountToPay;
            s_balance[s_idToClaimRequest[s_claimAccepted[i].claimId].memberAddress] += amountToPay;
        }
        // if there's any amount left, pay it to everyone
        if (amountLeftForMembers > 0) {
            uint256 amountForEachMember = amountLeftForMembers / (s_memberNumber - 1);
            // pay all the judges who fullfilled their job as amountForEachMember
            for (uint256 i = 0; i < s_judgesFullfilledJobs.length; i++) {
                s_balance[
                    s_idToJudgeAddress[s_judgesFullfilledJobs[i].judgeId]
                ] += amountForEachMember;
            }
            // pay everyone except the judges as amountForEachMember as either no one fullfilled their job or who fullfilled their job already got their money
            for (uint256 i = 1; i < s_memberNumber; i++) {
                if (s_addressToJudgeId[s_idToMemberAddress[i]] == 0) {
                    s_balance[s_idToMemberAddress[i]] += amountForEachMember;
                }
            }
        }
    }

    function withdraw() public {
        require(s_balance[msg.sender] > 0, "No balance");
        if (!i_useLiquidityPool) {
            uint256 amount = s_balance[msg.sender];
            s_balance[msg.sender] = 0;
            payable(msg.sender).transfer(amount);
        } else {
            uint256 amount = 0;
            uint256 tokenAmount = 0;
            uint256 balance = address(this).balance;
            uint256 tokenBalance = IERC20(i_liquidityTokenAddress).balanceOf(address(this));

            // half of the amount will be paid in native token and half in liquidity token to avoid price slippage
            amount = s_balance[msg.sender] / 2;
            tokenAmount = (amount * tokenBalance) / balance;

            s_balance[msg.sender] = 0;

            payable(msg.sender).transfer(amount);
            IERC20(i_liquidityTokenAddress).transfer(msg.sender, tokenAmount);
        }
        // (bool success, ) = payable(msg.sender).call{value: amount}("");
        // if (!success) {
        //     revert WithdrawFailed();
        // }
    }

    // function withdrawMemberRequest() public {
    //     require(s_addressToRequestId[msg.sender] != 0, "No request");
    //     require(block.timestamp > i_requestBefore, "Time is still left");
    //     uint256 amount = i_amount;
    //     uint256 id = s_addressToRequestId[msg.sender];
    //     s_idToMemberRequest[id] = MemberRequest(address(0), "", 0);
    //     s_addressToRequestId[msg.sender] = 0;
    //     (bool success, ) = payable(msg.sender).call{value: amount}("");
    //     if (!success) {
    //         revert WithdrawFailed();
    //     }
    // }

    function getBaseUri() public view returns (string memory) {
        return s_baseUri;
    }

    function getMinMembers() public view returns (uint256) {
        return i_minMembers;
    }

    function getRequestBefore() public view returns (uint256) {
        return i_requestBefore;
    }

    function getValidity() public view returns (uint256) {
        return i_validity;
    }

    function getJudgingStartTime() public view returns (uint256) {
        return i_judgingStartTime;
    }

    function getJudgingEndTime() public view returns (uint256) {
        return i_judgingEndTime;
    }

    function getJudgesLength() public view returns (uint256) {
        return i_judgesLength;
    }

    function getAmount() public view returns (uint256) {
        return i_amount;
    }

    function getTotalMembers() public view returns (uint256) {
        return s_memberNumber - 1;
    }

    function getDeadlineMet() public view returns (bool) {
        return getTotalMembers() >= i_minMembers;
    }

    function getMemberById(uint256 id) public view returns (address) {
        return s_idToMemberAddress[id];
    }

    function getMemberIdByAddress(address memberAddress) public view returns (uint256) {
        return s_addressToMemberId[memberAddress];
    }

    function getTotalRequests() public view returns (uint256) {
        return s_requestNumber - 1;
    }

    function getRequestById(uint256 id) public view returns (MemberRequest memory) {
        return s_idToMemberRequest[id];
    }

    function getRequestIdByAddress(address memberAddress) public view returns (uint256) {
        return s_addressToRequestId[memberAddress];
    }

    function getMemberRequestAcceptance(
        uint256 memberId,
        uint256 requestId
    ) public view returns (bool) {
        return s_memberRequestAcceptances[abi.encode(s_idToMemberAddress[memberId], requestId)];
    }

    function getTotalClaims() public view returns (uint256) {
        return s_claimNumber - 1;
    }

    function getClaimById(uint256 id) public view returns (InsuranceClaimRequest memory) {
        return s_idToClaimRequest[id];
    }

    function getClaimIdByAddress(address memberAddress) public view returns (uint256) {
        return s_addressToClaimId[memberAddress];
    }

    function getJudgeById(uint256 id) public view returns (address) {
        return s_idToJudgeAddress[id];
    }

    function getJudgeIdByAddress(address memberAddress) public view returns (uint256) {
        return s_addressToJudgeId[memberAddress];
    }

    function getJudgement(uint256 judgeId, uint256 claimId) public view returns (Judgement memory) {
        return s_judgements[abi.encode(s_idToJudgeAddress[judgeId], claimId)];
    }

    function getJudged(address judgeAddress) public view returns (uint256) {
        return s_judged[judgeAddress];
    }

    function getJudgesFullFilledJobs() public view returns (JudgementJobFullfilled[] memory) {
        return s_judgesFullfilledJobs;
    }

    function getTotalJudgesFullFilledJobs() public view returns (uint256) {
        return s_judgesFullfilledJobs.length;
    }

    function getClaimAcceptedLength() public view returns (uint256) {
        return s_claimAccepted.length;
    }

    function getClaimsAccepted() public view returns (ClaimAccepted[] memory) {
        return s_claimAccepted;
    }

    function getTotalClaimAmountRequested() public view returns (uint256) {
        return s_totalClaimAmountRequested;
    }

    function getTotalClaimAmountAccepted() public view returns (uint256) {
        return s_totalClaimAmountAccepted;
    }

    function getIsClaimFullfilled() public view returns (bool) {
        return s_isFinalJudgementCalculated;
    }

    function getPercentageDividedIntoJudges() public view returns (uint256) {
        return i_percentageDividedIntoJudges;
    }

    function getBalance(address memberAddress) public view returns (uint256) {
        return s_balance[memberAddress];
    }

    function getIsMinimumMembersReachedCalculated() public view returns (bool) {
        return s_isMinMembersReachedCalculated;
    }

    function getIsJudgeSelected() public view returns (bool) {
        return s_isMinMembersReachedCalculated; // both are calculated at the same time
    }

    function getIsMinimumMembersReached() public view returns (bool) {
        return s_isMinMembersReached;
    }

    function getGroupId() public view returns (string memory) {
        return s_groupId;
    }

    // function getIsAnyClaimAccepted() public view returns (bool) {
    //     return s_claimAccepted.length > 0;
    // }

    // function getIsAnyJudgeFullfilledTheirJob() public view returns (bool) {
    //     return s_judgesFullfilledJobs.length > 0;
    // }
}
