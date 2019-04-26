# Flight Surety
## How to run
### System Requirements
1. Node v10.15.3
2. Ganache CLI v6.4.3 (ganache-core: 2.5.5)
3. Solidity 0.4.24
4. Truffle v5.0.11 (core: 5.0.11)
5. Solidity - 0.4.24 (solc-js)
6. Web3.js v1.0.0-beta.37

### Setup
#### Obtain the code
1. Downwload and unzip this repo to a folder on your machine.
2. Open Terminal in this folder
3. Run:
```bash
npm install
```

#### Start Ganache
You will need specific configuration of ganache. So run:
```bash
ganache-cli -l 999999999999 -m "candy maplcake sugar puddi cream honey rich smooth crumble sweet treat" -e 10000 -a 30
```
This command will create the local test network with the following props:
1. gas limit = 999999999999
2. test accounts = 30
3. ether on each test account = 10000

#### Migrate contracts to ganache
Specific configuration of test network is configured in truffle under the `development_cli` alias.

So, you need to migrate the contract to this specific network. Hence, run in the project folder:
```bash
truffle migrate --network development_cli
```

#### Start Oracle Server
Now server depends on `truffle-contract` npm package, so you need to install it. 

But if you just run `npm install` inside `./src/server`  folder, it will fail.

So first go ahead and open your node modules
```bash
cd ./node_modules
```
Then remove 
```bash
rm -rf web3-providers-ws
```

Now, go up to you project folder again.

To start oracle server, you will have to change the folder in the Terminal first:
```bash
cd ./src/server
```
And install the `truffle-contract`
```bash
npm install
```

And start the server as normal Node.js process:
```bash
node server.js
```

#### Start Dapp
Dapp that will allow you to interact with deployed contracts will be server for you on `localhost:8000`.
In the project folder run:
```bash
npm run dapp
```

__At this point you have set up the system locally, and you are good to go with tests and interactions with UI.__

__CAUTION! After you run automatic tests, please tear down the local system and set it up again for interaction with UI.__

### Run tests
__IMPORTANT!__ You need to run the test files as described below. Otherwise, tests may fail due to bugs in the truffle/ganache.

___Please, find yourself in the project folder again.___

1. Run unit tests for Flight Surety Data Contract
```bash
truffle test test/FlightSuretyDataTest.js --network development_cli
```

2. Run unit tests for Flight Surety App Contract
```bash
truffle test test/FlightSuretyAppTest.js --network development_cli
```

3. Run integration tests for Oracle App with FlightSurety
```bash
truffle test test/OracleTest.js --network development_cli
```

### Interact with UI
The Dapp has four sections: Contract, Airlines, Flights and Insurances.

Sections contain forms for the specific resource in the system.

Outcome of each form request outputs to Results section.

__IMPORTANT!__ 

When you try to search the Flight or Insurance in `Get Flight`/ `Get Insurance` forms, you need to use
the __Id__ of the flight or insurance. 

Ids are integers, starting with 1. 

So if you have created two insurances in the network,
and you want to search for the first one, then use `1` as Insurance Id in the `Get Insurance` form. 

Same applies to `Buy Insurance`. You need to use integer id of the flight. For first flight in the system the id will be `1`.

P.S. Sorry for all that.