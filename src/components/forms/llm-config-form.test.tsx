import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LLMConfigForm } from "./llm-config-form";

describe("LLMConfigForm", () => {
  it("submits the required OpenAI endpoint mode for new configs", async () => {
    const onSave = vi.fn();

    render(
      <LLMConfigForm
        isPending={false}
        onCancel={() => {}}
        onSave={onSave}
      />,
    );

    fireEvent.change(screen.getByLabelText("Display Name"), {
      target: { value: "Primary OpenAI" },
    });
    fireEvent.change(screen.getByLabelText("API Key"), {
      target: { value: "sk-test-key" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Save" }).closest("form")!);

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        apiKeySecret: "sk-test-key",
        baseUrl: null,
        displayName: "Primary OpenAI",
        enabled: true,
        model: "gpt-5.4",
        openaiEndpointMode: "responses",
        provider: "openai",
      }),
    );
  });
});
