import { CurrencyListService } from "@repo/contracts";
import { CurrencyAmount } from "@uniswap/sdk-core";
import cors from "cors";
import express from "express";
import { assert } from "ts-essentials";
import { z } from "zod";
import { Binance } from "./binance";
import { ProlsBackendService } from "./sdk";

const app = express();
app.use(cors());
app.use(express.json());

function createBackendSdk() {
  const binance = new Binance(); // mock binance because binance does not support Aztec blockchain
  const prols = new ProlsBackendService(binance, "my-binance-account-id");
  const currencyList = new CurrencyListService();
  return {
    prols,
    currencyList,
  };
}

const sdk = createBackendSdk();

app.post("/quote", async (req, res) => {
  try {
    const parsed = z
      .object({
        amountIn: z.string(),
        amountInSymbol: z.string(),
        amountOutSymbol: z.string(),
      })
      .parse(req.body);

    const currencyIn = sdk.currencyList.getBySymbol(parsed.amountInSymbol);
    assert(currencyIn, `Currency not found: "${parsed.amountInSymbol}"`);
    const currencyOut = sdk.currencyList.getBySymbol(parsed.amountOutSymbol);
    assert(currencyOut, `Currency not found: "${parsed.amountOutSymbol}"`);
    const amountIn = CurrencyAmount.fromRawAmount(currencyIn, parsed.amountIn);
    const amountOut = await sdk.prols.getQuote({ amountIn, currencyOut });
    res.json({
      amountOut: amountOut.quotient.toString(),
    });
  } catch (e: any) {
    res.status(500).json({ message: e.toString() });
  }
});

app.post("/hedge", async (req, res) => {
  const parsed = z
    .object({
      amountIn: z.string(),
      amountInSymbol: z.string(),
      amountOut: z.string(),
      amountOutSymbol: z.string(),
    })
    .parse(req.body);

  const currencyIn = sdk.currencyList.getBySymbol(parsed.amountInSymbol);
  assert(currencyIn, `Currency not found: "${parsed.amountInSymbol}"`);
  const currencyOut = sdk.currencyList.getBySymbol(parsed.amountOutSymbol);
  const amountIn = CurrencyAmount.fromRawAmount(currencyIn, parsed.amountIn);

  assert(currencyOut, `Currency not found: "${parsed.amountOutSymbol}"`);
  const amountOut = CurrencyAmount.fromRawAmount(currencyOut, parsed.amountOut);
  await sdk.prols.hedge({ amountIn, amountOut });

  res.status(200).json({ success: true });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
