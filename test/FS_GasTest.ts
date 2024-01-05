import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { ethers } from 'hardhat';
import { Test20_1, Test20_2, Test721_1, Test721_2, Test1155_1, Test1155_2 } from '../typechain-types';
import * as FSVault from '../artifacts/contracts/FS_Vault.sol/FS_Vault.json';

const fullStatusLog = async (
	account1: any,
	account2: any,
	t20_1Contract: Test20_1,
	t20_2Contract: Test20_2,
	t721_1Contract: Test721_1,
	t721_2Contract: Test721_2,
	t1155_1Contract: Test1155_1,
	t1155_2Contract: Test1155_2
) => {
	console.log(`
  Account 1 owns:
  Address: ${account1.address}
  ETH: ${ethers.formatEther(await account1.provider.getBalance(account1))}
  T20_1: ${ethers.formatEther(await t20_1Contract.balanceOf(account1))}
  T20_2: ${ethers.formatEther(await t20_2Contract.balanceOf(account1))}
  T721_1: ${(await t721_1Contract.ownerOf(BigInt(1))) === account1.address ? '#1, ' : ''}${(await t721_1Contract.ownerOf(BigInt(2))) === account1.address ? '#2, ' : ''}${
		(await t721_1Contract.ownerOf(BigInt(3))) === account1.address ? '#3, ' : ''
	}${(await t721_1Contract.ownerOf(BigInt(4))) === account1.address ? '#4' : ''}
  T721_2: ${(await t721_2Contract.ownerOf(BigInt(1))) === account1.address ? '#1, ' : ''}${(await t721_2Contract.ownerOf(BigInt(2))) === account1.address ? '#2, ' : ''}${
		(await t721_2Contract.ownerOf(BigInt(3))) === account1.address ? '#3, ' : ''
	}${(await t721_2Contract.ownerOf(BigInt(4))) === account1.address ? '#4' : ''}
  T1155_1: ${await t1155_1Contract.balanceOfBatch([account1, account1, account1, account1, account1, account1], [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)])}
  T1155_2: ${await t1155_2Contract.balanceOfBatch([account1, account1, account1, account1, account1, account1], [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)])}

  Account 2 owns:
  Address: ${account2.address}
  ETH: ${ethers.formatEther(await account2.provider.getBalance(account2))}
  T20_1: ${ethers.formatEther(await t20_1Contract.balanceOf(account2))}
  T20_2: ${ethers.formatEther(await t20_2Contract.balanceOf(account2))}
  T721_1: ${(await t721_1Contract.ownerOf(BigInt(1))) === account2.address ? '#1, ' : ''}${(await t721_1Contract.ownerOf(BigInt(2))) === account2.address ? '#2, ' : ''}${
		(await t721_1Contract.ownerOf(BigInt(3))) === account2.address ? '#3, ' : ''
	}${(await t721_1Contract.ownerOf(BigInt(4))) === account2.address ? '#4' : ''}
  T721_2: ${(await t721_2Contract.ownerOf(BigInt(1))) === account2.address ? '#1, ' : ''}${(await t721_2Contract.ownerOf(BigInt(2))) === account2.address ? '#2, ' : ''}${
		(await t721_2Contract.ownerOf(BigInt(3))) === account2.address ? '#3, ' : ''
	}${(await t721_2Contract.ownerOf(BigInt(4))) === account2.address ? '#4' : ''}
  T1155_1: ${await t1155_1Contract.balanceOfBatch([account2, account2, account2, account2, account2, account2], [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)])}
  T1155_2: ${await t1155_2Contract.balanceOfBatch([account2, account2, account2, account2, account2, account2], [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)])}
  `);
};

