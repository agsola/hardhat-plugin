import "@nomiclabs/hardhat-ethers";
import { HardhatEthersHelpers } from "@nomiclabs/hardhat-ethers/types";
import { Contract } from "ethers";
import { extendEnvironment, task } from "hardhat/config";
import { type Paymaster, startMockServer } from "@zerodevapp/mock-server";

import "./type-extensions";
import entryPointArtifact from "../artifacts/account-abstraction/contracts/core/EntryPoint.sol/EntryPoint.json";
import verifyingPaymasterArtifact from "../artifacts/account-abstraction/contracts/samples/VerifyingPaymaster.sol/VerifyingPaymaster.json";
import walletFactoryArtifact from "../artifacts/account-abstraction/contracts/samples/SimpleWalletDeployer.sol/SimpleWalletDeployer.json";

const startMockServerWithRetry = async (
  paymaster: Paymaster,
  entryPoint: Contract,
  provider: HardhatEthersHelpers["provider"]
) => {
  let port = 3030;
  const options = {
    paymaster,
    entryPoint,
    provider,
  };

  const updateMockUrl = () => {
    extendEnvironment((hre) => {
      hre.zeroMockUrl = `http://127.0.0.1:${port}`;
    });
  };

  process.on("uncaughtException", async (err: any) => {
    if (err.code === "EADDRINUSE") {
      await startMockServer({
        ...options,
        port: ++port,
      }).then(updateMockUrl);
    }
  });

  await startMockServer({
    ...options,
    port,
  }).then(updateMockUrl);
};

// This private key is public, do not send funds to it or they will be lost
const PRIVATE_KEY = "0x0458d5ebcb35c98ae7447019f1cee7e55f23d718b5188cdd032d42d47b3ccf3c";

// This is the hex equivalent of 10^18 * 100 (100 eth)
const ONE_HUNDRED_ETH = "0x56BC75E2D63100000";

task("node", async (args, hre, runSuper) => {
  // all of the contracts deployed here will be deployed by this signer
  const zdSigner = new hre.ethers.Wallet(PRIVATE_KEY, hre.ethers.provider);
  await hre.ethers.provider.send("hardhat_setBalance", [
    zdSigner.address,
    ONE_HUNDRED_ETH,
  ]);

  // deploy contracts
  const [VerifyingPaymaster, EntryPoint, WalletFactory] = await Promise.all([
    hre.ethers.getContractFactory(
      verifyingPaymasterArtifact.abi,
      verifyingPaymasterArtifact.bytecode
    ),
    hre.ethers.getContractFactory(
      entryPointArtifact.abi,
      entryPointArtifact.bytecode
    ),
    hre.ethers.getContractFactory(
      walletFactoryArtifact.abi,
      walletFactoryArtifact.bytecode
    ),
  ]);
  const entryPoint = await EntryPoint.connect(zdSigner).deploy();
  const verifyingPaymaster = await VerifyingPaymaster.connect(
    zdSigner
  ).deploy(entryPoint.address, zdSigner.address);
  const walletFactory = await WalletFactory.connect(zdSigner).deploy();
  const paymaster: Paymaster = {
    signer: zdSigner,
    contractAddress: verifyingPaymaster.address,
  };

  console.log(`EntryPoint deployed at ${entryPoint.address}`);
  console.log(`VerifyingPaymaster deployed at ${verifyingPaymaster.address}`);
  console.log(`WalletFactory deployed at ${walletFactory.address}`);

  // start mock server and hardhat node
  await Promise.all([
    runSuper(args),
    startMockServerWithRetry(paymaster, entryPoint, hre.ethers.provider),
  ]);
});
