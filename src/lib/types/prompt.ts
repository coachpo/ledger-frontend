export type PromptTemplateMode = "single" | "two_step";
export type PromptTemplateStatus = "active" | "archived";

export interface PromptTemplateRead {
  id: number;
  name: string;
  description: string | null;
  revision: number;
  status: PromptTemplateStatus;
  templateMode: PromptTemplateMode;
  instructionsTemplate: string | null;
  inputTemplate: string | null;
  freshInstructionsTemplate: string;
  freshInputTemplate: string;
  compareInstructionsTemplate: string;
  compareInputTemplate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptTemplateWrite {
  name: string;
  description?: string | null;
  templateMode?: PromptTemplateMode;
  instructionsTemplate?: string | null;
  inputTemplate?: string | null;
  freshInstructionsTemplate?: string | null;
  freshInputTemplate?: string | null;
  compareInstructionsTemplate?: string | null;
  compareInputTemplate?: string | null;
}

export interface PromptTemplateUpdate {
  name?: string | null;
  description?: string | null;
  templateMode?: PromptTemplateMode | null;
  instructionsTemplate?: string | null;
  inputTemplate?: string | null;
  freshInstructionsTemplate?: string | null;
  freshInputTemplate?: string | null;
  compareInstructionsTemplate?: string | null;
  compareInputTemplate?: string | null;
  status?: PromptTemplateStatus | null;
}
