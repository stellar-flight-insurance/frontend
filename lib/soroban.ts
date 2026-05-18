import {
  rpc,
  Contract,
  nativeToScVal,
  TransactionBuilder,
  Networks,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import freighter from "@stellar/freighter-api";

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://soroban-testnet.stellar.org";
const POOL_CONTRACT_ID = process.env.NEXT_PUBLIC_POOL_CONTRACT_ID ?? "";
const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? Networks.TESTNET;

function getServer() {
  return new rpc.Server(RPC_URL);
}

export async function createPolicy(
  userAddress: string,
  flightId: string,
  departureTime: number,
  premium: bigint,
  payoutAmount: bigint,
  tokenAddress: string
): Promise<string> {
  const server = getServer();
  const contract = new Contract(POOL_CONTRACT_ID);

  const args = [
    nativeToScVal(userAddress, { type: "address" }),
    nativeToScVal(flightId, { type: "string" }),
    nativeToScVal(departureTime, { type: "u64" }),
    nativeToScVal(premium, { type: "i128" }),
    nativeToScVal(payoutAmount, { type: "i128" }),
    nativeToScVal(tokenAddress, { type: "address" }),
  ];

  const account = await server.getAccount(userAddress);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call("create_policy", ...args))
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(tx);
  const { signedTxXdr } = await freighter.signTransaction(
    prepared.toXDR(),
    { networkPassphrase: NETWORK_PASSPHRASE }
  );

  const result = await server.sendTransaction(
    TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE)
  );
  return result.hash;
}

export async function getPoolReserve(): Promise<bigint> {
  const server = getServer();
  const contract = new Contract(POOL_CONTRACT_ID);

  try {
    const account = await server.getAccount(POOL_CONTRACT_ID);
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("get_reserve"))
      .setTimeout(30)
      .build();

    const result = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(result) && result.result) {
      const val = result.result.retval;
      return BigInt(val.value()?.toString() ?? "0");
    }
  } catch {
    // contract not deployed or network unavailable
  }
  return 0n;
}
