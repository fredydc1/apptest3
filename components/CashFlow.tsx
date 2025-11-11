import React, { useState, useMemo, useEffect } from 'react';
import { CashFlowSession, Income, Expense, Employee, EmployeeType, HourlyEmployee, EmployeeWorkLog } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';

// Props interfaces
interface CashFlowProps {
  sessions: CashFlowSession[];
  employees: Employee[];
  onAddSession: (sessionData: Pick<CashFlowSession, 'date' | 'description'>) => void;
  onDeleteSession: (id: string) => void;
  onUpdateSession: (id: string, session: Omit<CashFlowSession, 'id'>) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
};

const SessionCard: React.FC<Omit<CashFlowProps, 'sessions' | 'onAddSession' | 'employees'> & { session: CashFlowSession; employees: Employee[] }> = ({
  session,
  employees,
  onDeleteSession,
  onUpdateSession,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Local state for forms
    const [localSession, setLocalSession] = useState<CashFlowSession>(session);
    const [expenseDescription, setExpenseDescription] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');

    useEffect(() => {
        setLocalSession(session);
    }, [session]);

    const hourlyEmployees = useMemo(() => employees.filter((e): e is HourlyEmployee => e.employeeType === EmployeeType.Hourly), [employees]);

    const summary = useMemo(() => {
        const totalIncome = localSession.income ? Object.values(localSession.income).reduce((sum: number, value: unknown) => typeof value === 'number' ? sum + value : sum, 0) : 0;
        const totalExpenses = localSession.expenses.reduce((sum, e) => sum + e.amount, 0);
        
        const totalHourlyCost = localSession.workedHours.reduce((total, log) => {
            const employee = hourlyEmployees.find(e => e.id === log.employeeId);
            // FIX: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
            // Safely convert `log.hours` to a number to handle cases where it might be a string.
            return total + (employee ? (Number(log.hours) || 0) * employee.hourlyRate : 0);
        }, 0);
        
        const netResult = totalIncome - totalExpenses - totalHourlyCost;
        
        return { totalIncome, totalExpenses, totalHourlyCost, netResult };
    }, [localSession, hourlyEmployees]);
    
    const handleIncomeChange = (field: keyof Omit<Income, 'id' | 'date'>, value: string) => {
        const newIncome = {
            ...(localSession.income || { id: crypto.randomUUID(), date: localSession.date, barra1:0, barra2:0, barra3:0, barra4:0, restaurante:0, vip:0, tickets:0, vapers:0, shishas:0 }),
            [field]: parseFloat(value) || 0
        };
        setLocalSession(prev => ({ ...prev, income: newIncome }));
    };

    const handleSaveIncome = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSession(localSession.id, localSession);
    };
    
    const handleDeleteIncome = () => {
        const updatedSession = { ...localSession, income: null };
        setLocalSession(updatedSession);
        onUpdateSession(updatedSession.id, updatedSession);
    }

    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(expenseAmount);
        if (expenseDescription.trim() && !isNaN(amount) && amount > 0) {
            const newExpense = { id: crypto.randomUUID(), description: expenseDescription, amount };
            const updatedSession = { ...localSession, expenses: [...localSession.expenses, newExpense] };
            setLocalSession(updatedSession);
            onUpdateSession(updatedSession.id, updatedSession);
            setExpenseDescription('');
            setExpenseAmount('');
        }
    };
    
    const handleDeleteExpense = (expenseId: string) => {
        const updatedExpenses = localSession.expenses.filter(e => e.id !== expenseId);
        const updatedSession = { ...localSession, expenses: updatedExpenses };
        setLocalSession(updatedSession);
        onUpdateSession(updatedSession.id, updatedSession);
    };

    const handleUpdateWorkedHours = (employeeId: string, hours: number) => {
        let newWorkedHours: EmployeeWorkLog[];
        const existingLogIndex = localSession.workedHours.findIndex(wh => wh.employeeId === employeeId);

        if (existingLogIndex > -1) {
            if (hours > 0) {
                newWorkedHours = localSession.workedHours.map((wh, index) => index === existingLogIndex ? { ...wh, hours } : wh);
            } else {
                newWorkedHours = localSession.workedHours.filter((_, index) => index !== existingLogIndex);
            }
        } else if (hours > 0) {
            newWorkedHours = [...localSession.workedHours, { employeeId, hours }];
        } else {
            return; // No change
        }

        const updatedSession = { ...localSession, workedHours: newWorkedHours };
        setLocalSession(updatedSession);
        onUpdateSession(updatedSession.id, updatedSession);
    };

    const income = localSession.income || { barra1:0, barra2:0, barra3:0, barra4:0, restaurante:0, vip:0, tickets:0, vapers:0, shishas:0 };

    return (
        <Card>
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div>
                    <p className="font-bold text-lg">{localSession.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(localSession.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className={`text-right ${summary.netResult >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        <p className="text-sm">Resultado Neto</p>
                        <p className="font-bold text-xl">{formatCurrency(summary.netResult)}</p>
                    </div>
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        {isExpanded ? <ArrowUpIcon className="h-5 w-5" /> : <ArrowDownIcon className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="mt-6 border-t dark:border-gray-700 pt-6 space-y-6">
                    {/* Income Section */}
                    <section>
                        <h4 className="font-semibold text-lg mb-2">Ingresos de la Sesión</h4>
                        <form onSubmit={handleSaveIncome} className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <Input label="Barra 1 (€)" type="number" step="0.01" value={income.barra1} onChange={e => handleIncomeChange('barra1', e.target.value)} />
                                <Input label="Barra 2 (€)" type="number" step="0.01" value={income.barra2} onChange={e => handleIncomeChange('barra2', e.target.value)} />
                                <Input label="Barra 3 (€)" type="number" step="0.01" value={income.barra3} onChange={e => handleIncomeChange('barra3', e.target.value)} />
                                <Input label="Barra 4 (€)" type="number" step="0.01" value={income.barra4} onChange={e => handleIncomeChange('barra4', e.target.value)} />
                                <Input label="Restaurante (€)" type="number" step="0.01" value={income.restaurante} onChange={e => handleIncomeChange('restaurante', e.target.value)} />
                                <Input label="VIP (€)" type="number" step="0.01" value={income.vip} onChange={e => handleIncomeChange('vip', e.target.value)} />
                                <Input label="Tickets (€)" type="number" step="0.01" value={income.tickets} onChange={e => handleIncomeChange('tickets', e.target.value)} />
                                <Input label="Vapers (€)" type="number" step="0.01" value={income.vapers} onChange={e => handleIncomeChange('vapers', e.target.value)} />
                                <Input label="Shishas (€)" type="number" step="0.01" value={income.shishas} onChange={e => handleIncomeChange('shishas', e.target.value)} />
                            </div>
                            <div className="flex justify-end space-x-2">
                               {localSession.income && <Button type="button" onClick={handleDeleteIncome} className="bg-red-600 hover:bg-red-700">Borrar Ingresos</Button>}
                                <Button type="submit">Guardar Ingresos</Button>
                            </div>
                        </form>
                    </section>
                    
                    {/* Expenses Section */}
                    <section className="border-t dark:border-gray-700 pt-4">
                         <h4 className="font-semibold text-lg mb-2">Gastos Directos</h4>
                         <form onSubmit={handleAddExpense} className="flex items-end gap-2 mb-4">
                            <Input label="Descripción" value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} placeholder="Ej: Hielo" />
                            <Input label="Importe (€)" type="number" step="0.01" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} placeholder="0.00" />
                            <Button type="submit" className="shrink-0"><PlusIcon className="h-5 w-5"/></Button>
                         </form>
                         <ul className="space-y-2">
                             {localSession.expenses.map(exp => (
                                 <li key={exp.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
                                     <span>{exp.description}</span>
                                     <div className="flex items-center space-x-2">
                                        <span className="font-medium">{formatCurrency(exp.amount)}</span>
                                        <button onClick={() => handleDeleteExpense(exp.id)}>
                                            <TrashIcon className="h-4 w-4 text-gray-400 hover:text-red-500" />
                                        </button>
                                     </div>
                                 </li>
                             ))}
                         </ul>
                    </section>
                    
                     {/* Hourly Personnel Section */}
                    <section className="border-t dark:border-gray-700 pt-4">
                        <h4 className="font-semibold text-lg mb-2">Horas de Personal</h4>
                        <div className="space-y-2">
                            {hourlyEmployees.map(emp => (
                                <div key={emp.id} className="flex items-center justify-between">
                                    <label htmlFor={`hours-${localSession.id}-${emp.id}`} className="font-medium">{emp.name}</label>
                                    <Input
                                        id={`hours-${localSession.id}-${emp.id}`}
                                        type="number"
                                        label=""
                                        step="0.1"
                                        placeholder="Horas"
                                        wrapperClassName="w-24"
                                        value={localSession.workedHours.find(wh => wh.employeeId === emp.id)?.hours || ''}
                                        onChange={(e) => handleUpdateWorkedHours(emp.id, parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Summary and Delete */}
                    <section className="border-t dark:border-gray-700 pt-4">
                        <h4 className="font-semibold text-lg mb-2">Resumen de la Sesión</h4>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between"><span>Ingresos Totales:</span> <span className="font-medium text-green-500">{formatCurrency(summary.totalIncome)}</span></div>
                            <div className="flex justify-between"><span>Gastos Directos:</span> <span className="font-medium text-red-500">{formatCurrency(summary.totalExpenses)}</span></div>
                            <div className="flex justify-between"><span>Coste Personal (Horas):</span> <span className="font-medium text-red-500">{formatCurrency(summary.totalHourlyCost)}</span></div>
                            <div className="flex justify-between font-bold text-base border-t dark:border-gray-600 pt-1 mt-1"><span>Resultado Neto:</span> <span className={summary.netResult >= 0 ? 'text-green-500' : 'text-red-500'}>{formatCurrency(summary.netResult)}</span></div>
                        </div>
                        <div className="flex justify-end mt-4">
                             <Button onClick={() => onDeleteSession(localSession.id)} className="bg-red-600 hover:bg-red-700 text-sm">
                                 <TrashIcon className="h-4 w-4 mr-2" />
                                 Eliminar Sesión Completa
                             </Button>
                        </div>
                    </section>
                </div>
            )}
        </Card>
    );
};


const CashFlow: React.FC<CashFlowProps> = ({ sessions, employees, onAddSession, ...rest }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');

    const handleAddSession = (e: React.FormEvent) => {
        e.preventDefault();
        if (description.trim()) {
            onAddSession({ date, description });
            setDescription('');
        }
    };

    const sortedSessions = useMemo(() => {
        return [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sessions]);

    const totalNetResult = useMemo(() => {
        const hourlyEmployees = employees.filter((e): e is HourlyEmployee => e.employeeType === EmployeeType.Hourly);
        
        return sessions.reduce((totalNet, session) => {
            const totalIncome = session.income ? Object.values(session.income).reduce((sum: number, value: unknown) => typeof value === 'number' ? sum + value : sum, 0) : 0;
            const totalExpenses = session.expenses.reduce((sum, e) => sum + e.amount, 0);
            const totalHourlyCost = session.workedHours.reduce((total, log) => {
                const employee = hourlyEmployees.find(e => e.id === log.employeeId);
                // FIX: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
                // Safely convert `log.hours` to a number to handle cases where it might be a string.
                return total + (employee ? (Number(log.hours) || 0) * employee.hourlyRate : 0);
            }, 0);
            return totalNet + (totalIncome - totalExpenses - totalHourlyCost);
        }, 0);

    }, [sessions, employees]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Caja y Sesiones de Trabajo</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <div className="flex items-center">
                        <DocumentTextIcon className="h-8 w-8 text-indigo-500 mr-4"/>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Nº de Sesiones Registradas</p>
                            <p className="text-2xl font-bold">{sessions.length}</p>
                        </div>
                    </div>
                </Card>
                <Card className={totalNetResult >= 0 ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}>
                     <div className="flex items-center">
                        <p className="text-3xl font-bold mr-4">💰</p>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Resultado Neto Acumulado</p>
                            <p className={`text-2xl font-bold ${totalNetResult >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(totalNetResult)}</p>
                        </div>
                    </div>
                </Card>
            </div>
            
            <Card>
                <h3 className="text-lg font-semibold mb-4">Añadir Nueva Sesión de Trabajo</h3>
                <form onSubmit={handleAddSession} className="flex flex-col sm:flex-row gap-4 items-end">
                    <Input 
                        label="Descripción de la Sesión" 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        placeholder="Ej: Sábado Noche"
                        wrapperClassName="w-full sm:flex-1"
                    />
                    <Input 
                        label="Fecha" 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)}
                        wrapperClassName="w-full sm:w-auto"
                    />
                    <Button type="submit" className="w-full sm:w-auto whitespace-nowrap">
                        <PlusIcon className="h-5 w-5 mr-2"/>
                        Añadir Sesión
                    </Button>
                </form>
                 <div className="flex items-start mt-4 text-xs text-gray-500 dark:text-gray-400">
                    <InformationCircleIcon className="h-4 w-4 mr-2 shrink-0 mt-0.5" />
                    <span>
                        Primero crea una sesión. Luego, haz clic en ella para desplegar las opciones y añadir ingresos, gastos y horas de personal para esa fecha. Los cambios se guardan automáticamente.
                    </span>
                </div>
            </Card>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Historial de Sesiones</h3>
                {sortedSessions.length > 0 ? (
                    sortedSessions.map(session => (
                        <SessionCard 
                            key={session.id} 
                            session={session} 
                            employees={employees}
                            {...rest}
                        />
                    ))
                ) : (
                    <Card className="text-center py-8">
                         <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400" />
                         <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No hay sesiones</h3>
                         <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Añade una nueva sesión para empezar a llevar el control de caja.</p>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default CashFlow;