import { ethers } from 'hardhat';

async function main() {
	const signer = new ethers.Wallet('PK', new ethers.JsonRpcProvider('https://rpc.exosama.com'));
	const oracleAddress = '0x90Bc4f6081F0e85bDab366cF5898DCAB50c5B5AD';

	console.log('Deploying FioraSwap');
	const FS_Core = await ethers.deployContract('FS_Core', [signer.address, oracleAddress], { signer: signer });
	await FS_Core.waitForDeployment();

	console.log('FS_Core: ' + FS_Core.target);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
