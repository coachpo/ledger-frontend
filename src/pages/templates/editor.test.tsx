import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TemplateEditorPage } from "./editor";

const navigateMock = vi.fn();
const compileInlineMock = vi.fn();
const compileReportMutateMock = vi.fn();

vi.mock("react-router", () => ({
  useNavigate: () => navigateMock,
  useParams: () => ({}),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/hooks/use-debounce", () => ({
  useDebounce: (value: string) => value,
}));

vi.mock("@/lib/markdown-format", () => ({
  formatMarkdown: vi.fn(),
}));

vi.mock("@/hooks/use-templates", () => ({
  useTemplate: () => ({ data: undefined, isLoading: false }),
  useCreateTemplate: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useUpdateTemplate: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useCompileInline: () => ({
    mutate: compileInlineMock,
    data: undefined,
    error: null,
    isPending: false,
  }),
  usePlaceholders: () => ({
    data: {
      portfolios: [
        {
          slug: "growth",
          name: "Growth",
          baseCurrency: "USD",
          positions: [{ symbol: "AAPL", name: "Apple Inc." }],
        },
      ],
      reports: [
        {
          name: "latest_report_20260318_210455",
          createdAt: "2026-03-18T21:04:55Z",
        },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-reports", () => ({
  useCompileReport: () => ({
    isPending: false,
    mutate: compileReportMutateMock,
  }),
}));

describe("TemplateEditorPage", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    compileInlineMock.mockReset();
    compileReportMutateMock.mockReset();
  });

  it("shows dynamic report selector guidance and inserts a selector example", () => {
    render(<TemplateEditorPage />);

    fireEvent.click(screen.getByRole("button", { name: /dynamic report selectors/i }));

    expect(
      screen.getByText(
        /Use these when the latest matching report matters more than a fixed saved name\./i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/`reports\[0\]` is the newest report\./i)).toBeInTheDocument();
    expect(screen.getByText('reports.latest("AAPL").content')).toBeInTheDocument();
    expect(screen.getByText('reports.by_tag("weekly_review").latest.content')).toBeInTheDocument();

    fireEvent.click(screen.getByText('reports.latest("AAPL").content'));

    expect(screen.getByPlaceholderText("Enter template content…")).toHaveValue(
      '{{reports.latest("AAPL").content}}',
    );
  });
});
