const hre = require("hardhat")
const fs = require('fs')

function saveAddresses(addresses) {
  const filePath = "src/config/addresses.json"
  const jsonString = JSON.stringify(addresses, null, 2)

  fs.writeFileSync(filePath, jsonString, (err) => {
    if (err) throw err
  })
}

async function main() {
  const [deployer] = await hre.ethers.getSigners()

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  )

  const Greeter = await hre.ethers.getContractFactory("Greeter")
  const greeter = await Greeter.deploy("Hello, World!")

  const Token = await hre.ethers.getContractFactory("Token")
  const token = await Token.deploy("Some Token", "TKN", 10000)

  await greeter.deployed()
  await token.deployed()

  console.log("Greeter deployed to:", greeter.address)
  console.log("Token deployed to:", token.address)

  const Aqifi = await hre.ethers.getContractFactory("Aqifi")
  const aqifi = await Aqifi.deploy(token.address)

  await aqifi.deployed()

  console.log("Aqifi deployed to:", aqifi.address)

  const aqaAddress = await aqifi.getAqaAddress()

  console.log("AQA deployed to:", aqaAddress)

  const addresses = {
    greeter: greeter.address,
    token: token.address,
    aqifi: aqifi.address,
    aqa: aqaAddress
  }

  saveAddresses(addresses)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })