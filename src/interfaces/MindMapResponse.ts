export interface Branch {
  label: string;
  children: Branch[];
}

export interface MindMapResponse {
  central: string;
  branches: Branch[];
}
