const { expect } = require("chai");
const bre = require("@nomiclabs/buidler");

describe("Deposit Tests", function () {
  it("User can deposit correct amount and numberOfDeposits increments", async function () {
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

    // Deposit should fail if you do not deposit the correct amount
    await expect(
      depositGame.connect(user1).deposit({ value: gameDepositAmount - 100 })
    ).to.be.revertedWith(
      "User has to deposit at exactly 1000 wei to join the savings game"
    );

    // Deposit should succeed if correct amount is used.
    await depositGame.connect(user1).deposit({ value: gameDepositAmount });

    // Number of deposits should increase if a deposit is made by user.
    expect(await depositGame.numberOfDeposits(user1.getAddress())).to.equal(1);

    // Deposit should fail if have already deposited within the last 24hours
    await expect(
      depositGame.connect(user1).deposit({ value: gameDepositAmount })
    ).to.be.revertedWith("User has already deposited in the last 24hours");
  });

  it("User can deposit again after a day has elapsed", async function () {
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

    await bre.network.provider.send("evm_increaseTime", [86401]);

    // this should pass
    await depositGame.connect(user1).deposit({ value: gameDepositAmount });

    // Number of deposits should now be 2.
    expect(await depositGame.numberOfDeposits(user1.getAddress())).to.equal(2);
  });

  it("Total number of winner increase if a user makes all required deposits", async function () {
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

    // Number of deposits should now be 3.
    expect(await depositGame.numberOfDeposits(user1.getAddress())).to.equal(3);

    expect(await depositGame.totalNumberOfWinner()).to.equal(1);

    await bre.network.provider.send("evm_increaseTime", [86401]);
    // Deposit should fail since game has ended
    await expect(
      depositGame.connect(user1).deposit({ value: gameDepositAmount })
    ).to.be.revertedWith("Game has ended");
  });
});
