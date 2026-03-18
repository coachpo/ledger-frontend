export interface ReportMetadata {
  author: string | null;
  description: string | null;
  tags: string[];
}

export interface ReportRead {
  id: number;
  name: string;
  slug: string;
  source: "compiled" | "uploaded";
  content: string;
  metadata: ReportMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ReportUpdateInput {
  content?: string;
}
