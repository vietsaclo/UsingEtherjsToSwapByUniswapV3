const { ethers } = require('ethers')
const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
const { abi: SwapRouterABI } = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json')
const { getPoolImmutables, getPoolState } = require('./helpers')
const ERC20ABI = require('./abi.json')
const { Pool, FeeAmount } = require('@uniswap/v3-sdk');
const { Token, SUPPORTED_CHAINS } = require('@uniswap/sdk-core')

require('dotenv').config()
const INFURA_URL_TESTNET = process.env.INFURA_URL_TESTNET
const WALLET_ADDRESS = process.env.WALLET_ADDRESS
const WALLET_SECRET = process.env.WALLET_SECRET
const CHAIN_ID = 5;// Goerli Testnet

const provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNET)
const poolAddress = "0x4d1892f15B03db24b55E73F9801826a56d6f0755" // UNI/WETH
const swapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564'

const name0 = 'Uniswap Token'
const symbol0 = 'UNI'
const decimals0 = 18
const address0 = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'

const name1 = 'Wrapped Ether'
const symbol1 = 'WETH'
const decimals1 = 18
const address1 = '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6'

const getBalance = async (address) => {
  const balance = await provider.getBalance(address);
  return ethers.utils.formatEther(balance);
}

const getChainId = async () => {
  const net = await provider.getNetwork();
  return net.chainId;
}

const UNI_TOKEN = new Token(
  CHAIN_ID,
  address0,
  decimals0,
  'USDC',
  'USD//C'
);

const WETH_TOKEN = new Token(
  CHAIN_ID,
  address1,
  decimals1,
  'WETH',
  'Wrapped Ether',
)

const main = async () => {
  // const pAdd = Pool.getAddress(
  //   UNI_TOKEN,
  //   WETH_TOKEN,
  //   FeeAmount.MEDIUM
  // );
  // console.log({ pAdd });
  // return;

  const poolContract = new ethers.Contract(
    poolAddress,
    IUniswapV3PoolABI,
    provider
  )

  const immutables = await getPoolImmutables(poolContract)
  const state = await getPoolState(poolContract)

  const wallet = new ethers.Wallet(WALLET_SECRET)
  const connectedWallet = wallet.connect(provider)

  const swapRouterContract = new ethers.Contract(
    swapRouterAddress,
    SwapRouterABI,
    provider
  )

  const inputAmount = 0.001
  // .001 => 1 000 000 000 000 000
  const amountIn = ethers.utils.parseUnits(
    inputAmount.toString(),
    decimals0
  )

  const approvalAmount = (amountIn * 100000).toString()
  const tokenContract0 = new ethers.Contract(
    address0,
    ERC20ABI,
    provider
  )
  const approvalResponse = await tokenContract0.connect(connectedWallet).approve(
    swapRouterAddress,
    approvalAmount
  )

  // console.log(immutables);
  // console.log(typeof immutables.token0);

  // return;

  const params = {
    // tokenIn: immutables.token0,
    // tokenOut: immutables.token1,
    tokenIn: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    tokenOut: '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6',
    fee: immutables.fee,
    recipient: WALLET_ADDRESS,
    deadline: Math.floor(Date.now() / 1000) + (60 * 10),
    amountIn: amountIn,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  }

  const transaction = swapRouterContract.connect(connectedWallet).exactInputSingle(
    params,
    {
      gasLimit: ethers.utils.hexlify(1000000)
    }
  ).then(transaction => {
    console.log(transaction)
  })
}

main();
