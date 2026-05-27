
export interface Area {
  id: number;
  area_id?: number; // Backend uses area_id
  name: string;
  area_name?: string; // Backend uses area_name
  dept_id?: string;
}

export interface Counter {
  counter_id: number;
  counter_name: string;
  is_priority: boolean;
  area_id: number;
  area_name?: string;
  is_active: boolean;
}
