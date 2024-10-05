"use client"

import { useEffect, useState } from "react"
import { ArrowDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { createFrontendSdk } from "@repo/contracts"

const tokens = [
    { value: "eth", label: "Ethereum (ETH)" },
    { value: "usdt", label: "Tether (USDT)" },
]

const sdk = createFrontendSdk()

function getExchangeRate(
    fromToken: string,
    toToken: string
) {
    if (fromToken === "eth") {
        return 2545
    } else {
        return 0.000382
    }
}

export default function TokenSwap() {
    const [fromAmount, setFromAmount] = useState("")
    const [toAmount, setToAmount] = useState("")
    const [fromToken, setFromToken] = useState("")
    const [toToken, setToToken] = useState("")
    const [error, setError] = useState("")
    const [exchangeRate, setExchangeRate] = useState(4)

    useEffect(() => {
        setToAmount(String(Number(fromAmount) * exchangeRate))
    }, [exchangeRate, fromAmount])

    useEffect(() => {
        setExchangeRate(getExchangeRate(fromToken, toToken))
    }, [fromToken, toToken])

    const handleSwap = () => {
        if (!fromAmount || !toAmount || !fromToken || !toToken) {
            setError("Please fill in all fields")
            return
        }
        if (fromToken === toToken) {
            setError("Cannot swap the same token")
            return
        }
        setError("")
        console.log(`Swapping ${fromAmount} ${fromToken} to ${toAmount} ${toToken}`)
        // Here you would typically call your swap function or API
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Crypto Token Swap</CardTitle>
                <CardDescription>Exchange your tokens instantly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex space-x-2">
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={fromAmount}
                            onChange={(e) => setFromAmount(e.target.value)}
                            className="flex-grow"
                        />
                        <Select value={fromToken} onValueChange={setFromToken}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select token" />
                            </SelectTrigger>
                            <SelectContent>
                                {tokens.map((token) => (
                                    <SelectItem key={token.value} value={token.value}>
                                        {token.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-center">
                    <ArrowDownIcon className="text-gray-500" />
                </div>
                <div className="space-y-2">
                    <div className="flex space-x-2">
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={toAmount}
                            onChange={(e) => setToAmount(e.target.value)}
                            className="flex-grow"
                        />
                        <Select value={toToken} onValueChange={setToToken}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select token" />
                            </SelectTrigger>
                            <SelectContent>
                                {tokens.map((token) => (
                                    <SelectItem key={token.value} value={token.value}>
                                        {token.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handleSwap}>
                    Swap Tokens
                </Button>
            </CardFooter>
        </Card>
    )
}