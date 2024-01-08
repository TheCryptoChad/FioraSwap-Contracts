import { ethers } from 'hardhat';
import { FS_Core, FS_Test20_1, FS_Test20_2, FS_Test721_1, FS_Test721_2, FS_Test1155_1, FS_Test1155_2 } from '../typechain-types';

async function main() {
	const signer = new ethers.Wallet('PK', new ethers.JsonRpcProvider('RPC'));
	const ownerAddress: string = '0x6e29938569235B07d99499EA1bCedB85dCfC45Ff';
	const oracleAddress: string = '0x90Bc4f6081F0e85bDab366cF5898DCAB50c5B5AD';

	console.log('Deploying FioraSwap');
	const FS_Core: FS_Core = await ethers.deployContract('FS_Core', [ownerAddress, oracleAddress], { signer: signer });
	await FS_Core.waitForDeployment();

	console.log('FS_Core: ' + FS_Core.target);
	console.log('FS_Vault: ' + (await FS_Core.getFsVaultAddress()));
	console.log('FS_Rewards: ' + (await FS_Core.getFsRewardsAddress()));

	console.log('Deploying FS_Test20_1');
	const FS_Test20_1: FS_Test20_1 = await ethers.deployContract('FS_Test20_1', { signer: signer });
	await FS_Test20_1.waitForDeployment();
	console.log('FS_Test20_1: ' + FS_Test20_1.target);

	console.log('Deploying FS_Test20_2');
	const FS_Test20_2: FS_Test20_2 = await ethers.deployContract('FS_Test20_2', { signer: signer });
	await FS_Test20_2.waitForDeployment();
	console.log('FS_Test20_2: ' + FS_Test20_2.target);

	console.log('Deploying FS_Test721_1');
	const FS_Test721_1: FS_Test721_1 = await ethers.deployContract('FS_Test721_1', { signer: signer });
	await FS_Test721_1.waitForDeployment();
	console.log('FS_Test721_1: ' + FS_Test721_1.target);

	console.log('Deploying FS_Test721_2');
	const FS_Test721_2: FS_Test721_2 = await ethers.deployContract('FS_Test721_2', { signer: signer });
	await FS_Test721_2.waitForDeployment();
	console.log('FS_Test721_2: ' + FS_Test721_2.target);

	console.log('Deploying FS_Test1155_1');
	const FS_Test1155_1: FS_Test1155_1 = await ethers.deployContract('FS_Test1155_1', { signer: signer });
	await FS_Test1155_1.waitForDeployment();
	console.log('FS_Test1155_1: ' + FS_Test1155_1.target);

	console.log('Deploying FS_Test1155_2');
	const FS_Test1155_2: FS_Test1155_2 = await ethers.deployContract('FS_Test1155_2', { signer: signer });
	await FS_Test1155_2.waitForDeployment();
	console.log('FS_Test1155_2: ' + FS_Test1155_2.target);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
