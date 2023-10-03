import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Test20_1, Test20_2, Test721_1, Test721_2, Test1155_1, Test1155_2 } from "../typechain-types";
import { OTS_Util } from "../typechain-types/contracts/OTS_Offer";

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
	async function deployContractsFixture() {
		const [account1, account2] = await ethers.getSigners();

    const offer0: OTS_Util.OfferStruct = {
      id: BigInt(0),
      maker: "0x0000000000000000000000000000000000000000",
      taker: "0x0000000000000000000000000000000000000000",
      makerFee: BigInt(0),
      takerFee: BigInt(0),
      makerTokenTypes: [],
      takerTokenTypes: [],
      makerTokenAddresses: [],
      takerTokenAddresses: [],
      makerTokenIds: [],
      takerTokenIds: [],
      makerTokenAmounts: [],
      takerTokenAmounts: [],
      makerTokenChainIds: [],
      takerTokenChainIds: [],
      makerSent: true,
      takerSent: false,
      status: BigInt(0)
    }

    const otsOfferFactory = await ethers.getContractFactory("OTS_Offer");
		const otsAdminFactory = await ethers.getContractFactory("OTS_Admin");
		const t20_1Factory = await ethers.getContractFactory("Test20_1");
		const t20_2Factory = await ethers.getContractFactory("Test20_2");
		const t721_1Factory = await ethers.getContractFactory("Test721_1");
		const t721_2Factory = await ethers.getContractFactory("Test721_2");
		const t1155_1Factory = await ethers.getContractFactory("Test1155_1");
		const t1155_2Factory = await ethers.getContractFactory("Test1155_2");

    const otsOfferContract = await otsOfferFactory.connect(account1).deploy(offer0, "0x0000000000000000000000000000000000000000");
    const otsOfferContractAddress = await otsOfferContract.getAddress();
		const otsAdminContract = await otsAdminFactory.connect(account1).deploy(otsOfferContractAddress);

    const otsOfferContractGas = await ethers.provider.estimateGas({data: otsOfferContract.interface.encodeDeploy([offer0, "0x0000000000000000000000000000000000000000"])});
    const otsAdminContractGas = await ethers.provider.estimateGas({data: otsAdminContract.interface.encodeDeploy([otsOfferContractAddress])});

    console.log(`Deploy offer template uses: ${otsOfferContractGas} gas`);
    console.log(`Deploy admin contract uses: ${otsAdminContractGas} gas`);

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
	
    for (let i = 0; i < 18; i++){
      await t721_1Contract.connect(account1).safeMint(account1);
      await t721_2Contract.connect(account1).safeMint(account1);
    }

		await t1155_1Contract.connect(account1).mintBatch(account1, [BigInt(1), BigInt(2), BigInt(3)], [BigInt(500), BigInt(500), BigInt(500)], "0x");
		await t1155_1Contract.connect(account2).mintBatch(account2, [BigInt(4), BigInt(5), BigInt(6)], [BigInt(5), BigInt(5), BigInt(5)], "0x");

		await t1155_2Contract.connect(account2).mintBatch(account2, [BigInt(1), BigInt(2), BigInt(3)], [BigInt(5), BigInt(5), BigInt(5)], "0x");
		await t1155_2Contract.connect(account1).mintBatch(account1, [BigInt(4), BigInt(5), BigInt(6)], [BigInt(500), BigInt(500), BigInt(500)], "0x");

    const otsAdminAddress = await otsAdminContract.getAddress();
    const t20_1Address = await t20_1Contract.getAddress();
    const t20_2Address = await t20_2Contract.getAddress();
    const t721_1Address = await t721_1Contract.getAddress();
    const t721_2Address = await t721_2Contract.getAddress();
    const t1155_1Address = await t1155_1Contract.getAddress();
    const t1155_2Address = await t1155_2Contract.getAddress();

    const offer1: OTS_Util.OfferStruct = {
      id: BigInt(0),
      maker: account1,
      taker: "0x0000000000000000000000000000000000000000",
      makerFee: ethers.parseEther("0"),
      takerFee: ethers.parseEther("0"),
      makerTokenTypes: [BigInt(0)],
      takerTokenTypes: [BigInt(0)],
      makerTokenAddresses: ["0x0000000000000000000000000000000000000000"],
      takerTokenAddresses: ["0x0000000000000000000000000000000000000000"],
      makerTokenIds: [[BigInt(0)]],
      takerTokenIds: [[BigInt(0)]],
      makerTokenAmounts: [[ethers.parseEther("1")]],
      takerTokenAmounts: [[ethers.parseEther("1")]],
      makerTokenChainIds: [BigInt(0)],
      takerTokenChainIds: [BigInt(0)],
      makerSent: true,
      takerSent: false,
      status: BigInt(0)
    }

    for(let i = 0; i < 10; i++){
      const offerAddress = await otsAdminContract.predictOfferAddress(offer1);
      console.log(offerAddress)
    }
    // await t20_1Contract.connect(account1).approve(offerAddress, ethers.parseEther("80"));
    // await t20_2Contract.connect(account1).approve(offerAddress, ethers.parseEther("80"));
    // await t721_1Contract.connect(account1).setApprovalForAll(offerAddress, true);
    // await t721_2Contract.connect(account1).setApprovalForAll(offerAddress, true);
    // await t1155_1Contract.connect(account1).setApprovalForAll(offerAddress, true);
    // await t1155_2Contract.connect(account1).setApprovalForAll(offerAddress, true);

    //const createOffer = await otsAdminContract.connect(account1).createOffer(offer1, offerAddress, {value : offer1.makerTokenAmounts[0][0]});

    //const createOfferGas = await createOffer.wait();

    //console.log(`Create offer uses: ${createOfferGas?.gasUsed} gas`);

    // for (let i = 0; i < 9; i++) {
    //   await otsContract.connect(account1).createOffer(
    //     ethers.parseEther("10"),
    //     ethers.parseEther("0.1"),
    //     [t20_1Address, t20_2Address, t721_1Address, t721_2Address, t1155_1Address, t1155_2Address],
    //     [],
    //     [[ethers.parseEther("5")], [ethers.parseEther("5")], [BigInt(1)], [BigInt(1)], [BigInt(5), BigInt(5), BigInt(5)], [BigInt(5), BigInt(5), BigInt(5)]],
    //     [],
    //     [[BigInt(0)], [BigInt(0)], [BigInt(i+5)], [BigInt(i+5)], [BigInt(1), BigInt(2), BigInt(3)], [BigInt(4), BigInt(5), BigInt(6)]],
    //     [],
    //     {value: ethers.parseEther("10.1")}
    //   );
    // }

		return { account1, account2, otsAdminContract, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract, t20_1Address, t20_2Address, t721_1Address, t721_2Address, t1155_1Address, t1155_2Address };
	}

	describe("Accept Offer", async function () {
    it("User 2 Accepts Offer", async function () {
      const { account2, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract } = await loadFixture(deployContractsFixture);

      // const offerContract = new ethers.Contract(offerAddress, require("../artifacts/contracts/OTS_Offer.sol/OTS_Offer.json"), account2);
      // await t20_1Contract.connect(account2).approve(offerAddress, ethers.parseEther("50"));
      // await t20_2Contract.connect(account2).approve(offerAddress, ethers.parseEther("50"));
      // await t721_1Contract.connect(account2).setApprovalForAll(offerAddress, true);
      // await t721_2Contract.connect(account2).setApprovalForAll(offerAddress, true);
      // await t1155_1Contract.connect(account2).setApprovalForAll(offerAddress, true);
      // await t1155_2Contract.connect(account2).setApprovalForAll(offerAddress, true);

      // const acceptOffer = await offerContract.acceptOffer();

      // const acceptOfferGas = await acceptOffer.wait();

      // console.log(`Accept offer uses: ${acceptOfferGas?.gasUsed} gas`);

    });
  });
