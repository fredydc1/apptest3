export interface Income {
  id: string;
  date: string;
  barra1: number;
  barra2: number;
  barra3: number;
  barra4: number;
  restaurante: number;
  vip: number;
  tickets: number;
  vapers: number;
  shishas: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
}

export interface EmployeeWorkLog {
  employeeId: string;
  hours: number;
}

export interface CashFlowSession {
  id: string;
  // FIX: Add optional rowIndex to match the object shape after being loaded from Google Sheets.
  rowIndex?: number;
  date: string;
  description: string;
  income: Income | null;
  expenses: Expense[];
  workedHours: EmployeeWorkLog[];
}

export enum EmployeeType {
  Salaried = 'SALARIED',
  Hourly = 'HOURLY',
}

export interface SalariedEmployee {
  id: string;
  // FIX: Add optional rowIndex to match the object shape after being loaded from Google Sheets.
  rowIndex?: number;
  employeeType: EmployeeType.Salaried;
  name: string;
  baseSalary: number;
  otherCosts: number;
}

export interface HourlyEmployee {
  id:string;
  // FIX: Add optional rowIndex to match the object shape after being loaded from Google Sheets.
  rowIndex?: number;
  employeeType: EmployeeType.Hourly;
  name: string;
  hourlyRate: number;
}

export type Employee = SalariedEmployee | HourlyEmployee;

export interface SupplierExpense {
  id: string;
  // FIX: Add optional rowIndex to match the object shape after being loaded from Google Sheets.
  rowIndex?: number;
  supplierName: string;
  description: string;
  amount: number;
  date: string;
  imageUrl: string;
}

export enum StructuralCostType {
  Fixed = 'FIXED',
  Variable = 'VARIABLE',
}

export interface StructuralCost {
  id: string;
  // FIX: Add optional rowIndex to match the object shape after being loaded from Google Sheets.
  rowIndex?: number;
  name: string;
  amount: number;
  type: StructuralCostType;
  category: string; 
  date: string; 
}

export interface AppData {
    cashFlowSessions: CashFlowSession[];
    employees: Employee[];
    supplierExpenses: SupplierExpense[];
    structuralCosts: StructuralCost[];
}

// Alias for backwards compatibility if needed elsewhere, though CashFlow now uses Income.
export type Transaction = Income;