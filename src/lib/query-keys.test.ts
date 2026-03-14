import { describe, expect, it } from "vitest";

import { queryKeys } from "./query-keys";

describe("query keys", () => {
  it("normalizes string and numeric ids to the same key", () => {
    expect(queryKeys.portfolios.detail("1")).toEqual(queryKeys.portfolios.detail(1));
    expect(queryKeys.balances.list("1")).toEqual(queryKeys.balances.list(1));
    expect(queryKeys.positions.detail("1", "7")).toEqual(
      queryKeys.positions.detail(1, 7),
    );
    expect(queryKeys.stockAnalysis.runs.list("1", "9")).toEqual(
      queryKeys.stockAnalysis.runs.list(1, 9),
    );
  });

  it("normalizes response filter ids inside query params", () => {
    expect(
      queryKeys.stockAnalysis.responses.list("1", {
        conversationId: 12,
        limit: 100,
      }),
    ).toEqual(
      queryKeys.stockAnalysis.responses.list(1, {
        conversationId: 12,
        limit: 100,
      }),
    );
  });
});
