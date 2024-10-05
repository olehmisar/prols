import type { AccountWallet, AztecAddress, PXE } from "@aztec/aztec.js";

export * from "./aztec-currency.js";
export * from "./currency-list.js";
export * from "./utils.js";

export async function tokenContract(
  token: AztecAddress,
  accountOrPxe: AccountWallet | PXE,
) {
  const { TokenContract } = await import("./contracts.js");
  return await TokenContract.at(token, castPxeToAccount(accountOrPxe));
}

export function castPxeToAccount(
  accountOrPxe: PXE | AccountWallet,
): AccountWallet {
  return accountOrPxe as AccountWallet;
}