describe('FioraSwap', function () {
	async function deployContractsFixture() {
		const [account1, account2] = await ethers.getSigners();

		const fsCoreFactory = await ethers.getContractFactory('FS_Core');
		const t20_1Factory = await ethers.getContractFactory('Test20_1');
		const t20_2Factory = await ethers.getContractFactory('Test20_2');
		const t721_1Factory = await ethers.getContractFactory('Test721_1');
		const t721_2Factory = await ethers.getContractFactory('Test721_2');
		const t1155_1Factory = await ethers.getContractFactory('Test1155_1');
		const t1155_2Factory = await ethers.getContractFactory('Test1155_2');

		const fsCoreContract = await fsCoreFactory.connect(account1).deploy(account1.address, account1.address);
		const fsCoreContractAddress = await fsCoreContract.getAddress();
		const fsVaultContractAddress = await fsCoreContract.getFsVaultAddress();
		const fsVaultContract = new ethers.Contract(fsVaultContractAddress, FSVault.abi, account1);

		const fsCoreContractGas = await ethers.provider.estimateGas({ data: fsCoreContract.interface.encodeDeploy([account1.address, account1.address]) });

		console.log(`Deploy contracts uses: ${fsCoreContractGas} gas`);

		const t20_1Contract = await t20_1Factory.connect(account1).deploy();
		const t20_2Contract = await t20_2Factory.connect(account1).deploy();
		const t721_1Contract = await t721_1Factory.connect(account1).deploy();
		const t721_2Contract = await t721_2Factory.connect(account1).deploy();
		const t1155_1Contract = await t1155_1Factory.connect(account1).deploy();
		const t1155_2Contract = await t1155_2Factory.connect(account1).deploy();

		await t20_1Contract.connect(account1).transfer(account2, ethers.parseEther('30'));
		await t20_2Contract.connect(account1).transfer(account2, ethers.parseEther('30'));

		await t721_1Contract.connect(account1).safeMint(account1);
		await t721_1Contract.connect(account1).safeMint(account1);
		await t721_1Contract.connect(account1).safeMint(account2);
		await t721_1Contract.connect(account1).safeMint(account2);

		await t721_2Contract.connect(account1).safeMint(account2);
		await t721_2Contract.connect(account1).safeMint(account2);
		await t721_2Contract.connect(account1).safeMint(account1);
		await t721_2Contract.connect(account1).safeMint(account1);

		await t1155_1Contract.connect(account1).mintBatch(account1, [BigInt(1), BigInt(2), BigInt(3)], [BigInt(50), BigInt(50), BigInt(50)], '0x');
		await t1155_1Contract.connect(account1).mintBatch(account2, [BigInt(4), BigInt(5), BigInt(6)], [BigInt(30), BigInt(30), BigInt(30)], '0x');

		await t1155_2Contract.connect(account1).mintBatch(account2, [BigInt(1), BigInt(2), BigInt(3)], [BigInt(30), BigInt(30), BigInt(30)], '0x');
		await t1155_2Contract.connect(account1).mintBatch(account1, [BigInt(4), BigInt(5), BigInt(6)], [BigInt(50), BigInt(50), BigInt(50)], '0x');

		const t20_1Address = await t20_1Contract.getAddress();
		const t20_2Address = await t20_2Contract.getAddress();
		const t721_1Address = await t721_1Contract.getAddress();
		const t721_2Address = await t721_2Contract.getAddress();
		const t1155_1Address = await t1155_1Contract.getAddress();
		const t1155_2Address = await t1155_2Contract.getAddress();

		await fullStatusLog(account1, account2, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract);

		await t20_1Contract.connect(account1).approve(fsVaultContractAddress, ethers.parseEther('50'));
		await t20_2Contract.connect(account1).approve(fsVaultContractAddress, ethers.parseEther('50'));
		await t721_1Contract.connect(account1).setApprovalForAll(fsVaultContractAddress, true);
		await t721_2Contract.connect(account1).setApprovalForAll(fsVaultContractAddress, true);
		await t1155_1Contract.connect(account1).setApprovalForAll(fsVaultContractAddress, true);
		await t1155_2Contract.connect(account1).setApprovalForAll(fsVaultContractAddress, true);

		const messageNonce: number = Date.now();

		const encodedOffer = ethers.solidityPackedKeccak256(
			['address', 'address[]', 'uint256[]', 'address[]', 'uint256[]', 'uint256'],
			[
				account1.address,
				[t20_1Address, t20_2Address, t721_1Address, t721_1Address, t721_2Address, t721_2Address, t1155_1Address, t1155_2Address],
				[BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109)],
				[t20_1Address, t20_2Address, t721_1Address, t721_1Address, t721_2Address, t721_2Address, t1155_1Address, t1155_2Address],
				[BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109)],
				messageNonce,
			]
		);

		const encodeOffer = await fsCoreContract
			.connect(account1)
			.encodeOffer(
				account1.address,
				[t20_1Address, t20_2Address, t721_1Address, t721_1Address, t721_2Address, t721_2Address, t1155_1Address, t1155_2Address],
				[BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109), BigInt(2109)],
				[t20_1Address, t20_2Address, t721_1Address, t721_1Address, t721_2Address, t721_2Address, t1155_1Address, t1155_2Address],
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
					target: t20_1Address,
					callData: t20_1Contract.interface.encodeFunctionData('transferFrom', [account1.address, fsVaultContractAddress, ethers.parseEther('50')]),
				},
				{
					target: t20_2Address,
					callData: t20_2Contract.interface.encodeFunctionData('transferFrom', [account1.address, fsVaultContractAddress, ethers.parseEther('50')]),
				},
				{
					target: t721_1Address,
					callData: t721_1Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [account1.address, fsVaultContractAddress, BigInt(1)]),
				},
				{
					target: t721_1Address,
					callData: t721_1Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [account1.address, fsVaultContractAddress, BigInt(2)]),
				},
				{
					target: t721_2Address,
					callData: t721_2Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [account1.address, fsVaultContractAddress, BigInt(3)]),
				},
				{
					target: t721_2Address,
					callData: t721_2Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [account1.address, fsVaultContractAddress, BigInt(4)]),
				},
				{
					target: t1155_1Address,
					callData: t1155_1Contract.interface.encodeFunctionData('safeBatchTransferFrom', [
						account1.address,
						fsVaultContractAddress,
						[BigInt(1), BigInt(2), BigInt(3)],
						[BigInt(50), BigInt(50), BigInt(50)],
						'0x',
					]),
				},
				{
					target: t1155_2Address,
					callData: t1155_2Contract.interface.encodeFunctionData('safeBatchTransferFrom', [
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

		await fullStatusLog(account1, account2, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract);

		return {
			account1,
			account2,
			offer1,
			fsCoreContractAddress,
			fsVaultContractAddress,
			fsCoreContract,
			fsVaultContract,
			t20_1Contract,
			t20_2Contract,
			t721_1Contract,
			t721_2Contract,
			t1155_1Contract,
			t1155_2Contract,
			t20_1Address,
			t20_2Address,
			t721_1Address,
			t721_2Address,
			t1155_1Address,
			t1155_2Address,
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
				t20_1Contract,
				t20_2Contract,
				t721_1Contract,
				t721_2Contract,
				t1155_1Contract,
				t1155_2Contract,
				t20_1Address,
				t20_2Address,
				t721_1Address,
				t721_2Address,
				t1155_1Address,
				t1155_2Address,
			} = await loadFixture(deployContractsFixture);

			await t20_1Contract.connect(account2).approve(fsVaultContractAddress, ethers.parseEther('30'));
			await t20_2Contract.connect(account2).approve(fsVaultContractAddress, ethers.parseEther('30'));
			await t721_1Contract.connect(account2).setApprovalForAll(fsVaultContractAddress, true);
			await t721_2Contract.connect(account2).setApprovalForAll(fsVaultContractAddress, true);
			await t1155_1Contract.connect(account2).setApprovalForAll(fsVaultContractAddress, true);
			await t1155_2Contract.connect(account2).setApprovalForAll(fsVaultContractAddress, true);

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
						target: t20_1Address,
						callData: t20_1Contract.interface.encodeFunctionData('transferFrom', [account2.address, account1.address, ethers.parseEther('30')]),
					},
					{
						target: t20_2Address,
						callData: t20_2Contract.interface.encodeFunctionData('transferFrom', [account2.address, account1.address, ethers.parseEther('30')]),
					},
					{
						target: t721_1Address,
						callData: t721_1Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [account2.address, account1.address, BigInt(3)]),
					},
					{
						target: t721_1Address,
						callData: t721_1Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [account2.address, account1.address, BigInt(4)]),
					},
					{
						target: t721_2Address,
						callData: t721_2Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [account2.address, account1.address, BigInt(1)]),
					},
					{
						target: t721_2Address,
						callData: t721_2Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [account2.address, account1.address, BigInt(2)]),
					},
					{
						target: t1155_1Address,
						callData: t1155_1Contract.interface.encodeFunctionData('safeBatchTransferFrom', [
							account2.address,
							account1.address,
							[BigInt(4), BigInt(5), BigInt(6)],
							[BigInt(30), BigInt(30), BigInt(30)],
							'0x',
						]),
					},
					{
						target: t1155_2Address,
						callData: t1155_2Contract.interface.encodeFunctionData('safeBatchTransferFrom', [
							account2.address,
							account1.address,
							[BigInt(1), BigInt(2), BigInt(3)],
							[BigInt(30), BigInt(30), BigInt(30)],
							'0x',
						]),
					},
					{ target: t20_1Address, callData: t20_1Contract.interface.encodeFunctionData('transfer', [account2.address, ethers.parseEther('50')]) },
					{ target: t20_2Address, callData: t20_2Contract.interface.encodeFunctionData('transfer', [account2.address, ethers.parseEther('50')]) },
					{
						target: t721_1Address,
						callData: t721_1Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [fsVaultContractAddress, account2.address, BigInt(1)]),
					},
					{
						target: t721_1Address,
						callData: t721_1Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [fsVaultContractAddress, account2.address, BigInt(2)]),
					},
					{
						target: t721_2Address,
						callData: t721_2Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [fsVaultContractAddress, account2.address, BigInt(3)]),
					},
					{
						target: t721_2Address,
						callData: t721_2Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [fsVaultContractAddress, account2.address, BigInt(4)]),
					},
					{
						target: t1155_1Address,
						callData: t1155_1Contract.interface.encodeFunctionData('safeBatchTransferFrom', [
							fsVaultContractAddress,
							account2.address,
							[BigInt(1), BigInt(2), BigInt(3)],
							[BigInt(50), BigInt(50), BigInt(50)],
							'0x',
						]),
					},
					{
						target: t1155_2Address,
						callData: t1155_2Contract.interface.encodeFunctionData('safeBatchTransferFrom', [
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

			await fullStatusLog(account1, account2, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract);
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
				t20_1Contract,
				t20_2Contract,
				t721_1Contract,
				t721_2Contract,
				t1155_1Contract,
				t1155_2Contract,
				t20_1Address,
				t20_2Address,
				t721_1Address,
				t721_2Address,
				t1155_1Address,
				t1155_2Address,
			} = await loadFixture(deployContractsFixture);

			const message: string = `Cancel FS Offer:`;
			const nonce: number = Date.now();
			const messageHash = ethers.solidityPackedKeccak256(['string', 'bytes32', 'uint256'], [message, offer1.id, nonce]);
			const messageBytes = Buffer.from(messageHash.slice(2), 'hex');
			const signedMessage: string = await account1.signMessage(messageBytes);

			const cancelOffer = await fsCoreContract.connect(account1).cancelOffer(
				offer1.id,
				[
					{ target: t20_1Address, callData: t20_1Contract.interface.encodeFunctionData('transfer', [account1.address, ethers.parseEther('50')]) },
					{ target: t20_2Address, callData: t20_2Contract.interface.encodeFunctionData('transfer', [account1.address, ethers.parseEther('50')]) },
					{
						target: t721_1Address,
						callData: t721_1Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [fsVaultContractAddress, account1.address, BigInt(1)]),
					},
					{
						target: t721_1Address,
						callData: t721_1Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [fsVaultContractAddress, account1.address, BigInt(2)]),
					},
					{
						target: t721_2Address,
						callData: t721_2Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [fsVaultContractAddress, account1.address, BigInt(3)]),
					},
					{
						target: t721_2Address,
						callData: t721_2Contract.interface.encodeFunctionData('safeTransferFrom(address,address,uint256)', [fsVaultContractAddress, account1.address, BigInt(4)]),
					},
					{
						target: t1155_1Address,
						callData: t1155_1Contract.interface.encodeFunctionData('safeBatchTransferFrom', [
							fsVaultContractAddress,
							account1.address,
							[BigInt(1), BigInt(2), BigInt(3)],
							[BigInt(50), BigInt(50), BigInt(50)],
							'0x',
						]),
					},
					{
						target: t1155_2Address,
						callData: t1155_2Contract.interface.encodeFunctionData('safeBatchTransferFrom', [
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

			await fullStatusLog(account1, account2, t20_1Contract, t20_2Contract, t721_1Contract, t721_2Contract, t1155_1Contract, t1155_2Contract);
		});
	});
});

