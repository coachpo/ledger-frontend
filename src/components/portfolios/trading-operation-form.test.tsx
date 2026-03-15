import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TradingOperationForm } from "./trading-operation-form";

describe("TradingOperationForm", () => {
  it("shows current portfolio symbols as suggestions and still submits a new symbol", async () => {
    const onSave = vi.fn();

    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
      configurable: true,
      value: () => false,
    });
    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
      configurable: true,
      value: vi.fn(),
    });

    render(
      <TradingOperationForm
        balances={[
          {
            amount: "1000.00",
            createdAt: "2026-03-15T10:00:00Z",
            currency: "USD",
            hasTradingOperations: false,
            id: 1,
            label: "Brokerage Cash",
            operationType: "DEPOSIT",
            portfolioId: 1,
            updatedAt: "2026-03-15T10:00:00Z",
          },
        ]}
        initialSymbol="NVDA"
        isPending={false}
        onCancel={() => {}}
        onSave={onSave}
        symbolOptions={[
          { label: "AAPL (Apple Inc.)", symbol: "AAPL" },
          { label: "NVDA (NVIDIA Corporation)", symbol: "NVDA" },
        ]}
      />,
    );

    const symbolInput = screen.getByLabelText("Symbol");
    expect(symbolInput).toHaveValue("NVDA");

    const symbolSuggestions = document.getElementById(
      symbolInput.getAttribute("list") ?? "",
    );

    expect(symbolSuggestions).toBeTruthy();

    const optionLabels = Array.from(
      symbolSuggestions?.querySelectorAll("option") ?? [],
      (option) => option.getAttribute("label") ?? option.value,
    );
    expect(optionLabels).toContain("AAPL (Apple Inc.)");
    expect(optionLabels).toContain("NVDA (NVIDIA Corporation)");

    fireEvent.change(symbolInput, { target: { value: "tsla" } });

    await waitFor(() => expect(symbolInput).toHaveValue("TSLA"));

    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("Price"), { target: { value: "120" } });
    fireEvent.submit(screen.getByRole("button", { name: "Save Operation" }).closest("form")!);

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        balanceId: 1,
        commission: undefined,
        executedAt: expect.any(String),
        price: "120",
        quantity: "5",
        side: "BUY",
        symbol: "TSLA",
      }),
    );
  });
});
