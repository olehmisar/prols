<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import * as Select from "$lib/components/ui/select";
  import { queryClient } from "$lib/queryClient";
  import { sleep } from "@aztec/aztec.js";
  import {
    createFrontendSdk,
    formatCurrencyAmount,
    parseCurrencyAmount,
    type Quote,
  } from "@repo/contracts";
  import { createQuery } from "@tanstack/svelte-query";
  import { ArrowDown } from "lucide-svelte";
  import { onMount } from "svelte";

  const sdk = createFrontendSdk();

  const tokens = sdk.currencyList.getCurrencies().map((token) => ({
    value: token.symbol,
    label: token.symbol,
  }));

  let fromAmount = "";
  let fromToken = "";
  let toToken = "";
  let error = "";
  let quote: Quote | undefined = undefined;

  const currencies = sdk.currencyList.getCurrencies();
  let balances = createQuery({
    queryKey: ["balances"],
    queryFn: async () => {
      const account = await sdk.prols.connectWallet();
      return await Promise.all(
        currencies.map((token) => sdk.prols.balanceOfPrivate(account, token)),
      );
    },
  });
  let routerBalances = createQuery({
    queryKey: ["routerBalances"],
    queryFn: async () => {
      return await Promise.all(
        currencies.map((token) =>
          sdk.prols.balanceOfPublic(sdk.prols.routerAddress, token),
        ),
      );
    },
  });
  let binanceBalances = createQuery({
    queryKey: ["binanceBalances"],
    queryFn: async () => {
      return Object.entries(await sdk.prols.getBinanceBalances()).map(
        ([symbol, amount]) => `${symbol}: ${amount}`,
      );
    },
  });

  onMount(async () => {
    const account = await sdk.prols.connectWallet();
    const routerAddress = sdk.prols.routerAddress;

    let shouldMint = false;
    if (shouldMint) {
      console.log("minting...");
      await Promise.all([
        // sdk.prols.mintPrivateAndRedeem({to: account, amount: parseCurrencyAmount(sdk.currencyList.getBySymbol('ETH')!, '0')}),
        sdk.prols.mintPrivateAndRedeem({
          to: account,
          amount: parseCurrencyAmount(
            sdk.currencyList.getBySymbol("USDT")!,
            "2000",
          ),
        }),

        sdk.prols.mintPublic({
          to: routerAddress,
          amount: parseCurrencyAmount(
            sdk.currencyList.getBySymbol("ETH")!,
            "1",
          ),
        }),
        // sdk.prols.mintPublic({
        //   to: routerAddress,
        //   amount: parseCurrencyAmount(
        //     sdk.currencyList.getBySymbol("USDT")!,
        //     "100000",
        //   ),
        // }),
      ]);
    }
  });

  async function getExchangeRate(
    fromToken: string,
    toToken: string,
    fromAmount: string,
  ) {
    try {
      console.log(fromToken, toToken, fromAmount);
      quote = await sdk.prols.getQuote({
        amountIn: parseCurrencyAmount(
          sdk.currencyList.getBySymbol(fromToken)!,
          fromAmount,
        ),
        currencyOut: sdk.currencyList.getBySymbol(toToken)!,
      });
    } catch (e) {
      //   console.error(e);
    }
  }

  $: {
    getExchangeRate(fromToken, toToken, fromAmount);
  }

  async function handleSwap() {
    const account = await sdk.prols.connectWallet();

    if (!quote) {
      error = "Please fill in all fields";
      return;
    }
    if (fromToken === toToken) {
      error = "Cannot swap the same token";
      return;
    }
    error = "";
    console.log(`Swapping ${fromAmount} ${fromToken} to ${toToken}`);
    await sdk.prols.swap(account, quote);
    setTimeout(async () => {
      // background job
      await sleep(1000); // wait for binance trade
      queryClient.invalidateQueries();
    });
  }
</script>

<Card class="w-full max-w-md mx-auto mb-4">
  <CardHeader>
    <CardTitle>User Balance</CardTitle>
  </CardHeader>
  <CardContent class="space-y-4">
    <div class="space-y-2">
      <div class="flex space-x-2">
        {#each $balances.data ?? [] as balance}
          {balance.currency.symbol}: {formatCurrencyAmount(balance)} <br />
        {/each}
      </div>
    </div>
  </CardContent>
</Card>

<Card class="w-full max-w-md mx-auto">
  <CardHeader>
    <CardTitle>Token Swap</CardTitle>
  </CardHeader>

  <CardContent class="space-y-4">
    <div class="space-y-2">
      <div class="flex space-x-2">
        <Input
          type="number"
          placeholder="0.00"
          bind:value={fromAmount}
          class="flex-grow"
        />

        <Select.Root
          onSelectedChange={(e) => {
            // @ts-ignore
            fromToken = e.value;
          }}
          portal={null}
        >
          <Select.Trigger class="w-[180px]">
            <Select.Value placeholder="Select token" />
          </Select.Trigger>
          <Select.Content>
            <Select.Group>
              <Select.Label>Tokens</Select.Label>
              {#each tokens as token}
                <Select.Item value={token.value} label={token.label}>
                  {token.label}
                </Select.Item>
              {/each}
            </Select.Group>
          </Select.Content>
          <Select.Input name="fromToken" />
        </Select.Root>
      </div>
    </div>
    <div class="flex justify-center">
      <ArrowDown class="text-gray-500" />
    </div>
    <div class="space-y-2">
      <div class="flex space-x-2">
        <Input
          type="number"
          placeholder="0.00"
          value={quote ? formatCurrencyAmount(quote?.amountOut) : "0"}
          class="flex-grow"
        />
        <Select.Root
          onSelectedChange={(e) => {
            // @ts-ignore
            toToken = e.value;
          }}
          portal={null}
        >
          <Select.Trigger class="w-[180px]">
            <Select.Value placeholder="Select token" />
          </Select.Trigger>
          <Select.Content>
            <Select.Group>
              <Select.Label>Tokens</Select.Label>
              {#each tokens as token}
                <Select.Item value={token.value} label={token.label}>
                  {token.label}
                </Select.Item>
              {/each}
            </Select.Group>
          </Select.Content>
          <Select.Input name="fromToken" />
        </Select.Root>
      </div>
    </div>
    {#if error}
      <p class="text-red-500 text-sm">{error}</p>
    {/if}
  </CardContent>
  <CardFooter>
    <Button class="w-full" on:click={handleSwap}>Swap Tokens</Button>
  </CardFooter>
</Card>

<Card class="w-full max-w-md mx-auto mt-4">
  <CardHeader>
    <CardTitle>Protocol Balanace</CardTitle>
  </CardHeader>
  <CardContent class="space-y-4">
    <div class="space-y-2">
      On-chain:
      <div class="flex space-x-2">
        {#each $routerBalances.data ?? [] as balance}
          {balance.currency.symbol}: {formatCurrencyAmount(balance)} <br />
        {/each}
      </div>
    </div>
    <div class="space-y-2">
      On Binance:
      <div class="flex space-x-2">
        {#each $binanceBalances.data ?? [] as balance}
          {balance} <br />
        {/each}
      </div>
    </div>
  </CardContent>
</Card>
