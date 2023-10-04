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

    const otsOfferContract = await otsOfferFactory.connect(account1).deploy(offer0, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000");
    const otsOfferContractAddress = await otsOfferContract.getAddress();
		const otsAdminContract = await otsAdminFactory.connect(account1).deploy(otsOfferContractAddress, account2.address);

    const otsOfferContractGas = await ethers.provider.estimateGas({data: otsOfferContract.interface.encodeDeploy([offer0, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000"])});
    const otsAdminContractGas = await ethers.provider.estimateGas({data: otsAdminContract.interface.encodeDeploy([otsOfferContractAddress, account2.address])});

    // console.log(`Deploy offer template uses: ${otsOfferContractGas} gas`);
    // console.log(`Deploy admin contract uses: ${otsAdminContractGas} gas`);

		const t20_1Contract = await t20_1Factory.connect(account1).deploy();
		const t20_2Contract = await t20_2Factory.connect(account1).deploy();
		const t721_1Contract = await t721_1Factory.connect(account1).deploy();
		const t721_2Contract = await t721_2Factory.connect(account1).deploy();
		const t1155_1Contract = await t1155_1Factory.connect(account1).deploy();
		const t1155_2Contract = await t1155_2Factory.connect(account1).deploy();

		await t20_1Contract.connect(account1).transfer(account2, ethers.parseEther("30"));
		await t20_2Contract.connect(account1).transfer(account2, ethers.parseEther("30"));

		await t721_1Contract.connect(account1).safeMint(account1);
		await t721_1Contract.connect(account1).safeMint(account1);
    await t721_1Contract.connect(account1).safeMint(account2);
		await t721_1Contract.connect(account1).safeMint(account2);

    await t721_2Contract.connect(account1).safeMint(account2);
		await t721_2Contract.connect(account1).safeMint(account2);
    await t721_2Contract.connect(account1).safeMint(account1);
		await t721_2Contract.connect(account1).safeMint(account1);

		await t1155_1Contract.connect(account1).mintBatch(account1, [BigInt(1), BigInt(2), BigInt(3)], [BigInt(50), BigInt(50), BigInt(50)], "0x");
		await t1155_1Contract.connect(account1).mintBatch(account2, [BigInt(4), BigInt(5), BigInt(6)], [BigInt(30), BigInt(30), BigInt(30)], "0x");

		await t1155_2Contract.connect(account1).mintBatch(account2, [BigInt(1), BigInt(2), BigInt(3)], [BigInt(30), BigInt(30), BigInt(30)], "0x");
		await t1155_2Contract.connect(account1).mintBatch(account1, [BigInt(4), BigInt(5), BigInt(6)], [BigInt(50), BigInt(50), BigInt(50)], "0x");

    const otsAdminAddress = await otsAdminContract.getAddress();
    const t20_1Address = await t20_1Contract.getAddress();
    const t20_2Address = await t20_2Contract.getAddress();
    const t721_1Address = await t721_1Contract.getAddress();
    const t721_2Address = await t721_2Contract.getAddress();
    const t1155_1Address = await t1155_1Contract.getAddress();
    const t1155_2Address = await t1155_2Contract.getAddress();

    // const offer1: OTS_Util.OfferStruct = {
    //   id: BigInt(0),
    //   maker: account1,
    //   taker: "0x0000000000000000000000000000000000000000",
    //   makerFee: ethers.parseEther("0"),
    //   takerFee: ethers.parseEther("0"),
    //   makerTokenTypes: [BigInt(0)],
    //   takerTokenTypes: [BigInt(0)],
    //   makerTokenAddresses: ["0x0000000000000000000000000000000000000000"],
    //   takerTokenAddresses: ["0x0000000000000000000000000000000000000000"],
    //   makerTokenIds: [[BigInt(0)]],
    //   takerTokenIds: [[BigInt(0)]],
    //   makerTokenAmounts: [[ethers.parseEther("1")]],
    //   takerTokenAmounts: [[ethers.parseEther("1")]],
    //   makerTokenChainIds: [BigInt(0)],
    //   takerTokenChainIds: [BigInt(0)],
    //   makerSent: true,
    //   takerSent: false,
    //   status: BigInt(0)
    // }

    const offer1: OTS_Util.OfferStruct = {
      id: BigInt(1),
      maker: account1,
      taker: "0x0000000000000000000000000000000000000000",
      makerFee: ethers.parseEther("0"),
      takerFee: ethers.parseEther("0"),
      makerTokenTypes: [BigInt(0), BigInt(1), BigInt(1), BigInt(2), BigInt(2), BigInt(2), BigInt(2), BigInt(3), BigInt(3)],
      takerTokenTypes: [BigInt(0), BigInt(1), BigInt(1), BigInt(2), BigInt(2), BigInt(2), BigInt(2), BigInt(3), BigInt(3)],
      makerTokenAddresses: ["0x0000000000000000000000000000000000000000", t20_1Address, t20_2Address, t721_1Address, t721_1Address, t721_2Address, t721_2Address, t1155_1Address, t1155_2Address],
      takerTokenAddresses: ["0x0000000000000000000000000000000000000000", t20_1Address, t20_2Address, t721_1Address, t721_1Address, t721_2Address, t721_2Address, t1155_1Address, t1155_2Address],
      makerTokenIds: [[BigInt(0)], [BigInt(0)], [BigInt(0)], [BigInt(1)], [BigInt(2)], [BigInt(3)], [BigInt(4)], [BigInt(1), BigInt(2), BigInt(3)], [BigInt(4), BigInt(5), BigInt(6)]],
      takerTokenIds: [[BigInt(0)], [BigInt(0)], [BigInt(0)], [BigInt(3)], [BigInt(4)], [BigInt(1)], [BigInt(2)], [BigInt(4), BigInt(5), BigInt(6)], [BigInt(1), BigInt(2), BigInt(3)]],
      makerTokenAmounts: [[ethers.parseEther("50")], [ethers.parseEther("50")], [ethers.parseEther("50")], [BigInt(0)], [BigInt(0)], [BigInt(0)], [BigInt(0)], [BigInt(50), BigInt(50), BigInt(50)], [BigInt(50), BigInt(50), BigInt(50)]],
      takerTokenAmounts: [[ethers.parseEther("30")], [ethers.parseEther("30")], [ethers.parseEther("30")], [BigInt(0)], [BigInt(0)], [BigInt(0)], [BigInt(0)], [BigInt(30), BigInt(30), BigInt(30)], [BigInt(30), BigInt(30), BigInt(30)]],
      makerTokenChainIds: [BigInt(0), BigInt(1), BigInt(1), BigInt(2), BigInt(2), BigInt(2), BigInt(2), BigInt(3), BigInt(3)],
      takerTokenChainIds: [BigInt(0), BigInt(1), BigInt(1), BigInt(2), BigInt(2), BigInt(2), BigInt(2), BigInt(3), BigInt(3)],
      makerSent: true,
      takerSent: false,
      status: BigInt(0)
    }

    const offerAddress = await otsAdminContract.predictOfferAddress(offer1);
  
    await t20_1Contract.connect(account1).approve(offerAddress, ethers.parseEther("50"));
    await t20_2Contract.connect(account1).approve(offerAddress, ethers.parseEther("50"));
    await t721_1Contract.connect(account1).setApprovalForAll(offerAddress, true);
    await t721_2Contract.connect(account1).setApprovalForAll(offerAddress, true);
    await t1155_1Contract.connect(account1).setApprovalForAll(offerAddress, true);
    await t1155_2Contract.connect(account1).setApprovalForAll(offerAddress, true);

    //await fullStatusLog(account1, account2, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract);

    const messageHash = ethers.solidityPackedKeccak256(["string", "uint"], ["Authorized by OTS", offer1.id]);
    const messageBytes = Buffer.from(messageHash.slice(2), 'hex');
    const signedMessage: string = await account2.signMessage(messageBytes);

    const createOffer = await otsAdminContract.connect(account1).createOffer(offer1, offerAddress, messageHash, signedMessage, {value : offer1.makerTokenAmounts[0][0]});

    const createOfferGas = await createOffer.wait();

    // console.log(`Create offer uses: ${createOfferGas?.gasUsed} gas`);

    //await fullStatusLog(account1, account2, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract);

		return { account1, account2, offer1, offerAddress, otsAdminContract, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract, t20_1Address, t20_2Address, t721_1Address, t721_2Address, t1155_1Address, t1155_2Address };
	}


	describe("Accept Offer", async function () {
    it("User 2 Accepts Offer", async function () {
      const { offer1, offerAddress, account1, account2, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract } = await loadFixture(deployContractsFixture);

      await t20_1Contract.connect(account2).approve(offerAddress, ethers.parseEther("30"));
      await t20_2Contract.connect(account2).approve(offerAddress, ethers.parseEther("30"));
      await t721_1Contract.connect(account2).setApprovalForAll(offerAddress, true);
      await t721_2Contract.connect(account2).setApprovalForAll(offerAddress, true);
      await t1155_1Contract.connect(account2).setApprovalForAll(offerAddress, true);
      await t1155_2Contract.connect(account2).setApprovalForAll(offerAddress, true);

      const offerAbi = require('../artifacts/contracts/OTS_Offer.sol/OTS_Offer.json').abi;
      const offerContract = new ethers.Contract(offerAddress, offerAbi, account2);

      const messageHash = ethers.solidityPackedKeccak256(["string", "uint"], ["Authorized by OTS", BigInt(0)]);
      const messageBytes = Buffer.from(messageHash.slice(2), 'hex');
      const signedMessage: string = await account2.signMessage(messageBytes);

      const acceptOffer = await offerContract.acceptOffer(BigInt(0), messageHash, signedMessage, {value: offer1.takerTokenAmounts[0][0]});

      const acceptOfferGas = await acceptOffer.wait();

      // console.log(`Accept offer uses: ${acceptOfferGas?.gasUsed} gas`);

      //await fullStatusLog(account1, account2, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract);
    });
  });


  // describe("Cancel Offer", async function () {
  //   it("User 1 Cancels Offer", async function () {
  //     const { offer1, offerAddress, account1, account2, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract } = await loadFixture(deployContractsFixture);

  //     const offerAbi = require('../artifacts/contracts/OTS_Offer.sol/OTS_Offer.json').abi;
  //     const offerContract = new ethers.Contract(offerAddress, offerAbi, account2);
  //     const cancelOffer = await offerContract.cancelOffer();

  //     const cancelOfferGas = await cancelOffer.wait();

  //     console.log(`Cancel offer uses: ${cancelOfferGas?.gasUsed} gas`);

  //     await fullStatusLog(account1, account2, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract);
  //   });
  // });


  // describe("Batch Cancel Offers", async function () {
  //   it("Owner Batch Cancels Offers", async function () {
  //     const { offer1, otsAdminContract, offerAddress, account1, account2, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract } = await loadFixture(deployContractsFixture);

  //     for(let i = 2; i < 11; i++) {
  //       const offer: OTS_Util.OfferStruct = {
  //         id: BigInt(i),
  //         maker: account1,
  //         taker: "0x0000000000000000000000000000000000000000",
  //         makerFee: ethers.parseEther("0"),
  //         takerFee: ethers.parseEther("0"),
  //         makerTokenTypes: [BigInt(0)],
  //         takerTokenTypes: [BigInt(0)],
  //         makerTokenAddresses: ["0x0000000000000000000000000000000000000000"],
  //         takerTokenAddresses: ["0x0000000000000000000000000000000000000000"],
  //         makerTokenIds: [[BigInt(0)]],
  //         takerTokenIds: [[BigInt(0)]],
  //         makerTokenAmounts: [[ethers.parseEther("1")]],
  //         takerTokenAmounts: [[ethers.parseEther("1")]],
  //         makerTokenChainIds: [BigInt(0)],
  //         takerTokenChainIds: [BigInt(0)],
  //         makerSent: true,
  //         takerSent: false,
  //         status: BigInt(0)
  //       }
  //       const offerAddr = await otsAdminContract.predictOfferAddress(offer);
  //       await otsAdminContract.connect(account1).createOffer(offer, offerAddr, {value : offer.makerTokenAmounts[0][0]});
  //     }

  //     const cancelOffers = await otsAdminContract.connect(account1).batchCancelOffers(BigInt(1), BigInt(10));
  //     const cancelOffersGas = await cancelOffers.wait();

  //     console.log(`Batch cancel offers uses: ${cancelOffersGas?.gasUsed} gas`);

  //     await fullStatusLog(account1, account2, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract);
  //   });
  // });


  // describe("Retrieve Fees", async function () {
  //   it("Owner retrieves fees", async function () {
  //     const { offer1, otsAdminContract, offerAddress, account1, account2, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract } = await loadFixture(deployContractsFixture);

  //     const retrieveFees = await otsAdminContract.connect(account1).collectFees();

  //     const retrieveFeesGas = await retrieveFees.wait();

  //     console.log(`Retrieve fees uses: ${retrieveFeesGas?.gasUsed} gas`);

  //   });
  // });
});