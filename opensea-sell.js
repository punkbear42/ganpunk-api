const contracts = require('./external_contracts.js')
const { OpenSeaPort, Network } = require ('opensea-js')
const Web3 = require('web3')

// This example provider won't let you make transactions, only read-only calls:
const provider = new Web3.providers.HttpProvider('https://rinkeby.infura.io/v3/78040c38a1eb436a9ce429fa1746d16c')
const YOUR_API_KEY = ''

const seaport = new OpenSeaPort(provider, {
  networkName: Network.Rinkeby,
  apiKey: YOUR_API_KEY
})

const gan_contract = contracts[4].contracts.GAN_PUNK
const tokenId = 0
const accountAddress = '0xb8e1f2cda6abf016c13b82e9fb906130f08e46ca'
// Expire this auction one day from now.
// Note that we convert from the JavaScript timestamp (milliseconds):
const expirationTime = Math.round(Date.now() / 1000 + 60 * 60 * 24)

console.log(gan_contract.address)
seaport.createSellOrder({
  asset: {
    tokenId,
    address: gan_contract.address,
  },
  accountAddress,
  startAmount: 0.1,
  // If `endAmount` is specified, the order will decline in value to that amount until `expirationTime`. Otherwise, it's a fixed-price order:
  endAmount: 3,
  expirationTime
})
