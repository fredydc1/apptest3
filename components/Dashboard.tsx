import React, { useMemo, useState } from 'react';
import { CashFlowSession, Employee, EmployeeType, HourlyEmployee, SalariedEmployee, SupplierExpense, StructuralCost } from '../types';
import { Card } from './ui/Card';
import { ChartPieIcon } from './icons/ChartPieIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { TrendingDownIcon } from './icons/TrendingDownIcon';
import { ScaleIcon } from './icons/ScaleIcon';
import { Input } from './ui/Input';
import { CalendarIcon } from './icons/CalendarIcon';

interface DashboardProps {
  sessions: CashFlowSession[];
  employees: Employee[];
  expenses: SupplierExpense[];
  structuralCosts: StructuralCost[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
};

interface StackedBarChartProps {
    data: { label: string; value: number; color: string }[];
    total: number;
}

const StackedBarChart: React.FC<StackedBarChartProps> = ({ data, total }) => {
    if (total === 0) {
        return <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8 flex items-center justify-center text-xs text-gray-500">Sin ingresos para comparar</div>;
    }

    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8 flex overflow-hidden" title={`Gastos totales: ${formatCurrency(data.reduce((sum, item) => sum + item.value, 0))}`}>
            {data.map((item, index) => {
                const percentage = (item.value / total) * 100;
                if (percentage <= 0) return null;
                
                return (
                    <div
                        key={index}
                        className="h-full transition-all duration-300"
                        style={{
                            width: `${percentage}%`,
                            backgroundColor: item.color,
                        }}
                        title={`${item.label}: ${formatCurrency(item.value)} (${percentage.toFixed(1)}% de los ingresos)`}
                    />
                );
            })}
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ sessions, employees, expenses, structuralCosts }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // e.g., "2024-07"

  const monthlyData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const targetMonth = month - 1; // JS months are 0-indexed
    const targetYear = year;
    
    const selectedDate = new Date(targetYear, targetMonth, 1);

