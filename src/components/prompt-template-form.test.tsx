import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PromptTemplateRead } from "@/lib/api-types";

import { PromptTemplateForm } from "./prompt-template-form";

describe("PromptTemplateForm", () => {
  it("preserves two-step templates instead of downgrading them to single-step", async () => {
    const onSave = vi.fn();
    const initial: PromptTemplateRead = {
      compareInputTemplate: "Compare payload",
      compareInstructionsTemplate: "Compare instructions",
      createdAt: "2026-03-15T00:00:00Z",
      description: "Two-step template",
      freshInputTemplate: "Fresh payload",
      freshInstructionsTemplate: "Fresh instructions",
      id: 1,
      inputTemplate: null,
      instructionsTemplate: null,
      name: "Two-step Template",
      revision: 2,
      status: "active",
      templateMode: "two_step",
      updatedAt: "2026-03-15T00:00:00Z",
    };

    render(
      <PromptTemplateForm
        initial={initial}
        isPending={false}
        onCancel={() => {}}
        onSave={onSave}
      />,
    );

    fireEvent.change(screen.getByLabelText("Fresh Input Template"), {
      target: { value: "Updated fresh payload" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        compareInputTemplate: "Compare payload",
        compareInstructionsTemplate: "Compare instructions",
        description: "Two-step template",
        freshInputTemplate: "Updated fresh payload",
        freshInstructionsTemplate: "Fresh instructions",
        inputTemplate: null,
        instructionsTemplate: null,
        name: "Two-step Template",
        templateMode: "two_step",
      }),
    );
  });
});