// tokens: [
//   {standard: BigInt(0), contractAddress: t20_1Address, ids: [BigInt(0)], amounts: [ethers.parseEther("50")], network: [BigInt(2109)]},
//   {standard: BigInt(0), contractAddress: t20_2Address, ids: [BigInt(0)], amounts: [ethers.parseEther("50")], network: [BigInt(2109)]},
//   {standard: BigInt(1), contractAddress: t721_1Address, ids: [BigInt(1)], amounts: [BigInt(0)], network: [BigInt(2109)]},
//   {standard: BigInt(1), contractAddress: t721_1Address, ids: [BigInt(2)], amounts: [BigInt(0)], network: [BigInt(2109)]},
//   {standard: BigInt(1), contractAddress: t721_2Address, ids: [BigInt(3)], amounts: [BigInt(0)], network: [BigInt(2109)]},
//   {standard: BigInt(1), contractAddress: t721_2Address, ids: [BigInt(4)], amounts: [BigInt(0)], network: [BigInt(2109)]},
//   {standard: BigInt(2), contractAddress: t1155_1Address, ids: [BigInt(1), BigInt(2), BigInt(3)], amounts: [BigInt(50), BigInt(50), BigInt(50)], network: [BigInt(2109)]},
//   {standard: BigInt(2), contractAddress: t1155_2Address, ids: [BigInt(4), BigInt(5), BigInt(6)], amounts: [BigInt(50), BigInt(50), BigInt(50)], network: [BigInt(2109)]},
// ],

