# ZeroDev Hardhat Plugin

A [Hardhat](https://hardhat.org) plugin that runs a ZeroDev mock server.

## What

Sometimes you want to test you Dapps locally. To do that, ZeroDev provides a [mock server](https://github.com/zerodevapp/mock-server) to mimick a live paymaster on your local machine. This plugin automatically starts the mock server whenever you run `npx hardhat node` or `hh node` without the need for additional setup.

## Installation

```bash
npm install @zerodevapp/hardhat "@nomiclabs/hardhat-ethers@^2.0.0" "ethers@^5.0.0"
```

Import the plugin in your `hardhat.config.js`:

```js
require("@zerodevapp/hardhat");
```

Or if you are using TypeScript, in your `hardhat.config.ts`:

```ts
import "@zerodevapp/hardhat";
```

## Required plugins

- [@nomiclabs/hardhat-ethers](https://hardhat.org/hardhat-runner/plugins/nomiclabs-hardhat-ethers)

## Tasks

This plugin overrides the `node` task:

```bash
$ npx hardhat node

Verifier paymaster deployed at 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
ZeroDev mock server listening at http://127.0.0.1:3000
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
...
```

## Environment extensions

This plugin exports a new environment variable under `hre.zeroMockUrl` which indicates the URL for the mock server. It's usually something like `http://127.0.0.1:3030`.

## Usage

Configure your [ZeroDev SDK](https://www.npmjs.com/package/zerodev-sdk) to use the mock server:

```ts
import * as zd from "zerodev-sdk";

const wallet = await zd.getSigner(
  {
    projectId: "zerodev project id here",
    identity: "google",
    token: token,
  },
  {
    // your local ethereum network rpc:
    rpcUrl: "http://127.0.0.1:8545/",
    // the mock server provides the following two:
    backendUrl: "http://127.0.0.1:3030",
    paymasterUrl: "http://127.0.0.1:3030",
    // the same as the backendUrl with /rpc appended:
    bundlerUrl: "http://127.0.0.1:3030/rpc",
    // addresses where your contracts are deployed to:
    contractAddresses: {
      entrypoint: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      paymaster: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      walletFactory: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    },
  }
);
```

Note: _It's currently not possible to configure rate limites or other project dashboard features. The mock server will simply sign everything it receives._
