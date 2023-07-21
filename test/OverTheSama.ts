import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Test20_1, Test20_2, Test721_1, Test721_2, Test1155_1, Test1155_2 } from "../typechain-types";

const fullStatusLog = async (account1: any, account2: any, t20_1Contract: Test20_1, t20_2Contract: Test20_2, t721_1Contract: Test721_1, t721_2Contract: Test721_2, t1155_1Contract: Test1155_1, t1155_2Contract: Test1155_2) => {
  console.log(`
  Account 1 owns:
  ETH: ${ethers.formatEther(await account1.provider.getBalance(account1))}
  T20_1: ${ethers.formatEther(await t20_1Contract.balanceOf(account1))}
  T20_2: ${ethers.formatEther(await t20_2Contract.balanceOf(account1))}
  T721_1: ${(await t721_1Contract.ownerOf(BigInt(1))) === account1.address ? "#1, " : ""}${(await t721_1Contract.ownerOf(BigInt(2))) === account1.address ? "#2, " : ""}${(await t721_1Contract.ownerOf(BigInt(3))) === account1.address ? "#3, " : ""}${(await t721_1Contract.ownerOf(BigInt(4))) === account1.address ? "#4" : ""}
  T721_2: ${(await t721_2Contract.ownerOf(BigInt(1))) === account1.address ? "#1, " : ""}${(await t721_2Contract.ownerOf(BigInt(2))) === account1.address ? "#2, " : ""}${(await t721_2Contract.ownerOf(BigInt(3))) === account1.address ? "#3, " : ""}${(await t721_2Contract.ownerOf(BigInt(4))) === account1.address ? "#4" : ""}
  T1155_1: ${await t1155_1Contract.balanceOfBatch([account1, account1, account1, account1, account1, account1], [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)])}
  T1155_2: ${await t1155_2Contract.balanceOfBatch([account1, account1, account1, account1, account1, account1], [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)])}

  Account 2 owns:
  ETH: ${ethers.formatEther(await account2.provider.getBalance(account2))}
  T20_1: ${ethers.formatEther(await t20_1Contract.balanceOf(account2))}
  T20_2: ${ethers.formatEther(await t20_2Contract.balanceOf(account2))}
  T721_1: ${(await t721_1Contract.ownerOf(BigInt(1))) === account2.address ? "#1, " : ""}${(await t721_1Contract.ownerOf(BigInt(2))) === account2.address ? "#2, " : ""}${(await t721_1Contract.ownerOf(BigInt(3))) === account2.address ? "#3, " : ""}${(await t721_1Contract.ownerOf(BigInt(4))) === account2.address ? "#4" : ""}
  T721_2: ${(await t721_2Contract.ownerOf(BigInt(1))) === account2.address ? "#1, " : ""}${(await t721_2Contract.ownerOf(BigInt(2))) === account2.address ? "#2, " : ""}${(await t721_2Contract.ownerOf(BigInt(3))) === account2.address ? "#3, " : ""}${(await t721_2Contract.ownerOf(BigInt(4))) === account2.address ? "#4" : ""}
  T1155_1: ${await t1155_1Contract.balanceOfBatch([account2, account2, account2, account2, account2, account2], [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)])}
  T1155_2: ${await t1155_2Contract.balanceOfBatch([account2, account2, account2, account2, account2, account2], [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)])}
  `);
}

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

		const otsContract = await otsFactory.connect(account1).deploy();
		const t20_1Contract = await t20_1Factory.connect(account1).deploy();
		const t20_2Contract = await t20_2Factory.connect(account1).deploy();
		const t721_1Contract = await t721_1Factory.connect(account1).deploy();
		const t721_2Contract = await t721_2Factory.connect(account1).deploy();
		const t1155_1Contract = await t1155_1Factory.connect(account1).deploy();
		const t1155_2Contract = await t1155_2Factory.connect(account1).deploy();

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

    const otsAddress = await otsContract.getAddress();
    const t20_1Address = await t20_1Contract.getAddress();
    const t20_2Address = await t20_2Contract.getAddress();
    const t721_1Address = await t721_1Contract.getAddress();
    const t721_2Address = await t721_2Contract.getAddress();
    const t1155_1Address = await t1155_1Contract.getAddress();
    const t1155_2Address = await t1155_2Contract.getAddress();

    await t20_1Contract.connect(account1).approve(otsAddress, ethers.parseEther("50"));
    await t20_2Contract.connect(account1).approve(otsAddress, ethers.parseEther("50"));
    await t721_1Contract.connect(account1).setApprovalForAll(otsAddress, true);
    await t721_2Contract.connect(account1).setApprovalForAll(otsAddress, true);
    await t1155_1Contract.connect(account1).setApprovalForAll(otsAddress, true);
    await t1155_2Contract.connect(account1).setApprovalForAll(otsAddress, true);

    await otsContract.connect(account1).createOffer(
      ethers.parseEther("10"),
      ethers.parseEther("0.1"),
      [t20_1Address, t20_2Address, t721_1Address, t721_1Address, t721_2Address, t721_2Address, t1155_1Address, t1155_2Address],
      [t20_1Address, t20_2Address, t721_1Address, t721_1Address, t721_2Address, t721_2Address, t1155_1Address, t1155_2Address],
      [[ethers.parseEther("40")], [ethers.parseEther("30")], [BigInt(1)], [BigInt(1)], [BigInt(1)], [BigInt(1)],  [BigInt(5), BigInt(5), BigInt(5)], [BigInt(5), BigInt(5), BigInt(5)]],
      [[ethers.parseEther("5")], [ethers.parseEther("10")], [BigInt(1)], [BigInt(1)], [BigInt(1)], [BigInt(1)],  [BigInt(5), BigInt(5), BigInt(5)], [BigInt(5), BigInt(5), BigInt(5)]],
      [[BigInt(0)], [BigInt(0)], [BigInt(1)], [BigInt(2)], [BigInt(3)], [BigInt(4)],  [BigInt(1), BigInt(2), BigInt(3)], [BigInt(4), BigInt(5), BigInt(6)]],
      [[BigInt(0)], [BigInt(0)], [BigInt(3)], [BigInt(4)], [BigInt(1)], [BigInt(2)],  [BigInt(4), BigInt(5), BigInt(6)], [BigInt(1), BigInt(2), BigInt(3)]],
      {value: ethers.parseEther("20.1")}
    );

    await otsContract.connect(account1).createOffer(
      ethers.parseEther("3"),
      ethers.parseEther("0.1"),
      [],
      [],
      [],
      [],
      [],
      [],
      {value: ethers.parseEther("2.1")}
    );

    await otsContract.connect(account1).createOffer(
      ethers.parseEther("1"),
      ethers.parseEther("0.1"),
      [],
      [],
      [],
      [],
      [],
      [],
      {value: ethers.parseEther("2.1")}
    );

		return { account1, account2, otsContract, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract, otsAddress, t20_1Address, t20_2Address, t721_1Address, t721_2Address, t1155_1Address, t1155_2Address };
	}

	describe("Accept Offer", async function () {
    it("User 2 Accepts Offer and tokens get exchanged", async function () {
      const { account1, account2, otsContract, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract, otsAddress, t20_1Address, t20_2Address, t721_1Address, t721_2Address, t1155_1Address, t1155_2Address } = await loadFixture(deployContractsFixture);

      await t20_1Contract.connect(account2).approve(otsAddress, ethers.parseEther("50"));
      await t20_2Contract.connect(account2).approve(otsAddress, ethers.parseEther("50"));
      await t721_1Contract.connect(account2).setApprovalForAll(otsAddress, true);
      await t721_2Contract.connect(account2).setApprovalForAll(otsAddress, true);
      await t1155_1Contract.connect(account2).setApprovalForAll(otsAddress, true);
      await t1155_2Contract.connect(account2).setApprovalForAll(otsAddress, true);

      await otsContract.connect(account2).acceptOffer(
        BigInt(0),
        ethers.parseEther("0.1"),
        {value: ethers.parseEther("10.1")}
      );

      //console.log(await otsContract.getMemoryOffers(BigInt(0)));

      await otsContract.connect(account2).acceptOffer(
        BigInt(2),
        ethers.parseEther("0.1"),
        {value: ethers.parseEther("1.1")}
      );

      //console.log(await otsContract.getMemoryOffers(BigInt(2)));

      await otsContract.connect(account2).acceptOffer(
        BigInt(1),
        ethers.parseEther("0.1"),
        {value: ethers.parseEther("3.1")}
      );

      //console.log(await otsContract.getMemoryOffers(BigInt(1)));

      //fullStatusLog(account1, account2, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract);

      expect((await otsContract.connect(account1).getMemoryOffers(BigInt(0))).status).to.equal("completed");
      expect(await otsContract.connect(account1).collectedProtocolFees()).to.equal(ethers.parseEther("0.6"));

      //console.log(ethers.formatEther(await account1.provider.getBalance(account1)))

      await otsContract.connect(account1).retrieveProtocolFees();

      //console.log(ethers.formatEther(await account1.provider.getBalance(account1)))

      expect(await otsContract.connect(account1).collectedProtocolFees()).to.equal(ethers.parseEther("0"));
      //expect()

      console.log(await Promise.all(await otsContract.connect(account1).getOffers()));
    });
  });

  // describe("Cancel Offer", async function () {
  //   it("User 1 Cancels Offer and tokens get returned, but fees don't", async function () {
  //     const { account1, account2, otsContract, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract, otsAddress, t20_1Address, t20_2Address, t721_1Address, t721_2Address, t1155_1Address, t1155_2Address } = await loadFixture(deployContractsFixture);

  //     await otsContract.connect(account1).cancelOffer(BigInt(0));

  //     console.log(await otsContract.getMemoryOffers(BigInt(0)));

  //     fullStatusLog(account1, account2, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract);

  //     expect((await otsContract.connect(account1).getMemoryOffers(BigInt(0))).status).to.equal("cancelled");
  //     expect(await otsContract.connect(account1).collectedProtocolFees()).to.equal(ethers.parseEther("0.3"));
  //     expect(await account1.provider.getBalance(otsAddress)).to.equal(ethers.parseEther("4.3"));
  //   });
  // });
});