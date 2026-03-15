export interface PortfolioRead {
  id: number;
  name: string;
  description: string | null;
  baseCurrency: string;
  positionCount: number;
  balanceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioWriteInput {
  name: string;
  description?: string | null;
  baseCurrency: string;
}

export interface PortfolioUpdateInput {
  name?: string;
  description?: string | null;
}

export interface PortfolioStockAnalysisSettingsRead {
  id: number;
  portfolioId: number;
  enabled: boolean;
  defaultPromptTemplateId: number | null;
  defaultLlmConfigId: number | null;
  compareToOrigin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioStockAnalysisSettingsUpdate {
  enabled?: boolean | null;
  defaultPromptTemplateId?: number | null;
  defaultLlmConfigId?: number | null;
  compareToOrigin?: boolean | null;
}
