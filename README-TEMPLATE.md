# hardhat-zerodev

A [Hardhat](https://hardhat.org) plugin that runs a ZeroDev mock server.

## What

Sometimes you want to test you Dapps locally. To do that, ZeroDev provides a standalone [mock server](https://github.com/zerodevapp/mock-server) to mimick a live paymaster on your local machine. This plugin automatically starts the mock server whenever you run `npx hardhat node` or `hh node`.

## Installation

```bash
npm install hardhat-zerodev "@nomiclabs/hardhat-ethers@^2.0.0" "ethers@^5.0.0"
```

Import the plugin in your `hardhat.config.js`:

```js
require("hardhat-zerodev");
```

Or if you are using TypeScript, in your `hardhat.config.ts`:

```ts
import "hardhat-zerodev";
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

This plugin exports a new environment variable under `hre.zeroMockUrl` which indicates the URL for the mock server. It's usually something like `http://127.0.0.1:3000`.

## Usage

Configure your [ZeroDev SDK](https://www.npmjs.com/package/zerodev-sdk) to use the mock server:

```ts
import * as zd from "zerodev-sdk";

await zd.getSigner({
  localMode: true,
  rpcUrl: "http://127.0.0.1:8545/", // address of hardhat JSON-RPC server
  backendUrl: "http://127.0.0.1:3000", // address of ZeroDev mock server

  // the following values can be of any value, see note below
  projectId: "0db3bd22-d8ee-427a-8a00-4017f80d5ddd",
  identity: "google",
  token: "any-token-here",
});
```

Note: *It's currently not possible to configure rate limites or other project dashboard features. The mock server will simply sign everything it receives.*
