export interface Note {
  id: string;
  notebookId?: string;
  folderId?: string;
  sourceId?: string;
  title: string;
  content?: string;
  createdAt: Date;
  updatedAt: Date;
}
