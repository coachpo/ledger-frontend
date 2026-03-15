export interface UserSnippetRead {
  id: number;
  snippetId: string;
  content: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSnippetCreate {
  snippetId: string;
  content: string;
  description?: string | null;
}

export interface UserSnippetUpdate {
  content?: string | null;
  description?: string | null;
}
