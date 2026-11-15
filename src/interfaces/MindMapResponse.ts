export interface Branch {
  label: string;
  description?: string | null;
  children: Branch[];
}

export interface MindMapResponse {
  central: string;
  description?: string | null;
  branches: Branch[];
}
