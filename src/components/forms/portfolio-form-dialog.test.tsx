import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PortfolioFormDialog } from "./portfolio-form-dialog";

describe("PortfolioFormDialog", () => {
  it("allows arbitrary 3-letter base currencies when creating a portfolio", async () => {
    const onSave = vi.fn();

    render(
      <PortfolioFormDialog
        open
        isPending={false}
        onOpenChange={() => {}}
        onSave={onSave}
      />,
    );

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Global Growth" },
    });
    fireEvent.change(screen.getByLabelText("Base Currency"), {
      target: { value: "aud" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        baseCurrency: "AUD",
        description: null,
        name: "Global Growth",
      }),
    );
  });
});
