export interface Category {
  id: number;
  uniqueId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryPayload {
  name: string;
}
