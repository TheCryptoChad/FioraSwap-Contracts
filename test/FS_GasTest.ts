import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { ethers } from 'hardhat';
import { FS_Test20_1, FS_Test20_2, FS_Test721_1, FS_Test721_2, FS_Test1155_1, FS_Test1155_2 } from '../typechain-types';
import * as FSVault from '../artifacts/contracts/FS_Vault.sol/FS_Vault.json';
import * as FSRewards from '../artifacts/contracts/FS_Rewards.sol/FS_Rewards.json';

const fullStatusLog = async (
	account1: any,
	account2: any,
	fsT20_1Contract: FS_Test20_1,
	fsT20_2Contract: FS_Test20_2,
	fsT721_1Contract: FS_Test721_1,
	fsT721_2Contract: FS_Test721_2,
	fsT1155_1Contract: FS_Test1155_1,
	fsT1155_2Contract: FS_Test1155_2
) => {
	console.log(`
  Account 1 owns:
  Address: ${account1.address}
  ETH: ${ethers.formatEther(await account1.provider.getBalance(account1))}
  FS_T20_1: ${ethers.formatEther(await fsT20_1Contract.balanceOf(account1))}
  FS_T20_2: ${ethers.formatEther(await fsT20_2Contract.balanceOf(account1))}
  FS_T721_1: ${(await fsT721_1Contract.ownerOf(BigInt(1))) === account1.address ? '#1, ' : ''}${(await fsT721_1Contract.ownerOf(BigInt(2))) === account1.address ? '#2, ' : ''}${
		(await fsT721_1Contract.ownerOf(BigInt(3))) === account1.address ? '#3, ' : ''
	}${(await fsT721_1Contract.ownerOf(BigInt(4))) === account1.address ? '#4' : ''}
  FS_T721_2: ${(await fsT721_2Contract.ownerOf(BigInt(1))) === account1.address ? '#1, ' : ''}${(await fsT721_2Contract.ownerOf(BigInt(2))) === account1.address ? '#2, ' : ''}${
		(await fsT721_2Contract.ownerOf(BigInt(3))) === account1.address ? '#3, ' : ''
	}${(await fsT721_2Contract.ownerOf(BigInt(4))) === account1.address ? '#4' : ''}
  FS_T1155_1: ${await fsT1155_1Contract.balanceOfBatch([account1, account1, account1, account1, account1, account1], [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)])}
  FS_T1155_2: ${await fsT1155_2Contract.balanceOfBatch([account1, account1, account1, account1, account1, account1], [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)])}

  Account 2 owns:
  Address: ${account2.address}
  ETH: ${ethers.formatEther(await account2.provider.getBalance(account2))}
  FS_T20_1: ${ethers.formatEther(await fsT20_1Contract.balanceOf(account2))}
  FS_T20_2: ${ethers.formatEther(await fsT20_2Contract.balanceOf(account2))}
  FS_T721_1: ${(await fsT721_1Contract.ownerOf(BigInt(1))) === account2.address ? '#1, ' : ''}${(await fsT721_1Contract.ownerOf(BigInt(2))) === account2.address ? '#2, ' : ''}${
		(await fsT721_1Contract.ownerOf(BigInt(3))) === account2.address ? '#3, ' : ''
	}${(await fsT721_1Contract.ownerOf(BigInt(4))) === account2.address ? '#4' : ''}
  FS_T721_2: ${(await fsT721_2Contract.ownerOf(BigInt(1))) === account2.address ? '#1, ' : ''}${(await fsT721_2Contract.ownerOf(BigInt(2))) === account2.address ? '#2, ' : ''}${
		(await fsT721_2Contract.ownerOf(BigInt(3))) === account2.address ? '#3, ' : ''
	}${(await fsT721_2Contract.ownerOf(BigInt(4))) === account2.address ? '#4' : ''}
  FS_T1155_1: ${await fsT1155_1Contract.balanceOfBatch([account2, account2, account2, account2, account2, account2], [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)])}
  FS_T1155_2: ${await fsT1155_2Contract.balanceOfBatch([account2, account2, account2, account2, account2, account2], [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)])}
  `);
};

