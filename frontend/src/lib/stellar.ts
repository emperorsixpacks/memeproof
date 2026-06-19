import * as StellarSdk from "@stellar/stellar-sdk";
import {
  StellarWalletsKit,
  WalletNetwork,
  FreighterModule,
  type ISupportedWallet,
} from "@creit.tech/stellar-wallets-kit";

const RPC_URL = "https://soroban-testnet.stellar.org";
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

export const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID ?? "";

export function createWalletKit(): StellarWalletsKit {
  return new StellarWalletsKit({
    network: WalletNetwork.TESTNET,
    selectedWalletId: "freighter",
    modules: [new FreighterModule()],
  });
}

export function getRpcServer(): StellarSdk.rpc.Server {
  return new StellarSdk.rpc.Server(RPC_URL);
}

export function getHorizonServer(): StellarSdk.Horizon.Server {
  return new StellarSdk.Horizon.Server(HORIZON_URL);
}

export function getContract(): StellarSdk.Contract {
  return new StellarSdk.Contract(CONTRACT_ID);
}

export function scvalToNative(val: StellarSdk.xdr.ScVal): any {
  return StellarSdk.scValToNative(val);
}

export function nativeToScval(val: any, type?: string): StellarSdk.xdr.ScVal {
  if (type === "string") {
    return StellarSdk.nativeToScVal(val, { type: "string" });
  }
  if (type === "u32") {
    return StellarSdk.nativeToScVal(val, { type: "u32" });
  }
  if (type === "u64") {
    return StellarSdk.nativeToScVal(val, { type: "u64" });
  }
  return StellarSdk.nativeToScVal(val);
}

// Read contract data by simulating a contract call
export async function readContract<R>(
  method: string,
  args: StellarSdk.xdr.ScVal[]
): Promise<R> {
  const rpc = getRpcServer();
  const sim = await rpc.simulateContract(
    new StellarSdk.rpc.ContractCall(
      CONTRACT_ID,
      NETWORK_PASSPHRASE,
      method,
      args
    )
  );

  if (StellarSdk.rpc.isSimulationSuccess(sim)) {
    if (sim.result?.retval) {
      return scvalToNative(sim.result.retval) as R;
    }
    throw new Error("No return value from contract");
  }
  throw new Error(`Contract read failed: ${JSON.stringify(sim.error ?? sim)}`);
}

// Build and send a contract write transaction
export async function writeContract(
  kit: StellarWalletsKit,
  method: string,
  args: StellarSdk.xdr.ScVal[],
  publicKey: string
): Promise<string> {
  const rpc = getRpcServer();
  const contract = getContract();
  const account = await rpc.getAccount(publicKey);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: "1000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  // Simulate first
  const sim = await rpc.simulateTransaction(tx);
  if (!StellarSdk.rpc.isSimulationSuccess(sim)) {
    throw new Error(`Simulation failed: ${JSON.stringify(sim.error ?? sim)}`);
  }

  // Prepare with footprint + auth
  const prepared = StellarSdk.rpc.assembleTransaction(tx, sim);

  // Sign with wallet
  const signedXdr = await kit.signTransaction(
    prepared.toXDR(),
    NETWORK_PASSPHRASE
  );

  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signedXdr,
    NETWORK_PASSPHRASE
  );

  const result = await rpc.sendTransaction(signedTx);

  if (result.status === "FAILED") {
    throw new Error(`Transaction failed: ${result.error?.result?.code ?? "Unknown"}`);
  }

  // Poll for completion
  let hash = result.hash;
  if (result.status === "PENDING") {
    const receipt = await rpc.pollForResponse(hash, 30000);
    if (receipt?.status === "FAILED") {
      throw new Error("Transaction failed after polling");
    }
  }

  return hash;
}
