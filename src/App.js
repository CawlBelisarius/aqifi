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
  const [price, setPrice] = useState()
  const [max, setMax] = useState()
  const [allowSinking, setAllowSinking] = useState(false)
  const [allowRedemption, setAllowRedemption] = useState(false)

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
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const contract = new ethers.Contract(tokenAddress, Token.abi, provider)
      const balance = await contract.balanceOf(addresses.aqifi)
      console.log(tokenName, "Balance: ", balance.toString())
    }
  }

  async function getToken() {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const contract = new ethers.Contract(addresses.aqifi, Aqifi.abi, provider)
      const token = await contract.getToken(addresses.token)
      console.log(token)
    }
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
      const sinkingTx = await aqifiContract.sink(addresses.token)
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
      const sinkingTx = await aqifiContract.redeem(addresses.token)
      await sinkingTx.wait()
      console.log(`${amount} AQAs successfully redeemed into Aqifi`)
    }
  }

  async function setToken() {
    if (typeof window.ethereum !== 'undefined') {
      await requestAccount()
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      const contract = new ethers.Contract(addresses.aqifi, Aqifi.abi, signer)

      let _price
      let invertPrice 
      if (price < 1) {
        _price = 1/price 
        invertPrice = true
      } else {
        _price = price 
        invertPrice = false
      }
      const tx = await contract.setToken(addresses.token, allowSinking, allowRedemption, _price, invertPrice, max)
      await tx.wait()

      console.log(`Token successfully set`)
    }
  }

  async function removeToken() {
    if (typeof window.ethereum !== 'undefined') {
      await requestAccount()
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      const contract = new ethers.Contract(addresses.aqifi, Aqifi.abi, signer)

      const tx = await contract.setToken(addresses.token, false, false, 0, false, 0)
      await tx.wait()

      console.log(`Token successfully removed`)
    }
  }

  async function bond() {
    if (typeof window.ethereum !== 'undefined') {
      await requestAccount()
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      const contract = new ethers.Contract(addresses.aqa, Token.abi, signer)
      const tx = await contract.approve(addresses.aqifi, amount)
      await tx.wait()
      console.log(`${amount} AQAs successfully approved for Aqifi`)

      const aqifiContract = new ethers.Contract(addresses.aqifi, Aqifi.abi, signer)
      const bondingTx = await aqifiContract.bond()
      await bondingTx.wait()
      console.log(`${amount} AQAs successfully bonded`)
    }
  }

  async function redeemBond() {
    if (typeof window.ethereum !== 'undefined') {
      await requestAccount()
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      const contract = new ethers.Contract(addresses.aqifi, Aqifi.abi, signer)
      const tx = await contract.redeemBond()
      await tx.wait()
      console.log(`Bond successfully redeemed`)
    }
  }

  async function abortBond() {
    if (typeof window.ethereum !== 'undefined') {
      await requestAccount()
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      const contract = new ethers.Contract(addresses.aqifi, Aqifi.abi, signer)
      const tx = await contract.abortBond()
      await tx.wait()
      console.log(`Bond successfully aborted`)
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
        <button onClick={getToken}>Get TKN</button>
        <label>
            <input type="checkbox" checked={allowSinking} onChange={() => setAllowSinking(!allowSinking)}/>
            Allow Sinking TKN for AQA
        </label>
        <label>
            <input type="checkbox" checked={allowRedemption} onChange={() => setAllowRedemption(!allowRedemption)}/>
            Allow Redeeming AQA for TKN
        </label>
        <input onChange={e => setPrice(e.target.value)} placeholder="Price" />
        <input onChange={e => setMax(e.target.value)} placeholder="Max" />
        <button onClick={setToken}>Set TKN</button>
        <button onClick={removeToken}>Remove TKN</button>

        <br />
        <input onChange={e => setUserAccount(e.target.value)} placeholder="Send to Account ID" />
        <input onChange={e => setAmount(e.target.value)} placeholder="Amount" />
        <button onClick={send}>Send TKN</button>
        <button onClick={sink}>Sink TKN</button>
        <button onClick={redeem}>Redeem AQA</button>
        <button onClick={bond}>Bond AQA</button>
        <button onClick={redeemBond}>Redeem Bond</button>
        <button onClick={abortBond}>Abort Bond</button>
      </header>
    </div>
  )
}

export default App