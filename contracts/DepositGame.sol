pragma solidity ^0.5.1;

import "@nomiclabs/buidler/console.sol";


contract DepositGame {
    // play with friends
    // game last 3 days
    // everyone must deposit once a day
    // 3 deposits means you win and should be able to call the withdraw function

    uint256 public gameEndTime;
    uint256 public gameDepositAmount;
    uint256 public numberOfDepositsNeededToWin;
    uint256 public totalNumberOfWinner;
    uint256 public amountToWin;

    mapping(address => uint256) public numberOfDeposits;
    mapping(address => uint256) public userIsEligibleToDepositTimestamp;

    constructor(
        uint256 _numberOfDepositsNeededToWin,
        uint256 _gameDepositAmount
    ) public {
        numberOfDepositsNeededToWin = _numberOfDepositsNeededToWin;
        gameDepositAmount = _gameDepositAmount;
        gameEndTime = now + 259200; // 1 day is 86400
    }

    function deposit() public payable {
        // check did they send enough cash?
        require(
            msg.value == gameDepositAmount,
            "User has to deposit at exactly 1000 wei to join the savings game"
        );
        // Has the game ended?
        require(gameEndTime > now, "Game has ended");

        // check user has only deposited once this day
        require(
            userIsEligibleToDepositTimestamp[msg.sender] < now,
            "User has already deposited in the last 24hours"
        );

        numberOfDeposits[msg.sender] = numberOfDeposits[msg.sender] + 1;
        userIsEligibleToDepositTimestamp[msg.sender] = now + 86400;

        if (numberOfDeposits[msg.sender] >= numberOfDepositsNeededToWin) {
            totalNumberOfWinner = totalNumberOfWinner + 1;
        }
    }

    function withdraw() public {
        // this function should only be able to be called when the game has finished
        // Only a winner should be able to call this function!
        // this function should send you your winnings
    }
}
