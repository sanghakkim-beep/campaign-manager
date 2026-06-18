export interface Brand {
  id: string;
  name: string;
  manager: string;
  budget: number;
  spent: number;
  spentRate: string;
  description: string;
}

export interface Campaign {
  id: string;
  brandId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "planned" | "active" | "completed" | "cancelled";
  description?: string;
}

export interface Milestone {
  id: string;
  campaignId: string;
  name: string;
  dueDate: string;
  completed: boolean;
  description?: string;
}