// tokens: [
//   {standard: BigInt(0), contractAddress: t20_1Address, ids: [BigInt(0)], amounts: [ethers.parseEther("30")], network: [BigInt(2109)]},
//   {standard: BigInt(0), contractAddress: t20_2Address, ids: [BigInt(0)], amounts: [ethers.parseEther("30")], network: [BigInt(2109)]},
//   {standard: BigInt(1), contractAddress: t721_1Address, ids: [BigInt(3)], amounts: [BigInt(0)], network: [BigInt(2109)]},
//   {standard: BigInt(1), contractAddress: t721_1Address, ids: [BigInt(4)], amounts: [BigInt(0)], network: [BigInt(2109)]},
//   {standard: BigInt(1), contractAddress: t721_2Address, ids: [BigInt(1)], amounts: [BigInt(0)], network: [BigInt(2109)]},
//   {standard: BigInt(1), contractAddress: t721_2Address, ids: [BigInt(2)], amounts: [BigInt(0)], network: [BigInt(2109)]},
//   {standard: BigInt(2), contractAddress: t1155_1Address, ids: [BigInt(4), BigInt(5), BigInt(6)], amounts: [BigInt(30), BigInt(30), BigInt(30)], network: [BigInt(2109)]},
//   {standard: BigInt(2), contractAddress: t1155_2Address, ids: [BigInt(1), BigInt(2), BigInt(3)], amounts: [BigInt(30), BigInt(30), BigInt(30)], network: [BigInt(2109)]},
// ],

// makerTokenStandards: [BigInt(0), BigInt(0), BigInt(1), BigInt(1), BigInt(1), BigInt(1), BigInt(2), BigInt(2)],
// makerTokenAddresses: [t20_1Address, t20_2Address, t721_1Address, t721_1Address, t721_2Address, t721_2Address, t1155_1Address, t1155_2Address],
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
// takerTokenAddresses: [t20_1Address, t20_2Address, t721_1Address, t721_1Address, t721_2Address, t721_2Address, t1155_1Address, t1155_2Address],
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
