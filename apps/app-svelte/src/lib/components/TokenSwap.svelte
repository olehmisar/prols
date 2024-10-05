<script lang="ts">
  import { onMount } from "svelte";
  import { ArrowDown } from "lucide-svelte";
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

  // Import the SDK (you may need to adjust the import path)
  import { createFrontendSdk, parseCurrencyAmount } from "@repo/contracts";
  import { getInitialTestAccountsWallets } from "@aztec/accounts/testing";



  const sdk = createFrontendSdk();


  const tokens = sdk.currencyList.getCurrencies().map((token) => ({
    value: token.address,
    label: token.symbol,
  }));

  let fromAmount = "";
  let toAmount = "";
  let fromToken = "";
  let toToken = "";
  let error = "";
  let exchangeRate = 0;
  let quote = undefined;

  function getExchangeRate(fromToken: string, toToken: string) {
    sdk.prols.getQuote({
        amountIn: parseCurrencyAmount(sdk.currencyList.getBySymbol(fromToken), fromAmount) ,
        currencyOut: sdk.currencyList.getBySymbol(toToken)
    })

    if (fromToken === "eth") {
      return 2545;
    } else {
      return 0.000382;
    }
  }

  $: {
    toAmount = String(Number(fromAmount) * exchangeRate);
  }

  $: {
    exchangeRate = getExchangeRate(fromToken, toToken);
  }

  function handleSwap() {
    const account = await sdk.prols.connectWallet()

    if (!fromAmount || !toAmount || !fromToken || !toToken) {
      error = "Please fill in all fields";
      return;
    }
    if (fromToken === toToken) {
      error = "Cannot swap the same token";
      return;
    }
    error = "";
    console.log(
      `Swapping ${fromAmount} ${fromToken} to ${toAmount} ${toToken}`,
    );
    // Here you would typically call your swap function or API
    // sdk.prols.swap({ account: account, quote:

    }});
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
          bind:value={toAmount}
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
