import './App.css'
import { useState } from 'react'
import { ethers } from 'ethers'
import Greeter from './artifacts/contracts/Greeter.sol/Greeter.json'
import Token from './artifacts/contracts/Token.sol/Token.json'
import Aqifi from './artifacts/contracts/Aqifi.sol/Aqifi.json'
import addresses from "./config/addresses.json"
import { SigningKey } from 'ethers/lib/utils'

function App() {
  const [greeting, setGreetingValue] = useState()
  const [userAccount, setUserAccount] = useState()
  const [amount, setAmount] = useState()

  async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' })
  }

  async function fetchGreeting() {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      console.log({ provider })
      const contract = new ethers.Contract(addresses.greeter, Greeter.abi, provider)
      try {
        const data = await contract.greet()
        console.log('data: ', data)
      } catch (err) {
        console.log("Error: ", err)
      }
    }    
  }

  async function getBalance(tokenName, tokenAddress) {
    if (typeof window.ethereum !== 'undefined') {
      const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const contract = new ethers.Contract(tokenAddress, Token.abi, provider)
      const balance = await contract.balanceOf(account)
      console.log(tokenName, "Balance: ", balance.toString())
    }
  }

  async function getAqifiBalance(tokenName, tokenAddress) {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const contract = new ethers.Contract(tokenAddress, Token.abi, provider)
    const balance = await contract.balanceOf(addresses.aqifi)
    console.log(tokenName, "Balance: ", balance.toString())
  }

  async function setGreeting() {
    if (!greeting) return
    if (typeof window.ethereum !== 'undefined') {
      await requestAccount()
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      console.log({ provider })
      const signer = provider.getSigner()
      const contract = new ethers.Contract(addresses.greeter, Greeter.abi, signer)
      const tx = await contract.setGreeting(greeting)
      await tx.wait()
      fetchGreeting()
    }
  }

  async function send() {
    if (typeof window.ethereum !== 'undefined') {
      await requestAccount()
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(addresses.token, Token.abi, signer)
      const tx = await contract.transfer(userAccount, amount)
      await tx.wait()
      console.log(`${amount} Coins successfully sent to ${userAccount}`)
    }
  }

  async function setPrice() {
    if (!amount) return
    if (typeof window.ethereum !== 'undefined') {
      await requestAccount()
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(addresses.aqifi, Aqifi.abi, signer)
      const tx = await contract.setPrice(amount)
      await tx.wait()
      console.log(`Price successfully set to ${amount}`)
    }
  }

  async function sink() {
    if (typeof window.ethereum !== 'undefined') {
      await requestAccount()
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      const contract = new ethers.Contract(addresses.token, Token.abi, signer)
      const tx = await contract.approve(addresses.aqifi, amount)
      await tx.wait()
      console.log(`${amount} Tokens successfully approved for Aqifi`)

      const aqifiContract = new ethers.Contract(addresses.aqifi, Aqifi.abi, signer)
      const sinkingTx = await aqifiContract.sink()
      await sinkingTx.wait()
      console.log(`${amount} Tokens successfully sunk into Aqifi`)
    }
  }

  async function redeem() {
    if (typeof window.ethereum !== 'undefined') {
      await requestAccount()
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      const contract = new ethers.Contract(addresses.aqa, Token.abi, signer)
      const tx = await contract.approve(addresses.aqifi, amount)
      await tx.wait()
      console.log(`${amount} AQAs successfully approved for Aqifi`)

      const aqifiContract = new ethers.Contract(addresses.aqifi, Aqifi.abi, signer)
      const sinkingTx = await aqifiContract.redeem()
      await sinkingTx.wait()
      console.log(`${amount} AQAs successfully redeemed into Aqifi`)
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={fetchGreeting}>Fetch Greeting</button>
        <button onClick={setGreeting}>Set Greeting</button>
        <input onChange={e => setGreetingValue(e.target.value)} placeholder="Set greeting" />

        <br />
        (user)
        <button onClick={() => getBalance("TKN", addresses.token)}>Get TKN Balance</button>
        <button onClick={() => getBalance("AQA", addresses.aqa)}>Get AQA Balance</button>

        <br />
        (aqifi)
        <button onClick={() => getAqifiBalance("TKN", addresses.token)}>Get TKN Balance</button>
        <button onClick={() => getAqifiBalance("AQA", addresses.aqa)}>Get AQA Balance</button>

        <br />
        <input onChange={e => setUserAccount(e.target.value)} placeholder="Send to Account ID" />
        <input onChange={e => setAmount(e.target.value)} placeholder="Amount" />
        <button onClick={send}>Send TKN</button>
        <button onClick={sink}>Sink TKN</button>
        <button onClick={redeem}>Redeem AQA</button>
        <button onClick={setPrice}>Set Price</button>
      </header>
    </div>
  )
}

export default App