describe('FioraSwap', function () {
	async function deployContractsFixture() {
		const [account1, account2] = await ethers.getSigners();

		const fsCoreFactory = await ethers.getContractFactory('FS_Core');
		const fsT20_1Factory = await ethers.getContractFactory('FS_Test20_1');
		const fsT20_2Factory = await ethers.getContractFactory('FS_Test20_2');
		const fsT721_1Factory = await ethers.getContractFactory('FS_Test721_1');
		const fsT721_2Factory = await ethers.getContractFactory('FS_Test721_2');
		const fsT1155_1Factory = await ethers.getContractFactory('FS_Test1155_1');
		const fsT1155_2Factory = await ethers.getContractFactory('FS_Test1155_2');

		const fsCoreContract = await fsCoreFactory.connect(account1).deploy(account1.address, account1.address);
		const fsCoreContractAddress = await fsCoreContract.getAddress();
		const fsVaultContractAddress = await fsCoreContract.getFsVaultAddress();
		const fsVaultContract = new ethers.Contract(fsVaultContractAddress, FSVault.abi, account1);
		const fsRewardsContractAddress = await fsCoreContract.getFsRewardsAddress();
		const fsRewardsContract = new ethers.Contract(fsRewardsContractAddress, FSRewards.abi, account1);

		const fsCoreContractGas = await ethers.provider.estimateGas({ data: fsCoreContract.interface.encodeDeploy([account1.address, account1.address]) });

		console.log(`Deploy contracts uses: ${fsCoreContractGas} gas`);

		const fsT20_1Contract = await fsT20_1Factory.connect(account1).deploy();
		const fsT20_2Contract = await fsT20_2Factory.connect(account1).deploy();
		const fsT721_1Contract = await fsT721_1Factory.connect(account1).deploy();
		const fsT721_2Contract = await fsT721_2Factory.connect(account1).deploy();
		const fsT1155_1Contract = await fsT1155_1Factory.connect(account1).deploy();
		const fsT1155_2Contract = await fsT1155_2Factory.connect(account1).deploy();

		await fsT20_1Contract.connect(account1).mint(account1, ethers.parseEther('80'));
		await fsT20_2Contract.connect(account1).mint(account1, ethers.parseEther('80'));

		await fsT20_1Contract.connect(account1).transfer(account2, ethers.parseEther('30'));
		await fsT20_2Contract.connect(account1).transfer(account2, ethers.parseEther('30'));

		await fsT721_1Contract.connect(account1).safeMint(account1);
		await fsT721_1Contract.connect(account1).safeMint(account1);
		await fsT721_1Contract.connect(account1).safeMint(account2);
		await fsT721_1Contract.connect(account1).safeMint(account2);

		await fsT721_2Contract.connect(account1).safeMint(account2);
		await fsT721_2Contract.connect(account1).safeMint(account2);
		await fsT721_2Contract.connect(account1).safeMint(account1);
		await fsT721_2Contract.connect(account1).safeMint(account1);

		await fsT1155_1Contract.connect(account1).mintBatch(account1, [BigInt(1), BigInt(2), BigInt(3)], [BigInt(50), BigInt(50), BigInt(50)], '0x');
		await fsT1155_1Contract.connect(account1).mintBatch(account2, [BigInt(4), BigInt(5), BigInt(6)], [BigInt(30), BigInt(30), BigInt(30)], '0x');

		await fsT1155_2Contract.connect(account1).mintBatch(account2, [BigInt(1), BigInt(2), BigInt(3)], [BigInt(30), BigInt(30), BigInt(30)], '0x');
		await fsT1155_2Contract.connect(account1).mintBatch(account1, [BigInt(4), BigInt(5), BigInt(6)], [BigInt(50), BigInt(50), BigInt(50)], '0x');

		const fsT20_1Address = await fsT20_1Contract.getAddress();
		const fsT20_2Address = await fsT20_2Contract.getAddress();
		const fsT721_1Address = await fsT721_1Contract.getAddress();
		const fsT721_2Address = await fsT721_2Contract.getAddress();
		const fsT1155_1Address = await fsT1155_1Contract.getAddress();
		const fsT1155_2Address = await fsT1155_2Contract.getAddress();

		await fullStatusLog(account1, account2, fsT20_1Contract, fsT20_2Contract, fsT721_1Contract, fsT721_2Contract, fsT1155_1Contract, fsT1155_2Contract);

		await fsT20_1Contract.connect(account1).approve(fsVaultContractAddress, ethers.parseEther('50'));
		await fsT20_2Contract.connect(account1).approve(fsVaultContractAddress, ethers.parseEther('50'));
		await fsT721_1Contract.connect(account1).setApprovalForAll(fsVaultContractAddress, true);
		await fsT721_2Contract.connect(account1).setApprovalForAll(fsVaultContractAddress, true);
		await fsT1155_1Contract.connect(account1).setApprovalForAll(fsVaultContractAddress, true);
		await fsT1155_2Contract.connect(account1).setApprovalForAll(fsVaultContractAddress, true);

		const messageNonce: number = Date.now();

		const encodedOffer = ethers.solidityPackedKeccak256(
			['address', 'address[]', 'uint256[]', 'address[]', 'uint256[]', 'uint256'],
			[
				account1.address,
				[fsT20_1Address, fsT20_2Address, fsT721_1Address, fsT721_1Address, fsT721_2Address, fsT721_2Address, fsT1155_1Address, fsT1155_2Address],
				[BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109)],
				[fsT20_1Address, fsT20_2Address, fsT721_1Address, fsT721_1Address, fsT721_2Address, fsT721_2Address, fsT1155_1Address, fsT1155_2Address],
				[BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109)],
				messageNonce,
			]
		);

		const encodeOffer = await fsCoreContract
			.connect(account1)
			.encodeOffer(
				account1.address,
				[fsT20_1Address, fsT20_2Address, fsT721_1Address, fsT721_1Address, fsT721_2Address, fsT721_2Address, fsT1155_1Address, fsT1155_2Address],
				[BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109)],
				[fsT20_1Address, fsT20_2Address, fsT721_1Address, fsT721_1Address, fsT721_2Address, fsT721_2Address, fsT1155_1Address, fsT1155_2Address],
				[BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109)],
				messageNonce,
				encodedOffer
			);

		console.log(encodedOffer);
		console.log(encodeOffer);

		const offer1 = {
			id: encodedOffer,
			maker: {
				walletAddress: account1,
				fee: ethers.parseEther('10'),
				native: ethers.parseEther('50'),
				sent: true,
			},
			taker: {
				walletAddress: '0x0000000000000000000000000000000000000000',
				fee: ethers.parseEther('0'),
				native: ethers.parseEther('30'),
				sent: false,
			},
			status: BigInt(1),
		};

		const message: string = `Create FS Offer:`;
		const messageHash = ethers.solidityPackedKeccak256(['string', 'bytes32', 'uint256'], [message, encodedOffer, messageNonce]);
		const messageBytes = Buffer.from(messageHash.slice(2), 'hex');
		const signedMessage: string = await account1.signMessage(messageBytes);

		const createOffer = await fsCoreContract.connect(account1).createOffer(
			offer1,
			[
				{
					target: fsT20_1Address,
					callData: fsT20_1Contract.interface.encodeFunctionData('transferFrom', [account1.address, fsVaultContractAddress, ethers.parseEther('50')]),
				},
				{
					target: fsT20_2Address,
					callData: fsT20_2Contract.interface.encodeFunctionData('transferFrom', [account1.address, fsVaultContractAddress, ethers.parseEther('50')]),
				},
				{
					target: fsT721_1Address,
					callData: fsT721_1Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [account1.address, fsVaultContractAddress, BigInt(1)]),
				},
				{
					target: fsT721_1Address,
					callData: fsT721_1Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [account1.address, fsVaultContractAddress, BigInt(2)]),
				},
				{
					target: fsT721_2Address,
					callData: fsT721_2Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [account1.address, fsVaultContractAddress, BigInt(3)]),
				},
				{
					target: fsT721_2Address,
					callData: fsT721_2Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [account1.address, fsVaultContractAddress, BigInt(4)]),
				},
				{
					target: fsT1155_1Address,
					callData: fsT1155_1Contract.interface.encodeFunctionData('safeBatchTransferFrom', [
						account1.address,
						fsVaultContractAddress,
						[BigInt(1), BigInt(2), BigInt(3)],
						[BigInt(50), BigInt(50), BigInt(50)],
						'0x',
					]),
				},
				{
					target: fsT1155_2Address,
					callData: fsT1155_2Contract.interface.encodeFunctionData('safeBatchTransferFrom', [
						account1.address,
						fsVaultContractAddress,
						[BigInt(4), BigInt(5), BigInt(6)],
						[BigInt(50), BigInt(50), BigInt(50)],
						'0x',
					]),
				},
			],
			message,
			messageNonce,
			signedMessage,
			{ value: BigInt(Number(offer1.maker.fee) + Number(offer1.maker.native)) }
		);

		const createOfferGas = await createOffer.wait();

		console.log(`Create offer uses: ${createOfferGas?.gasUsed} gas`);

		await fullStatusLog(account1, account2, fsT20_1Contract, fsT20_2Contract, fsT721_1Contract, fsT721_2Contract, fsT1155_1Contract, fsT1155_2Contract);

		return {
			account1,
			account2,
			offer1,
			fsCoreContractAddress,
			fsVaultContractAddress,
			fsRewardsContractAddress,
			fsCoreContract,
			fsVaultContract,
			fsRewardsContract,
			fsT20_1Contract,
			fsT20_2Contract,
			fsT721_1Contract,
			fsT721_2Contract,
			fsT1155_1Contract,
			fsT1155_2Contract,
			fsT20_1Address,
			fsT20_2Address,
			fsT721_1Address,
			fsT721_2Address,
			fsT1155_1Address,
			fsT1155_2Address,
		};
	}

	describe('Accept Offer', async function () {
		it('User 2 Accepts Offer', async function () {
			const {
				account1,
				account2,
				offer1,
				fsVaultContractAddress,
				fsCoreContract,
				fsT20_1Contract,
				fsT20_2Contract,
				fsT721_1Contract,
				fsT721_2Contract,
				fsT1155_1Contract,
				fsT1155_2Contract,
				fsT20_1Address,
				fsT20_2Address,
				fsT721_1Address,
				fsT721_2Address,
				fsT1155_1Address,
				fsT1155_2Address,
			} = await loadFixture(deployContractsFixture);

			await fsT20_1Contract.connect(account2).approve(fsVaultContractAddress, ethers.parseEther('30'));
			await fsT20_2Contract.connect(account2).approve(fsVaultContractAddress, ethers.parseEther('30'));
			await fsT721_1Contract.connect(account2).setApprovalForAll(fsVaultContractAddress, true);
			await fsT721_2Contract.connect(account2).setApprovalForAll(fsVaultContractAddress, true);
			await fsT1155_1Contract.connect(account2).setApprovalForAll(fsVaultContractAddress, true);
			await fsT1155_2Contract.connect(account2).setApprovalForAll(fsVaultContractAddress, true);

			const takerFee: bigint = ethers.parseEther('3');

			const message: string = `Accept FS Offer:`;
			const nonce: number = Date.now();
			const messageHash = ethers.solidityPackedKeccak256(['string', 'bytes32', 'uint256'], [message, offer1.id, nonce]);
			const messageBytes = Buffer.from(messageHash.slice(2), 'hex');
			const signedMessage: string = await account1.signMessage(messageBytes);

			const acceptOffer = await fsCoreContract.connect(account2).acceptOffer(
				offer1.id,
				takerFee,
				[
					{
						target: fsT20_1Address,
						callData: fsT20_1Contract.interface.encodeFunctionData('transferFrom', [account2.address, account1.address, ethers.parseEther('30')]),
					},
					{
						target: fsT20_2Address,
						callData: fsT20_2Contract.interface.encodeFunctionData('transferFrom', [account2.address, account1.address, ethers.parseEther('30')]),
					},
					{
						target: fsT721_1Address,
						callData: fsT721_1Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [account2.address, account1.address, BigInt(3)]),
					},
					{
						target: fsT721_1Address,
						callData: fsT721_1Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [account2.address, account1.address, BigInt(4)]),
					},
					{
						target: fsT721_2Address,
						callData: fsT721_2Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [account2.address, account1.address, BigInt(1)]),
					},
					{
						target: fsT721_2Address,
						callData: fsT721_2Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [account2.address, account1.address, BigInt(2)]),
					},
					{
						target: fsT1155_1Address,
						callData: fsT1155_1Contract.interface.encodeFunctionData('safeBatchTransferFrom', [
							account2.address,
							account1.address,
							[BigInt(4), BigInt(5), BigInt(6)],
							[BigInt(30), BigInt(30), BigInt(30)],
							'0x',
						]),
					},
					{
						target: fsT1155_2Address,
						callData: fsT1155_2Contract.interface.encodeFunctionData('safeBatchTransferFrom', [
							account2.address,
							account1.address,
							[BigInt(1), BigInt(2), BigInt(3)],
							[BigInt(30), BigInt(30), BigInt(30)],
							'0x',
						]),
					},
					{ target: fsT20_1Address, callData: fsT20_1Contract.interface.encodeFunctionData('transfer', [account2.address, ethers.parseEther('50')]) },
					{ target: fsT20_2Address, callData: fsT20_2Contract.interface.encodeFunctionData('transfer', [account2.address, ethers.parseEther('50')]) },
					{
						target: fsT721_1Address,
						callData: fsT721_1Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [fsVaultContractAddress, account2.address, BigInt(1)]),
					},
					{
						target: fsT721_1Address,
						callData: fsT721_1Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [fsVaultContractAddress, account2.address, BigInt(2)]),
					},
					{
						target: fsT721_2Address,
						callData: fsT721_2Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [fsVaultContractAddress, account2.address, BigInt(3)]),
					},
					{
						target: fsT721_2Address,
						callData: fsT721_2Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [fsVaultContractAddress, account2.address, BigInt(4)]),
					},
					{
						target: fsT1155_1Address,
						callData: fsT1155_1Contract.interface.encodeFunctionData('safeBatchTransferFrom', [
							fsVaultContractAddress,
							account2.address,
							[BigInt(1), BigInt(2), BigInt(3)],
							[BigInt(50), BigInt(50), BigInt(50)],
							'0x',
						]),
					},
					{
						target: fsT1155_2Address,
						callData: fsT1155_2Contract.interface.encodeFunctionData('safeBatchTransferFrom', [
							fsVaultContractAddress,
							account2.address,
							[BigInt(4), BigInt(5), BigInt(6)],
							[BigInt(50), BigInt(50), BigInt(50)],
							'0x',
						]),
					},
				],
				message,
				nonce,
				signedMessage,
				{ value: BigInt(Number(offer1.taker.native) + Number(takerFee)) }
			);

			const acceptOfferGas = await acceptOffer.wait();

			console.log(`Accept offer uses: ${acceptOfferGas?.gasUsed} gas`);

			console.log(`Collected Fees ${ethers.formatEther(await account1.provider.getBalance(await fsCoreContract.getAddress()))} ETH`);

			await fullStatusLog(account1, account2, fsT20_1Contract, fsT20_2Contract, fsT721_1Contract, fsT721_2Contract, fsT1155_1Contract, fsT1155_2Contract);
		});
	});

	describe('Cancel Offer', async function () {
		it('User 1 Cancels Offer', async function () {
			const {
				fsCoreContract,
				fsVaultContractAddress,
				account1,
				account2,
				offer1,
				fsT20_1Contract,
				fsT20_2Contract,
				fsT721_1Contract,
				fsT721_2Contract,
				fsT1155_1Contract,
				fsT1155_2Contract,
				fsT20_1Address,
				fsT20_2Address,
				fsT721_1Address,
				fsT721_2Address,
				fsT1155_1Address,
				fsT1155_2Address,
			} = await loadFixture(deployContractsFixture);

			const message: string = `Cancel FS Offer:`;
			const nonce: number = Date.now();
			const messageHash = ethers.solidityPackedKeccak256(['string', 'bytes32', 'uint256'], [message, offer1.id, nonce]);
			const messageBytes = Buffer.from(messageHash.slice(2), 'hex');
			const signedMessage: string = await account1.signMessage(messageBytes);

			const cancelOffer = await fsCoreContract.connect(account1).cancelOffer(
				offer1.id,
				[
					{ target: fsT20_1Address, callData: fsT20_1Contract.interface.encodeFunctionData('transfer', [account1.address, ethers.parseEther('50')]) },
					{ target: fsT20_2Address, callData: fsT20_2Contract.interface.encodeFunctionData('transfer', [account1.address, ethers.parseEther('50')]) },
					{
						target: fsT721_1Address,
						callData: fsT721_1Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [fsVaultContractAddress, account1.address, BigInt(1)]),
					},
					{
						target: fsT721_1Address,
						callData: fsT721_1Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [fsVaultContractAddress, account1.address, BigInt(2)]),
					},
					{
						target: fsT721_2Address,
						callData: fsT721_2Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [fsVaultContractAddress, account1.address, BigInt(3)]),
					},
					{
						target: fsT721_2Address,
						callData: fsT721_2Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [fsVaultContractAddress, account1.address, BigInt(4)]),
					},
					{
						target: fsT1155_1Address,
						callData: fsT1155_1Contract.interface.encodeFunctionData('safeBatchTransferFrom', [
							fsVaultContractAddress,
							account1.address,
							[BigInt(1), BigInt(2), BigInt(3)],
							[BigInt(50), BigInt(50), BigInt(50)],
							'0x',
						]),
					},
					{
						target: fsT1155_2Address,
						callData: fsT1155_2Contract.interface.encodeFunctionData('safeBatchTransferFrom', [
							fsVaultContractAddress,
							account1.address,
							[BigInt(4), BigInt(5), BigInt(6)],
							[BigInt(50), BigInt(50), BigInt(50)],
							'0x',
						]),
					},
				],
				message,
				nonce,
				signedMessage
			);

			const cancelOfferGas = await cancelOffer.wait();

			console.log(`Cancel offer uses: ${cancelOfferGas?.gasUsed} gas`);

			console.log(`Collected Fees ${ethers.formatEther(await account1.provider.getBalance(await fsCoreContract.getAddress()))} ETH`);

			await fullStatusLog(account1, account2, fsT20_1Contract, fsT20_2Contract, fsT721_1Contract, fsT721_2Contract, fsT1155_1Contract, fsT1155_2Contract);
		});
	});

	describe('Craft Reward', async function () {
		it('User 1 Crafts Reward', async function () {
			const { fsCoreContract, fsRewardsContract, fsRewardsContractAddress, account1 } = await loadFixture(deployContractsFixture);

			//Last digit 1-9 or A for 10
			const rewardId: string = '0x0000000000000000000000000000000000000000000000000000000000000001';
			const numericRewardId: bigint = BigInt(1);

			const message: string = `Craft FS Reward:`;
			const nonce: number = Date.now();
			const messageHash = ethers.solidityPackedKeccak256(['string', 'bytes32', 'uint256'], [message, rewardId, nonce]);
			const messageBytes = Buffer.from(messageHash.slice(2), 'hex');
			const signedMessage: string = await account1.signMessage(messageBytes);

			const craftReward = await fsCoreContract
				.connect(account1)
				.craftReward(
					rewardId,
					[{ target: fsRewardsContractAddress, callData: fsRewardsContract.interface.encodeFunctionData('mintBatch', [account1.address, [numericRewardId], [BigInt(1)], '0x']) }],
					message,
					nonce,
					signedMessage
				);

			const craftRewardGas = await craftReward.wait();

			console.log(`Craft reward uses: ${craftRewardGas?.gasUsed} gas`);

			console.log(`User 1 owns: ${await fsRewardsContract.balanceOf(account1, numericRewardId)} Reward #${Number(numericRewardId)}`);
		});
	});
});

// tokens: [
//   {standard: BigInt(0), contractAddress: fsT20_1Address, ids: [BigInt(0)], amounts: [ethers.parseEther("50")], network: [BigInt(2109)]},
//   {standard: BigInt(0), contractAddress: fsT20_2Address, ids: [BigInt(0)], amounts: [ethers.parseEther("50")], network: [BigInt(2109)]},
//   {standard: BigInt(1), contractAddress: fsT721_1Address, ids: [BigInt(1)], amounts: [BigInt(0)], network: [BigInt(2109)]},
//   {standard: BigInt(1), contractAddress: fsT721_1Address, ids: [BigInt(2)], amounts: [BigInt(0)], network: [BigInt(2109)]},
//   {standard: BigInt(1), contractAddress: fsT721_2Address, ids: [BigInt(3)], amounts: [BigInt(0)], network: [BigInt(2109)]},
//   {standard: BigInt(1), contractAddress: fsT721_2Address, ids: [BigInt(4)], amounts: [BigInt(0)], network: [BigInt(2109)]},
//   {standard: BigInt(2), contractAddress: fsT1155_1Address, ids: [BigInt(1), BigInt(2), BigInt(3)], amounts: [BigInt(50), BigInt(50), BigInt(50)], network: [BigInt(2109)]},
//   {standard: BigInt(2), contractAddress: fsT1155_2Address, ids: [BigInt(4), BigInt(5), BigInt(6)], amounts: [BigInt(50), BigInt(50), BigInt(50)], network: [BigInt(2109)]},
// ],

// tokens: [
//   {standard: BigInt(0), contractAddress: fsT20_1Address, ids: [BigInt(0)], amounts: [ethers.parseEther("30")], network: [BigInt(2109)]},
//   {standard: BigInt(0), contractAddress: fsT20_2Address, ids: [BigInt(0)], amounts: [ethers.parseEther("30")], network: [BigInt(2109)]},
//   {standard: BigInt(1), contractAddress: fsT721_1Address, ids: [BigInt(3)], amounts: [BigInt(0)], network: [BigInt(2109)]},
//   {standard: BigInt(1), contractAddress: fsT721_1Address, ids: [BigInt(4)], amounts: [BigInt(0)], network: [BigInt(2109)]},
//   {standard: BigInt(1), contractAddress: fsT721_2Address, ids: [BigInt(1)], amounts: [BigInt(0)], network: [BigInt(2109)]},
//   {standard: BigInt(1), contractAddress: fsT721_2Address, ids: [BigInt(2)], amounts: [BigInt(0)], network: [BigInt(2109)]},
//   {standard: BigInt(2), contractAddress: fsT1155_1Address, ids: [BigInt(4), BigInt(5), BigInt(6)], amounts: [BigInt(30), BigInt(30), BigInt(30)], network: [BigInt(2109)]},
//   {standard: BigInt(2), contractAddress: fsT1155_2Address, ids: [BigInt(1), BigInt(2), BigInt(3)], amounts: [BigInt(30), BigInt(30), BigInt(30)], network: [BigInt(2109)]},
// ],

