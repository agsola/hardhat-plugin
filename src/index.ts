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

const ONE_ETH = "0x1000000000000000000";

task("node", async (args, hre, runSuper) => {
  // all of the contracts deployed here will be deployed by the `0x0d` signer
  const zdDeployer = await hre.ethers.getImpersonatedSigner(
    "0x" + "0d".repeat(20)
  );
  await hre.ethers.provider.send("hardhat_setBalance", [
    zdDeployer.address,
    ONE_ETH,
  ]);

  // create and fund paymaster
  const verifyingSigner = await hre.ethers.getImpersonatedSigner(
    "0xE7B7516Af57DD645DeCb52ec10b0Ce92315d8404"
  );
  await hre.ethers.provider.send("hardhat_setBalance", [
    verifyingSigner.address,
    ONE_ETH,
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
  const entryPoint = await EntryPoint.connect(zdDeployer).deploy();
  const verifyingPaymaster = await VerifyingPaymaster.connect(
    zdDeployer
  ).deploy(entryPoint.address, verifyingSigner.address);
  const walletFactory = await WalletFactory.connect(zdDeployer).deploy();
  const paymaster: Paymaster = {
    signer: verifyingSigner,
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
