import { useEffect, useState } from "react";

import type { BalanceRead, TradingOperationInput, TradingSide } from "@/lib/api-types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TradingOperationFormProps = {
  balances: BalanceRead[];
  isPending: boolean;
  onCancel: () => void;
  onSave: (data: TradingOperationInput) => void;
};

export function TradingOperationForm({
  balances,
  isPending,
  onCancel,
  onSave,
}: TradingOperationFormProps) {
  const [balanceId, setBalanceId] = useState("");
  const [side, setSide] = useState<TradingSide>("BUY");
  const [symbol, setSymbol] = useState("");
  const [executedAt, setExecutedAt] = useState(new Date().toISOString().slice(0, 16));
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [commission, setCommission] = useState("");
  const [dividendAmount, setDividendAmount] = useState("");
  const [splitRatio, setSplitRatio] = useState("");

  useEffect(() => {
    if (!balanceId && balances[0]?.id) {
      setBalanceId(String(balances[0].id));
    }
  }, [balanceId, balances]);

  const requiresQuantityAndPrice = side === "BUY" || side === "SELL";
  const canSubmit = Boolean(
    balanceId
      && symbol.trim()
      && executedAt
      && ((requiresQuantityAndPrice && quantity.trim() && price.trim())
        || (side === "DIVIDEND" && dividendAmount.trim())
        || (side === "SPLIT" && splitRatio.trim())),
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Balance</Label>
          <Select value={balanceId} onValueChange={setBalanceId} disabled={isPending || balances.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder="Select balance" />
            </SelectTrigger>
            <SelectContent>
              {balances.map((balance) => (
                <SelectItem key={balance.id} value={String(balance.id)}>
                  {balance.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Operation</Label>
          <Select value={side} onValueChange={(value) => setSide(value as TradingSide)} disabled={isPending}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BUY">BUY</SelectItem>
              <SelectItem value="SELL">SELL</SelectItem>
              <SelectItem value="DIVIDEND">DIVIDEND</SelectItem>
              <SelectItem value="SPLIT">SPLIT</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Symbol</Label>
          <Input value={symbol} onChange={(event) => setSymbol(event.target.value.toUpperCase())} disabled={isPending} />
        </div>
        <div>
          <Label>Executed At</Label>
          <Input type="datetime-local" value={executedAt} onChange={(event) => setExecutedAt(event.target.value)} disabled={isPending} />
        </div>
      </div>
      {requiresQuantityAndPrice ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Quantity</Label>
            <Input value={quantity} onChange={(event) => setQuantity(event.target.value)} disabled={isPending} />
          </div>
          <div>
            <Label>Price</Label>
            <Input value={price} onChange={(event) => setPrice(event.target.value)} disabled={isPending} />
          </div>
          <div>
            <Label>Commission</Label>
            <Input value={commission} onChange={(event) => setCommission(event.target.value)} disabled={isPending} />
          </div>
        </div>
      ) : null}
      {side === "DIVIDEND" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Dividend Amount</Label>
            <Input value={dividendAmount} onChange={(event) => setDividendAmount(event.target.value)} disabled={isPending} />
          </div>
          <div>
            <Label>Commission</Label>
            <Input value={commission} onChange={(event) => setCommission(event.target.value)} disabled={isPending} />
          </div>
        </div>
      ) : null}
      {side === "SPLIT" ? (
        <div>
          <Label>Split Ratio</Label>
          <Input value={splitRatio} onChange={(event) => setSplitRatio(event.target.value)} placeholder="2:1 or 1.5" disabled={isPending} />
        </div>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button
          disabled={isPending || !canSubmit}
          onClick={() => {
            const common = {
              balanceId: Number(balanceId),
              symbol: symbol.trim().toUpperCase(),
              executedAt: new Date(executedAt).toISOString(),
            };

            if (side === "BUY") {
              onSave({ ...common, side: "BUY", quantity: quantity.trim(), price: price.trim(), commission: commission.trim() || undefined });
              return;
            }

            if (side === "SELL") {
              onSave({ ...common, side: "SELL", quantity: quantity.trim(), price: price.trim(), commission: commission.trim() || undefined });
              return;
            }

            if (side === "DIVIDEND") {
              onSave({ ...common, side, dividendAmount: dividendAmount.trim(), commission: commission.trim() || undefined });
              return;
            }

            onSave({ ...common, side, splitRatio: splitRatio.trim() });
          }}
        >
          Save Operation
        </Button>
      </div>
    </div>
  );
}
