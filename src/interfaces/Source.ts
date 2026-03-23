export interface Source {
  id: string;
  notebookId: string;
  icon?: string;
  title: string;
  content?: string;
  summary?: string;
  link: string;
  status: SourceStatus;
  type: SourceType;
  createdAt: Date;
  updatedAt: Date;
}

export type SourceType = "Website" | "YouTube Video" | "File" | "Text";
export type SourceStatus = "PENDING" | "READY" | "FAILED";
