export interface Notebook {
  id: string;
  icon?: string;
  title: string;
  folderId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt?: Date | null;
}

export interface NotebooksPageResponse {
  notebooks: Notebook[];
  total: number;
  hasMore: boolean;
}
