import { ethers } from 'hardhat';
import { FS_Core, Test20_1, Test20_2, Test721_1, Test721_2, Test1155_1, Test1155_2 } from '../typechain-types';

async function main() {
	const signer = new ethers.Wallet('PK', new ethers.JsonRpcProvider('RPC'));
	const oracleAddress = '0x90Bc4f6081F0e85bDab366cF5898DCAB50c5B5AD';

	console.log('Deploying FioraSwap');
	const FS_Core: FS_Core = await ethers.deployContract('FS_Core', [signer.address, oracleAddress], { signer: signer });
	await FS_Core.waitForDeployment();

	console.log('FS_Core: ' + FS_Core.target);
	console.log('FS_Vault: ' + (await FS_Core.getFsVaultAddress()));
	console.log('FS_Rewards: ' + (await FS_Core.getFsRewardsAddress()));

	const testTokens: string[] = ['Test20_1', 'Test20_2', 'Test721_1', 'Test721_2', 'Test1155_1', 'Test1155_2'];

	console.log('Deploying Test20_1');
	const Test20_1: Test20_1 = await ethers.deployContract('Test20_1', { signer: signer });
	await Test20_1.waitForDeployment();
	console.log('Test20_1: ' + Test20_1.target);

	console.log('Deploying Test20_2');
	const Test20_2: Test20_2 = await ethers.deployContract('Test20_2', { signer: signer });
	await Test20_2.waitForDeployment();
	console.log('Test20_2: ' + Test20_2.target);

	console.log('Deploying Test721_1');
	const Test721_1: Test721_1 = await ethers.deployContract('Test721_1', { signer: signer });
	await Test721_1.waitForDeployment();
	console.log('Test721_1: ' + Test721_1.target);

	console.log('Deploying Test721_2');
	const Test721_2: Test721_2 = await ethers.deployContract('Test721_2', { signer: signer });
	await Test721_2.waitForDeployment();
	console.log('Test721_2: ' + Test721_2.target);

	console.log('Deploying Test1155_1');
	const Test1155_1: Test1155_1 = await ethers.deployContract('Test1155_1', { signer: signer });
	await Test1155_1.waitForDeployment();
	console.log('Test1155_1: ' + Test1155_1.target);

	console.log('Deploying Test1155_2');
	const Test1155_2: Test1155_2 = await ethers.deployContract('Test1155_2', { signer: signer });
	await Test1155_2.waitForDeployment();
	console.log('Test1155_2: ' + Test1155_2.target);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
