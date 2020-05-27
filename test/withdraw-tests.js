const { expect } = require("chai");
const bre = require("@nomiclabs/buidler");
const { BN } = require("@openzeppelin/test-helpers");
const { ethers } = require("@nomiclabs/buidler");
//const BigNumber = require("BigNumber.js");

describe("Withdrawl tests", function () {
  it("User cannot withdaw if the game has not ended", async function () {
    // Constructor arguments
    const depositsNeededToWinGame = 3;
    const gameDepositAmount = 1000;

    // Deploy the contract
    const DepositContract = await ethers.getContractFactory("DepositGame");
    const depositGame = await DepositContract.deploy(
      depositsNeededToWinGame,
      gameDepositAmount
    );
    await depositGame.deployed();
    const [contractOwner, user1, user2, user3] = await ethers.getSigners();

    // Deposit should succeed if correct amount is used.
    await depositGame.connect(user1).deposit({ value: gameDepositAmount });

    // another day passes and we deposit
    await bre.network.provider.send("evm_increaseTime", [86401]);
    await depositGame.connect(user1).deposit({ value: gameDepositAmount });

    // Another day passes and we deposit
    await bre.network.provider.send("evm_increaseTime", [86401]);
    await depositGame.connect(user1).deposit({ value: gameDepositAmount });

    // They have made required deposits now and should win, but game hasn't finsihed!
    await expect(depositGame.connect(user1).withdraw()).to.be.revertedWith(
      "Cannot withdraw until game has ended"
    );
  });

  it("User cannot withdaw if they did not make required number deposits", async function () {
    // Constructor arguments
    const depositsNeededToWinGame = 3;
    const gameDepositAmount = 1000;

    // Deploy the contract
    const DepositContract = await ethers.getContractFactory("DepositGame");
    const depositGame = await DepositContract.deploy(
      depositsNeededToWinGame,
      gameDepositAmount
    );
    await depositGame.deployed();
    const [contractOwner, user1, user2, user3] = await ethers.getSigners();

    // Deposit should succeed if correct amount is used.
    await depositGame.connect(user1).deposit({ value: gameDepositAmount });

    // another day passes and we deposit
    await bre.network.provider.send("evm_increaseTime", [86401]);
    await depositGame.connect(user1).deposit({ value: gameDepositAmount });

    //Game will now be finished. only 2 deposits made
    await bre.network.provider.send("evm_increaseTime", [200000]);

    // They have made required deposits now and should win, but game hasn't finsihed!
    await expect(depositGame.connect(user1).withdraw()).to.be.revertedWith(
      "User has not made enough required deposits"
    );
  });

  it("Users receive correct amount from game", async function () {
    // Constructor arguments
    const depositsNeededToWinGame = 3;
    const gameDepositAmount = 1000;

    // Deploy the contract
    const DepositContract = await ethers.getContractFactory("DepositGame");
    const depositGame = await DepositContract.deploy(
      depositsNeededToWinGame,
      gameDepositAmount
    );
    await depositGame.deployed();
    const [contractOwner, user1, user2, user3] = await ethers.getSigners();

    await depositGame.connect(user1).deposit({ value: gameDepositAmount });
    await depositGame.connect(user2).deposit({ value: gameDepositAmount });
    await depositGame.connect(user3).deposit({ value: gameDepositAmount });

    // another day passes and we deposit
    await bre.network.provider.send("evm_increaseTime", [86401]);
    await depositGame.connect(user1).deposit({ value: gameDepositAmount });
    await depositGame.connect(user2).deposit({ value: gameDepositAmount });

    // another day passes and we deposit
    await bre.network.provider.send("evm_increaseTime", [86401]);
    await depositGame.connect(user1).deposit({ value: gameDepositAmount });
    await depositGame.connect(user2).deposit({ value: gameDepositAmount });

    // Game finishes
    await bre.network.provider.send("evm_increaseTime", [200000]);

    // user 1 and 2 have won and deposited all 3 times
    // user 3 lost by only making 1 deposit.
    // therefore user 1 and 2 should each get all their deposits plus half of user 3 deposit each
    let amountToReceive = gameDepositAmount * 3 + gameDepositAmount / 2;

    let user1BalanceBeforePayout = await user1.getBalance();
    // They now withdraw their winnings

    const gasPrice = 10;
    const tx = await depositGame
      .connect(user1)
      .withdraw({ gasPrice: gasPrice });
    const txResponse = await tx.wait();
    const receipt = await ethers.provider.getTransactionReceipt(
      txResponse.transactionHash
    );
    const gasUsed = receipt.gasUsed;
    const gasUsedBN = new BN(gasUsed.toString());
    const gasCost = new BN(gasPrice).mul(gasUsedBN);

    const balBefore = new BN(user1BalanceBeforePayout.toString());
    const amount = new BN(amountToReceive.toString());

    // multiply gas cost by gas used
    const expectedBalanceAfterPayout = balBefore.add(amount).sub(gasCost);
    const userBalance = await user1.getBalance();
    expect(userBalance.toString()).to.equal(
      expectedBalanceAfterPayout.toString()
    );
  });
});