//   describe("Cancel Offer", async function () {
//     it("User 1 Cancels Offer", async function () {
//       const { account1, otsContract } = await loadFixture(deployContractsFixture);

//       const cancelOffer = await otsContract.connect(account1).cancelOffer(
//         BigInt(0)
//       );

//       const cancelOfferGas = await cancelOffer.wait();

//       console.log(`Cancel offer uses: ${cancelOfferGas?.gasUsed} gas`);

//     });
//   });
//   describe("Batch Cancel Offers", async function () {
//     it("Owner Batch Cancels Offers", async function () {
//       const { account1, otsContract } = await loadFixture(deployContractsFixture);

//       const cancelOffer = await otsContract.connect(account1).batchCancelOffers(
//         BigInt(0),
//         BigInt(9),
//       );

//       const cancelOfferGas = await cancelOffer.wait();

//       console.log(`Batch cancel offers uses: ${cancelOfferGas?.gasUsed} gas`);

//     });
//   });
//   describe("Retrieve Fees", async function () {
//     it("Owner retrieves fees", async function () {
//       const { account1, otsContract } = await loadFixture(deployContractsFixture);

//       const retrieveFees = await otsContract.connect(account1).retrieveProtocolFees();

//       const retrieveFeesGas = await retrieveFees.wait();

//       console.log(`Retrieve fees uses: ${retrieveFeesGas?.gasUsed} gas`);

//     });
//   });
//   describe("Set Fees", async function () {
//     it("Owner Sets fees", async function () {
//       const { account1, otsContract } = await loadFixture(deployContractsFixture);

//       const setFees = await otsContract.connect(account1).setBaseProtocolFee(ethers.parseEther("1"));

//       const setFeesGas = await setFees.wait();

//       console.log(`Set fees uses: ${setFeesGas?.gasUsed} gas`);

//     });
//   });
});