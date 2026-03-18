export interface ReportRead {
  id: number;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportUpdateInput {
  content?: string;
}