// makerTokenStandards: [BigInt(0), BigInt(0), BigInt(1), BigInt(1), BigInt(1), BigInt(1), BigInt(2), BigInt(2)],
// makerTokenAddresses: [fsT20_1Address, fsT20_2Address, fsT721_1Address, fsT721_1Address, fsT721_2Address, fsT721_2Address, fsT1155_1Address, fsT1155_2Address],
// makerTokenIds: [[BigInt(0)], [BigInt(0)], [BigInt(1)], [BigInt(2)], [BigInt(3)], [BigInt(4)], [BigInt(1), BigInt(2), BigInt(3)], [BigInt(4), BigInt(5), BigInt(6)]],
// makerTokenAmounts: [
// 	[ethers.parseEther('50')],
// 	[ethers.parseEther('50')],
// 	[BigInt(1)],
// 	[BigInt(1)],
// 	[BigInt(1)],
// 	[BigInt(1)],
// 	[BigInt(50), BigInt(50), BigInt(50)],
// 	[BigInt(50), BigInt(50), BigInt(50)],
// ],
// makerTokenNetworks: [BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109)],
// takerTokenStandards: [BigInt(0), BigInt(0), BigInt(1), BigInt(1), BigInt(1), BigInt(1), BigInt(2), BigInt(2)],
// takerTokenAddresses: [fsT20_1Address, fsT20_2Address, fsT721_1Address, fsT721_1Address, fsT721_2Address, fsT721_2Address, fsT1155_1Address, fsT1155_2Address],
// takerTokenIds: [[BigInt(0)], [BigInt(0)], [BigInt(3)], [BigInt(4)], [BigInt(1)], [BigInt(2)], [BigInt(4), BigInt(5), BigInt(6)], [BigInt(1), BigInt(2), BigInt(3)]],
// takerTokenAmounts: [
// 	[ethers.parseEther('30')],
// 	[ethers.parseEther('30')],
// 	[BigInt(1)],
// 	[BigInt(1)],
// 	[BigInt(1)],
// 	[BigInt(1)],
// 	[BigInt(30), BigInt(30), BigInt(30)],
// 	[BigInt(30), BigInt(30), BigInt(30)],
// ],
// takerTokenNetworks: [BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109)],
