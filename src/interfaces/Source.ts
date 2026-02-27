export default interface Source {
  id: string;
  notebookId: string;
  icon?: string;
  title: string;
  content?: string;
  isConvertedByAi: boolean;
  summary?: string;
  link: string;
  status: "PENDING" | "READY" | "FAILED";
  createdAt: Date;
  updatedAt: Date;
}
