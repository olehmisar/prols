import { getInitialTestAccountsWallets } from "@aztec/accounts/testing";
import { createPXEClient } from "@aztec/aztec.js";
import { assert } from "ts-essentials";
import { ProlsRouterContract, TokenContract } from "../contracts";

async function main() {
  const pxe = createPXEClient("https://sandbox.shieldswap.org");

  const [admin] = await getInitialTestAccountsWallets(pxe);
  assert(admin);

  const usdt = await TokenContract.deploy(
    admin,
    admin?.getAddress(),
    "USDT",
    "USDT",
    6,
  )
    .send()
    .deployed();

  const eth = await TokenContract.deploy(
    admin,
    admin?.getAddress(),
    "ETH",
    "ETH",
    18,
  )
    .send()
    .deployed();

  const prolsRouter = await ProlsRouterContract.deploy(admin).send().deployed();

  console.log({
    USDT: usdt.address.toString(),
    ETH: eth.address.toString(),
    prolsRouter: prolsRouter.address.toString(),
  });
}

main();
