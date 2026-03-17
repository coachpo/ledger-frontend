import type {
  PlaceholderTree,
  TextTemplateCompileRead,
  TextTemplateInlineCompileRead,
  TextTemplateRead,
  TextTemplateUpdateInput,
  TextTemplateWriteInput,
} from "../types/text-template";
import { type IdParam, request, toPathSegment } from "../api-client";

function templatePath(templateId: IdParam): string {
  return `/templates/${toPathSegment(templateId)}`;
}

export function listTemplates(signal?: AbortSignal): Promise<TextTemplateRead[]> {
  return request<TextTemplateRead[]>("/templates", { signal });
}

export function createTemplate(
  input: TextTemplateWriteInput,
  signal?: AbortSignal,
): Promise<TextTemplateRead> {
  return request<TextTemplateRead>("/templates", {
    body: input,
    method: "POST",
    signal,
  });
}

export function getTemplate(
  templateId: IdParam,
  signal?: AbortSignal,
): Promise<TextTemplateRead> {
  return request<TextTemplateRead>(templatePath(templateId), { signal });
}

export function updateTemplate(
  templateId: IdParam,
  input: TextTemplateUpdateInput,
  signal?: AbortSignal,
): Promise<TextTemplateRead> {
  return request<TextTemplateRead>(templatePath(templateId), {
    body: input,
    method: "PATCH",
    signal,
  });
}

export function deleteTemplate(templateId: IdParam, signal?: AbortSignal): Promise<void> {
  return request<void>(templatePath(templateId), {
    method: "DELETE",
    signal,
  });
}

export function compileTemplate(
  templateId: IdParam,
  signal?: AbortSignal,
): Promise<TextTemplateCompileRead> {
  return request<TextTemplateCompileRead>(`${templatePath(templateId)}/compile`, { signal });
}

export function compileTemplateInline(
  content: string,
  signal?: AbortSignal,
): Promise<TextTemplateInlineCompileRead> {
  return request<TextTemplateInlineCompileRead>("/templates/compile", {
    body: { content },
    method: "POST",
    signal,
  });
}

export function getPlaceholders(
  signal?: AbortSignal,
): Promise<PlaceholderTree> {
  return request<PlaceholderTree>("/templates/placeholders", { signal });
}

export const templatesApi = {
  compile: compileTemplate,
  compileInline: compileTemplateInline,
  create: createTemplate,
  delete: deleteTemplate,
  get: getTemplate,
  list: listTemplates,
  placeholders: getPlaceholders,
  update: updateTemplate,
} as const;
