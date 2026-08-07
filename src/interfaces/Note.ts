export interface Note {
  id: string;
  notebookId: string;
  title: string;
  content?: string;
  createdAt: Date;
  updatedAt: Date;
}
