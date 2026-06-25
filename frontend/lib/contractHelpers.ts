import {
  Contract,
  rpc,
  xdr,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Transaction,
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

export const CONTRACT_ADDRESS =
  "CBYD6DCRU3Q5C7KXYL47A4J36F4C74IEMZBYWKSBOMR42L6D5EEM32N4";
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;

export const server = new rpc.Server(RPC_URL, { allowHttp: false });

export function getContract() {
  return new Contract(CONTRACT_ADDRESS);
}

// ─── Read-only call (no signing needed) ──────────────────────────────────────
export async function simulateContractCall(
  method: string,
  args: xdr.ScVal[]
): Promise<xdr.ScVal> {
  const contract = getContract();
  const account = await server.getAccount(CONTRACT_ADDRESS);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const result = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(result)) {
    throw new Error(`Simulation failed: ${result.error}`);
  }

  return (result as rpc.Api.SimulateTransactionSuccessResponse)
    .result!.retval;
}

// ─── Write call (requires Freighter signing) ──────────────────────────────────
export async function invokeContractFunction(
  method: string,
  args: xdr.ScVal[],
  publicKey: string
): Promise<string> {
  const contract = getContract();
  const account = await server.getAccount(publicKey);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  // Simulate first to get the footprint/auth
  const simResult = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  // Assemble the real transaction with soroban data
  const preparedTx = rpc.assembleTransaction(tx, simResult).build();

  // Sign with Freighter
  const signResult = await signTransaction(preparedTx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  if (signResult.error) {
    throw new Error(signResult.error.toString());
  }

  // Submit
  const submitted = await server.sendTransaction(
    TransactionBuilder.fromXDR(signResult.signedTxXdr, NETWORK_PASSPHRASE) as Transaction
  );

  if (submitted.status === "ERROR") {
    throw new Error(`Submit failed: ${JSON.stringify(submitted.errorResult)}`);
  }

  // Poll for confirmation
  let response = await server.getTransaction(submitted.hash);
  while (response.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((r) => setTimeout(r, 1000));
    response = await server.getTransaction(submitted.hash);
  }

  if (response.status === rpc.Api.GetTransactionStatus.FAILED) {
    throw new Error("Transaction failed on chain");
  }

  return submitted.hash;
}