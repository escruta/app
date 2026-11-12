export interface Note {
  id: string;
  notebookId: string;
  groupId?: string;
  title: string;
  content?: string;
  createdAt: Date;
  updatedAt: Date;
}
