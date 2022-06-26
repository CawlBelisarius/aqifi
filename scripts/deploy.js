const hre = require("hardhat")
const fs = require('fs')

function saveAddresses(addresses) {
  const filePath = "src/config/addresses.json"
  const jsonString = JSON.stringify(addresses, null, 2)

  fs.writeFileSync(filePath, jsonString, (err) => {
    if (err) throw err
  })
}

async function deployAqifiSimple() {
  const [deployer] = await hre.ethers.getSigners()

  console.log(
    "Deploying with the account:",
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
  const aqifi = await Aqifi.deploy()

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

async function deployDemoPrismaticBridge() {

  const tokenAmount = 1000
  const [deployer] = await hre.ethers.getSigners()

  console.log(
    "Deploying prismatic bridge demo with the account:",
    deployer.address
  )

  // deploy Aqifi and chromatic priors

  const Aqifi = await hre.ethers.getContractFactory("Aqifi")
  const priorAqifi = await Aqifi.deploy()
  const posteriorAqifi = await Aqifi.deploy()

  const Token = await hre.ethers.getContractFactory("Token")
  const redPrior = await Token.deploy("red prior", "RPR", tokenAmount)
  const greenPrior = await Token.deploy("green prior", "GPR", tokenAmount)
  const bluePrior = await Token.deploy("blue prior", "BPR", tokenAmount)

  await priorAqifi.deployed()
  await posteriorAqifi.deployed()
  await redPrior.deployed()
  await greenPrior.deployed()
  await bluePrior.deployed()

  const priorAqaAddress = priorAqifi.getAqaAddress()
  const posteriorAqaAddress = priorAqifi.getAqaAddress()
  const redPriorAddress = redPrior.address
  const greenPriorAddress = greenPrior.address
  const bluePriorAddress = bluePrior.address 

  // deploy chromatic bridges

  const ChromaticBridge = await hre.ethers.getContractFactory("ChromaticBridge")
  const redBridge = await ChromaticBridge.deploy(redPriorAddress, "red posterior", "RPO", tokenAmount)
  const greenBridge = await ChromaticBridge.deploy(greenPriorAddress, "green posterior", "GPO", tokenAmount)
  const blueBridge = await ChromaticBridge.deploy(bluePriorAddress, "blue posterior", "BPO", tokenAmount)

  await redBridge.deployed()
  await greenBridge.deployed()
  await blueBridge.deployed()

  const redPosteriorAddress = redBridge.getPosteriorAddress()
  const greenPosteriorAddress = greenBridge.getPosteriorAddress()
  const bluePosteriorAddress = blueBridge.getPosteriorAddress() 

  // deploy prisms

  const Prism = await hre.ethers.getContractFactory("Prism")
  const priorPrism = await Prism.deploy(  priorAqaAddress,
                                          [ redPriorAddress, 
                                            greenPriorAddress,
                                            bluePriorAddress
                                          ]
                                        )
  const posteriorPrism = await Prism.deploy(  posteriorAqaAddress,
                                              [ redPosteriorAddress, 
                                                greenPosteriorAddress,
                                                bluePosteriorAddress
                                              ]
                                            )

  await priorPrism.deployed()
  await posteriorPrism.deployed()

  // reallocate tokens

  await priorAqifi.setPrismaticBridge(priorPrism.address, tokenAmount/2, tokenAmount/2)
  await priorPrism.split()



  await posteriorAqifi.setPrismaticBridge(priorPrism.address, tokenAmount/2, tokenAmount/2)



async function main() { return deployAqifiSimple() }

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })