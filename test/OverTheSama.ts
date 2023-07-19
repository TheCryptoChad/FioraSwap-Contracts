import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("OverTheSama", function () {
	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployContractsFixture() {
		const [account1, account2] = await ethers.getSigners();

		const otsFactory = await ethers.getContractFactory("OverTheSama");
		const t20_1Factory = await ethers.getContractFactory("Test20_1");
		const t20_2Factory = await ethers.getContractFactory("Test20_2");
		const t721_1Factory = await ethers.getContractFactory("Test721_1");
		const t721_2Factory = await ethers.getContractFactory("Test721_2");
		const t1155_1Factory = await ethers.getContractFactory("Test1155_1");
		const t1155_2Factory = await ethers.getContractFactory("Test1155_2");

		const otsContract = await otsFactory.deploy();
		const t20_1Contract = await t20_1Factory.deploy();
		const t20_2Contract = await t20_2Factory.deploy();
		const t721_1Contract = await t721_1Factory.deploy();
		const t721_2Contract = await t721_2Factory.deploy();
		const t1155_1Contract = await t1155_1Factory.deploy();
		const t1155_2Contract = await t1155_2Factory.deploy();

		await t20_1Contract.connect(account1).transfer(account2, ethers.parseEther("50"));

		await t20_2Contract.connect(account1).transfer(account2, ethers.parseEther("50"));

		await t721_1Contract.connect(account1).safeMint(account1);
		await t721_1Contract.connect(account1).safeMint(account1);
		await t721_1Contract.connect(account2).safeMint(account2);
		await t721_1Contract.connect(account2).safeMint(account2);

		await t721_2Contract.connect(account2).safeMint(account2);
		await t721_2Contract.connect(account2).safeMint(account2);
		await t721_2Contract.connect(account1).safeMint(account1);
		await t721_2Contract.connect(account1).safeMint(account1);

		await t1155_1Contract.connect(account1).mintBatch(account1, [BigInt(1), BigInt(2), BigInt(3)], [BigInt(5), BigInt(5), BigInt(5)], "0x");
		await t1155_1Contract.connect(account2).mintBatch(account2, [BigInt(4), BigInt(5), BigInt(6)], [BigInt(5), BigInt(5), BigInt(5)], "0x");

		await t1155_2Contract.connect(account2).mintBatch(account2, [BigInt(1), BigInt(2), BigInt(3)], [BigInt(5), BigInt(5), BigInt(5)], "0x");
		await t1155_2Contract.connect(account1).mintBatch(account1, [BigInt(4), BigInt(5), BigInt(6)], [BigInt(5), BigInt(5), BigInt(5)], "0x");

		console.log(`
    Account 1 owns:
    T20_1: ${ethers.formatEther(await t20_1Contract.balanceOf(account1))}
    T20_2: ${ethers.formatEther(await t20_2Contract.balanceOf(account1))}
    T721_1: ${(await t721_1Contract.ownerOf(BigInt(1))) === account1.address ? "#1, " : ""}${(await t721_1Contract.ownerOf(BigInt(2))) === account1.address ? "#2, " : ""}${(await t721_1Contract.ownerOf(BigInt(3))) === account1.address ? "#3, " : ""}${(await t721_1Contract.ownerOf(BigInt(4))) === account1.address ? "#4" : ""}
    T721_2: ${(await t721_2Contract.ownerOf(BigInt(1))) === account1.address ? "#1, " : ""}${(await t721_2Contract.ownerOf(BigInt(2))) === account1.address ? "#2, " : ""}${(await t721_2Contract.ownerOf(BigInt(3))) === account1.address ? "#3, " : ""}${(await t721_2Contract.ownerOf(BigInt(4))) === account1.address ? "#4" : ""}
    T1155_1: ${await t1155_1Contract.balanceOfBatch([account1, account1, account1, account1, account1, account1], [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)])}
    T1155_2: ${await t1155_2Contract.balanceOfBatch([account1, account1, account1, account1, account1, account1], [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)])}

    Account 2 owns:
    T20_1: ${ethers.formatEther(await t20_1Contract.balanceOf(account2))}
    T20_2: ${ethers.formatEther(await t20_2Contract.balanceOf(account2))}
    T721_1: ${(await t721_1Contract.ownerOf(BigInt(1))) === account2.address ? "#1, " : ""}${(await t721_1Contract.ownerOf(BigInt(2))) === account2.address ? "#2, " : ""}${(await t721_1Contract.ownerOf(BigInt(3))) === account2.address ? "#3, " : ""}${(await t721_1Contract.ownerOf(BigInt(4))) === account2.address ? "#4" : ""}
    T721_2: ${(await t721_2Contract.ownerOf(BigInt(1))) === account2.address ? "#1, " : ""}${(await t721_2Contract.ownerOf(BigInt(2))) === account2.address ? "#2, " : ""}${(await t721_2Contract.ownerOf(BigInt(3))) === account2.address ? "#3, " : ""}${(await t721_2Contract.ownerOf(BigInt(4))) === account2.address ? "#4" : ""}
    T1155_1: ${await t1155_1Contract.balanceOfBatch([account2, account2, account2, account2, account2, account2], [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)])}
    T1155_2: ${await t1155_2Contract.balanceOfBatch([account2, account2, account2, account2, account2, account2], [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)])}
    `);

		return { account1, account2, otsContract, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract };
	}

	describe("Deployment", function () {
		it("Create Offer", async function () {
			const { account1, account2, otsContract, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract } = await loadFixture(deployContractsFixture);

			const otsAddress = await otsContract.getAddress();

			await t20_1Contract.connect(account1).approve(otsAddress, ethers.parseEther("30"));
			await t20_2Contract.connect(account1).approve(otsAddress, ethers.parseEther("30"));
      await t721_1Contract.connect(account1).setApprovalForAll(otsAddress, true);
      await t721_1Contract.connect(account1).setApprovalForAll(otsAddress, true);
			//expect(t20_1Balance).to.equal(BigInt(100000000000000000000));
		});

		// it("Should set the right owner", async function () {
		//   const { lock, owner } = await loadFixture(deployContractsFixture);

		//   expect(await lock.owner()).to.equal(owner.address);
		// });

		// it("Should receive and store the funds to lock", async function () {
		//   const { lock, lockedAmount } = await loadFixture(
		//     deployOneYearLockFixture
		//   );

		//   expect(await ethers.provider.getBalance(lock.target)).to.equal(
		//     lockedAmount
		//   );
		// });

		// it("Should fail if the unlockTime is not in the future", async function () {
		//   // We don't use the fixture here because we want a different deployment
		//   const latestTime = await time.latest();
		//   const Lock = await ethers.getContractFactory("Lock");
		//   await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
		//     "Unlock time should be in the future"
		//   );
		// });
	});
});
