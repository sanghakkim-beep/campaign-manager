export interface Brand {
  id: string;
  name: string;
  budget: number;
  spent: number;
  spentRate: string;
  remaining: number;
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