    const filterBySelectedMonth = (item: { date: string }) => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === targetMonth && itemDate.getFullYear() === targetYear;
    };

    const sessionsThisMonth = sessions.filter(filterBySelectedMonth);
    const supplierExpensesThisMonth = expenses.filter(filterBySelectedMonth);
    const structuralCostsThisMonth = structuralCosts.filter(filterBySelectedMonth);

    const hourlyEmployees = employees.filter((e): e is HourlyEmployee => e.employeeType === EmployeeType.Hourly);
    const salariedEmployees = employees.filter((e): e is SalariedEmployee => e.employeeType === EmployeeType.Salaried);

    const totalIncome = sessionsThisMonth.reduce((sum, s) => {
      const income = s.income;
      const sessionIncome = income ? (
          income.barra1 +
          income.barra2 +
          income.barra3 +
          income.barra4 +
          income.restaurante +
          income.vip +
          income.tickets +
          income.vapers +
          income.shishas
      ) : 0;
      return sum + sessionIncome;
    }, 0);

    const totalDirectExpenses = sessionsThisMonth.reduce((sum, s) => 
      sum + s.expenses.reduce((expenseSum, e) => expenseSum + e.amount, 0), 0);
      
    const totalHourlyCost = sessionsThisMonth.reduce((total, session) => {
      const sessionCost = session.workedHours.reduce((sessionTotal, log) => {
        const employee = hourlyEmployees.find(e => e.id === log.employeeId);
        return sessionTotal + (employee ? log.hours * employee.hourlyRate : 0);
      }, 0);
      return total + sessionCost;
    }, 0);
    
    // Coste de personal fijo se aplica entero cada mes, independientemente de las sesiones.
    const totalSalariedCost = salariedEmployees.reduce((sum, emp) => sum + emp.baseSalary + emp.otherCosts, 0);
    const totalSupplierExpenses = supplierExpensesThisMonth.reduce((sum, e) => sum + e.amount, 0);
    
    // Sumamos solo los costes estructurales del mes seleccionado
    const totalStructuralCosts = structuralCostsThisMonth.reduce((sum, c) => sum + c.amount, 0);
    
    const totalExpenses = totalDirectExpenses + totalHourlyCost + totalSalariedCost + totalSupplierExpenses + totalStructuralCosts;
    const netProfit = totalIncome - totalExpenses;
    
    return {
      monthName: selectedDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
      totalIncome,
      totalExpenses,
      netProfit,
      costBreakdown: [
        { label: 'Gastos Directos (Caja)', value: totalDirectExpenses, color: '#ef4444' }, // red-500
        { label: 'Personal por Horas', value: totalHourlyCost, color: '#f97316' }, // orange-500
        { label: 'Personal Fijo', value: totalSalariedCost, color: '#8b5cf6' }, // violet-500
        { label: 'Gastos de Proveedores', value: totalSupplierExpenses, color: '#3b82f6' }, // blue-500
        { label: 'Gastos de Estructura', value: totalStructuralCosts, color: '#10b981' }, // emerald-500
      ],
      barChartData: [
        { 
            label: 'Costes Fijos (Personal + Estructura)', 
            value: totalSalariedCost + totalStructuralCosts, 
            color: '#8b5cf6' // violet-500
        },
        { 
            label: 'Proveedores', 
            value: totalSupplierExpenses, 
            color: '#3b82f6' // blue-500
        },
        { 
            label: 'Costes Variables de Sesión', 
            value: totalHourlyCost + totalDirectExpenses, 
            color: '#f97316' // orange-500
        }
      ]
    };
  }, [sessions, employees, expenses, structuralCosts, selectedMonth]);

  const totalCostForBreakdown = monthlyData.costBreakdown.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Dashboard: Resumen de <span className="capitalize">{monthlyData.monthName.replace Smonths are 0-indexed
    const targetYear = year;
    
    const selectedDate = new Date(targetYear, targetMonth, 1);

    const filterBySelectedMonth = (item: { date: string }) => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === targetMonth && itemDate.getFullYear() === targetYear;
    };

    const sessionsThisMonth = sessions.filter(filterBySelectedMonth);
    const supplierExpensesThisMonth = expenses.filter(filterBySelectedMonth);
    const structuralCostsThisMonth = structuralCosts.filter(filterBySelectedMonth);

    const hourlyEmployees = employees.filter((e): e is HourlyEmployee => e.employeeType === EmployeeType.Hourly);
    const salariedEmployees = employees.filter((e): e is SalariedEmployee => e.employeeType === EmployeeType.Salaried);

    const totalIncome = sessionsThisMonth.reduce((sum, s) => {
      const income = s.income;
      const sessionIncome = income ? (
          income.barra1 +
          income.barra2 +
          income.barra3 +
          income.barra4 +
          income.restaurante +
          income.vip +
          income.tickets +
          income.vapers +
          income.shishas
      ) : 0;
      return sum + sessionIncome;
    }, 0);

    const totalDirectExpenses = sessionsThisMonth.reduce((sum, s) => 
      sum + s.expenses.reduce((expenseSum, e) => expenseSum + e.amount, 0), 0);
      
    const totalHourlyCost = sessionsThisMonth.reduce((total, session) => {
      const sessionCost = session.workedHours.reduce((sessionTotal, log) => {
        const employee = hourlyEmployees.find(e => e.id === log.employeeId);
        return sessionTotal + (employee ? log.hours * employee.hourlyRate : 0);
      }, 0);
      return total + sessionCost;
    }, 0);
    
    // Coste de personal fijo se aplica entero cada mes, independientemente de las sesiones.
    const totalSalariedCost = salariedEmployees.reduce((sum, emp) => sum + emp.baseSalary + emp.otherCosts, 0);
    const totalSupplierExpenses = supplierExpensesThisMonth.reduce((sum, e) => sum + e.amount, 0);
    
    // Sumamos solo los costes estructurales del mes seleccionado
    const totalStructuralCosts = structuralCostsThisMonth.reduce((sum, c) => sum + c.amount, 0);
    
    const totalExpenses = totalDirectExpenses + totalHourlyCost + totalSalariedCost + totalSupplierExpenses + totalStructuralCosts;
    const netProfit = totalIncome - totalExpenses;
    
    return {
      monthName: selectedDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
      totalIncome,
      totalExpenses,
      netProfit,
      costBreakdown: [
        { label: 'Gastos Directos (Caja)', value: totalDirectExpenses, color: '#ef4444' }, // red-500
        { label: 'Personal por Horas', value: totalHourlyCost, color: '#f97316' }, // orange-500
        { label: 'Personal Fijo', value: totalSalariedCost, color: '#8b5cf6' }, // violet-500
        { label: 'Gastos de Proveedores', value: totalSupplierExpenses, color: '#3b82f6' }, // blue-500
        { label: 'Gastos de Estructura', value: totalStructuralCosts, color: '#10b981' }, // emerald-500
      ],
      barChartData: [
        { 
            label: 'Costes Fijos (Personal + Estructura)', 
            value: totalSalariedCost + totalStructuralCosts, 
            color: '#8b5cf6' // violet-500
        },
        { 
            label: 'Proveedores', 
            value: totalSupplierExpenses, 
            color: '#3b82f6' // blue-500
        },
        { 
            label: 'Costes Variables de Sesión', 
            value: totalHourlyCost + totalDirectExpenses, 
            color: '#f97316' // orange-500
        }
      ]
    };
  }, [sessions, employees, expenses, structuralCosts, selectedMonth]);

  const totalCostForBreakdown = monthlyData.costBreakdown.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Dashboard: Resumen de <span className="capitalize">{monthlyData.monthName.replace(/\b\w/g, l => l.toUpperCase())}</span>
        </h2>
        <div className="relative flex items-center">
            <CalendarIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
                type="month"
                label=""
                aria-label="Seleccionar mes y año"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="pl-10 !py-2 text-sm"
                wrapperClassName="w-48"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
            <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/50 mr-4">
                    <TrendingUpIcon className="h-6 w-6 text-green-500" />
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ingresos Totales</p>
                    <p className="text-2xl font-bold">{formatCurrency(monthlyData.totalIncome)}</p>
                </div>
            </div>
        </Card>
         <Card>
            <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/50 mr-4">
                    <TrendingDownIcon className="h-6 w-6 text-red-500" />
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gastos Totales</p>
                    <p className="text-2xl font-bold">{formatCurrency(monthlyData.totalExpenses)}</p>
                </div>
            </div>
        </Card>
        <Card className={monthlyData.netProfit >= 0 ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}>
             <div className="flex items-center">
                 <div className={`p-3 rounded-full mr-4 ${monthlyData.netProfit >= 0 ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                    <ScaleIcon className={`h-6 w-6 ${monthlyData.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                 </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Beneficio Neto</p>
                    <p className={`text-2xl font-bold ${monthlyData.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(monthlyData.netProfit)}</p>
                </div>
            </div>
        </Card>
      </div>
      
      <Card>
        <h3 className="text-lg font-semibold mb-1 flex items-center">
            <ChartPieIcon className="h-6 w-6 mr-2 text-indigo-500" />
            Desglose de Gastos
        </h3>
         <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 -mt-1 ml-8">
            Los porcentajes en la lista se calculan en base a los ingresos totales del mes.
        </p>
        
        <div className="mb-4">
            <StackedBarChart data={monthlyData.barChartData} total={monthlyData.totalIncome} />
        </div>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-6 text-sm">
          {monthlyData.barChartData.map((item, index) => (
              <div key={index} className="flex items-center">
                  <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                  <span>{item.label}</span>
              </div>
          ))}
        </div>

        <div className="space-y-3 border-t dark:border-gray-700 pt-4">
          {monthlyData.costBreakdown.sort((a, b) => b.value - a.value).map((item, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full mr-3" style={{ backgroundColor: item.color }}></span>
                <span>{item.label}</span>
              </div>
              <div className="font-semibold text-right">
                {formatCurrency(item.value)}
                <span className="ml-2 w-16 inline-block text-xs text-gray-500 dark:text-gray-400">
                  ({monthlyData.totalIncome > 0 ? ((item.value / monthlyData.totalIncome) * 100).toFixed(1) : '0.0'}%)
                </span>
              </div>
            </div>
          ))}
          <div className="border-t dark:border-gray-700 pt-3 mt-3 !-mb-1 flex justify-between font-bold">
             <span>Coste Total del Desglose</span>
             <span>{formatCurrency(totalCostForBreakdown)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;