export interface Brand {
  id: string;
  name: string;
  manager: string;
  budget: number;
  spent: number;
  spentRate: string;
  description: string;
}

export type CampaignStatus = "계획중" | "진행중" | "완료" | "취소";

export interface Campaign {
  id: string;
  brandId: string;
  name: string;
  startDate: string;
  endDate: string;
  plannedBudget: number;
  actualBudget: number;
  budgetRate: string;
  status: CampaignStatus;
  progress: string;
}

export interface Milestone {
  id: string;
  campaignId: string;
  name: string;
  dueDate: string;
  manager: string;
  completed: boolean;
  campaignName: string;
  notes: string;
}
