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
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "$lib/components/ui/select";

  // Import the SDK (you may need to adjust the import path)
  import { createFrontendSdk } from "@repo/contracts";

  const tokens = [
    { value: "eth", label: "Ethereum (ETH)" },
    { value: "usdt", label: "Tether (USDT)" },
  ];

  const sdk = createFrontendSdk();
  sdk.currencyList.getCurrencyList();

  let fromAmount = "";
  let toAmount = "";
  let fromToken = "";
  let toToken = "";
  let error = "";
  let exchangeRate = 4;

  function getExchangeRate(fromToken: string, toToken: string) {
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
        <Select bind:value={fromToken}>
          <SelectTrigger class="w-[180px]">
            <SelectValue placeholder="Select token" />
          </SelectTrigger>
          <SelectContent>
            {#each tokens as token}
              <SelectItem value={token.value}>
                {token.label}
              </SelectItem>
            {/each}
          </SelectContent>
        </Select>
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
        <Select bind:value={toToken}>
          <SelectTrigger class="w-[180px]">
            <SelectValue placeholder="Select token" />
          </SelectTrigger>
          <SelectContent>
            {#each tokens as token}
              <SelectItem value={token.value}>
                {token.label}
              </SelectItem>
            {/each}
          </SelectContent>
        </Select>
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
