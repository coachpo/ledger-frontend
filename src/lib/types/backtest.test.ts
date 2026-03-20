import { describe, expect, it } from "vitest";

import type { BacktestRead } from "./backtest";

describe("BacktestRead llmApiKey contract", () => {
  it("accepts only the redacted llmApiKey value", () => {
    const valid = {
      id: 1,
      portfolioId: 1,
      portfolioName: "Core Portfolio",
      templateId: 1,
      depositBalanceId: 1,
      name: "Backtest",
      status: "COMPLETED",
      frequency: "DAILY",
      startDate: "2024-01-02",
      endDate: "2024-03-29",
      currentCycleDate: null,
      totalCycles: 1,
      completedCycles: 1,
      llmBaseUrl: "http://localhost:11434/v1",
      llmApiKey: "***",
      llmModel: "qwen2.5:72b",
      priceMode: "CLOSING_PRICE",
      llmPriceSuccessRate: null,
      commissionMode: "ZERO",
      commissionValue: "0",
      benchmarkSymbols: ["^GSPC"],
      recentActivity: null,
      results: null,
      errorMessage: null,
      createdAt: "2024-01-02T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    } satisfies BacktestRead;

    expect(valid.llmApiKey).toBe("***");
  });
});
