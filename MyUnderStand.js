const { ethers } = require('ethers')
const { abi: SwapRouterABI } = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json')
const { FeeAmount } = require('@uniswap/v3-sdk');
const ERC20ABI = require('./abi.json')

require('dotenv').config()
const INFURA_URL_TESTNET = process.env.INFURA_URL_TESTNET
const WALLET_ADDRESS = process.env.WALLET_ADDRESS
const WALLET_SECRET = process.env.WALLET_SECRET

const provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNET)
const swapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564'

// ADDRESS WANT TO SEND TOKEN
const ADDRESS_SEND_TOKEN = '0x8CAB34236FF54632929eabb053f29a8e123cc304';
// ADDRESS WANT TO RECEIVE TOKEN
const ADDRESS_RECEIVE_TOKEN = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6';

const main = async () => {
  const wallet = new ethers.Wallet(WALLET_SECRET)
  const connectedWallet = wallet.connect(provider)

  const swapRouterContract = new ethers.Contract(
    swapRouterAddress,
    SwapRouterABI,
    provider
  )

  const inputAmount = 0.01;
  const inputAmountEtherFormat = ethers.utils.parseUnits(inputAmount.toString());

  // Approved ?
  const approvalAmount = (inputAmountEtherFormat).toString()
  const tokenContractSend = new ethers.Contract(
    ADDRESS_SEND_TOKEN,
    ERC20ABI,
    provider
  )
  console.log(approvalAmount);
  const approvalResponse = await tokenContractSend.connect(connectedWallet).approve(
    swapRouterAddress,
    approvalAmount,
    // '1000000000000000000',
  )
  console.log({ approvalResponse });
  // return;

  const params = {
    tokenIn: ADDRESS_SEND_TOKEN, // Token From Address
    tokenOut: ADDRESS_RECEIVE_TOKEN, // Token Send To Address
    fee: FeeAmount.MEDIUM,
    recipient: WALLET_ADDRESS,
    deadline: Math.floor(Date.now() / 1000) + (60 * 10),
    amountIn: inputAmountEtherFormat,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  }

  swapRouterContract.connect(connectedWallet).exactInputSingle(
    params,
    {
      gasLimit: ethers.utils.hexlify(1000000)
    }
  ).then(transaction => {
    console.log(transaction)
  })
}

main();
