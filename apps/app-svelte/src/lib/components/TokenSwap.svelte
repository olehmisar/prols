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
  import {
    createFrontendSdk,
    formatCurrencyAmount,
    parseCurrencyAmount
  } from "@repo/contracts";
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
  let quote = undefined;

  let balances = [];
  onMount(async () => {
    const account = await sdk.prols.connectWallet();
    const currencies = sdk.currencyList.getCurrencies();
    const balances2 = await Promise.all(currencies.map(token => sdk.prols.balanceOfPrivate(account, token)));
    const routerBalances = await Promise.all(currencies.map(token => sdk.prols.balanceOfPublic(account, token)));
    console.log('routerBalances', routerBalances.map(b => `${b.currency.symbol}: ${formatCurrencyAmount(b)}`));
    balances = balances2;

    if (balances2.some(b => b.quotient.toString() === '0')) {
      console.log('minting...')
      await Promise.all([
        sdk.prols.mintPrivateAndRedeem({to: account, amount: parseCurrencyAmount(sdk.currencyList.getBySymbol('ETH')!, '10')}),
        sdk.prols.mintPrivateAndRedeem({to: account, amount: parseCurrencyAmount(sdk.currencyList.getBySymbol('USDT')!, '50000')}),

        sdk.prols.mintPublic({ to: account, amount: parseCurrencyAmount(sdk.currencyList.getBySymbol('ETH')!, '100') }),
        sdk.prols.mintPublic({ to: account, amount: parseCurrencyAmount(sdk.currencyList.getBySymbol('USDT')!, '100000') }),
      ])
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
    // Here you would typically call your swap function or API
    sdk.prols.swap(account, quote);
  }
</script>

<Card class="w-full max-w-md mx-auto">
  <CardHeader>
    <CardTitle>Crypto Token Swap</CardTitle>
    <CardDescription>Exchange your tokens instantly</CardDescription>
  </CardHeader>
    <CardContent class="space-y-4">
    <div class="space-y-2">
      <div class="flex space-x-2">
        {#each balances as balance}
          {balance.currency.symbol}: {formatCurrencyAmount(balance)} <br>
        {/each}
      </div>
    </div>
    </CardContent>
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
