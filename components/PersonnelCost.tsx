import React, { useState, useMemo } from 'react';
import { Employee, SalariedEmployee, HourlyEmployee, EmployeeType, CashFlowSession } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { TrashIcon } from './icons/TrashIcon';
import { UserPlusIcon } from './icons/UserPlusIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ClockIcon } from './icons/ClockIcon';

interface PersonnelCostProps {
  employees: Employee[];
  sessions: CashFlowSession[];
  onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
  onDeleteEmployee: (id: string) => void;
}

const SalariedEmployeeForm: React.FC<{ onAddEmployee: (employee: Omit<SalariedEmployee, 'id'>) => void }> = ({ onAddEmployee }) => {
    const [name, setName] = useState('');
    const [baseSalary, setBaseSalary] = useState('');
    const [otherCosts, setOtherCosts] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const numBaseSalary = parseFloat(baseSalary);
        const numOtherCosts = parseFloat(otherCosts);

        if (!name.trim() || isNaN(numBaseSalary) || isNaN(numOtherCosts)) {
            alert('Por favor, rellena todos los campos con valores válidos.');
            return;
        }
        
        onAddEmployee({ name, baseSalary: numBaseSalary, otherCosts: numOtherCosts, employeeType: EmployeeType.Salaried });
        setName('');
        setBaseSalary('');
        setOtherCosts('');
    };

    return (
        <Card>
            <h3 className="text-lg font-semibold mb-4">Añadir Personal Fijo</h3>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y Apellido" label="Nombre y Apellido" />
                <Input type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} placeholder="0.00" label="Salario Base (€)" step="0.01"/>
                <Input type="number" value={otherCosts} onChange={(e) => setOtherCosts(e.target.value)} placeholder="0.00" label="Otros Costes (€)" step="0.01"/>
                <Button type="submit" className="md:col-span-3 flex items-center justify-center mt-4">
                    <UserPlusIcon className="h-5 w-5 mr-2" />
                    Añadir Empleado Fijo
                </Button>
            </form>
        </Card>
    );
};

const HourlyEmployeeForm: React.FC<{ onAddEmployee: (employee: Omit<HourlyEmployee, 'id'>) => void }> = ({ onAddEmployee }) => {
    const [name, setName] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');
  
    const handleAdd = (e: React.FormEvent) => {
      e.preventDefault();
      const numHourlyRate = parseFloat(hourlyRate);
  
      if (!name.trim() || isNaN(numHourlyRate) || numHourlyRate <= 0) {
        alert('Por favor, introduce un nombre y una tarifa por hora válida.');
        return;
      }
  
      onAddEmployee({ name, hourlyRate: numHourlyRate, employeeType: EmployeeType.Hourly });
      setName('');
      setHourlyRate('');
    };
  
    return (
      <Card>
        <h3 className="text-lg font-semibold mb-4">Añadir Personal por Horas</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" label="Nombre" />
          </div>
          <Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="0.00" label="Tarifa por Hora (€)" step="0.01" />
          <Button type="submit" className="md:col-span-3 flex items-center justify-center mt-4">
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Añadir Empleado por Horas
          </Button>
        </form>
      </Card>
    );
};

const HourlyEmployeeCard: React.FC<{
    employee: HourlyEmployee;
    sessions: CashFlowSession[];
    onDeleteEmployee: (id: string) => void;
    formatCurrency: (value: number) => string;
}> = ({ employee, sessions, onDeleteEmployee, formatCurrency }) => {
    
    const { workedSessions, totalEmployeeCost } = useMemo(() => {
        const sessionsWorked = sessions
            .map(session => {
                const log = session.workedHours.find(wh => wh.employeeId === employee.id);
                if (log && log.hours > 0) {
                    return {
                        sessionId: session.id,
                        date: session.date,
                        description: session.description,
                        hours: log.hours,
                        cost: log.hours * employee.hourlyRate
                    };
                }
                return null;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const totalCost = sessionsWorked.reduce((sum, s) => sum + s.cost, 0);

        return { workedSessions: sessionsWorked, totalEmployeeCost: totalCost };
    }, [sessions, employee]);

    return (
        <Card className="flex flex-col space-y-4">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold">{employee.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(employee.hourlyRate)} / hora</p>
                    <p className="text-lg font-semibold text-orange-500 mt-1">Coste Total: {formatCurrency(totalEmployeeCost)}</p>
                </div>
                <button onClick={() => onDeleteEmployee(employee.id)} className="bg-red-500 hover:bg-red-600 p-2 rounded-full text-white transition-colors duration-200">
                    <TrashIcon className="h-4 w-4" />
                </button>
            </div>

            {workedSessions.length > 0 ? (
                <div className="border-t dark:border-gray-700 pt-4">
                    <h5 className="text-sm font-semibold mb-2">Horas Registradas en 'Caja'</h5>
                    <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {workedSessions.map(session => (
                            <li key={session.sessionId} className="flex justify-between items-center text-sm p-2 rounded-md bg-gray-50 dark:bg-gray-700/50">
                                <div>
                                    <span>{new Date(session.date).toLocaleDateString('es-ES')} - {session.description}</span>
                                    <span className="block text-xs text-gray-400">{session.hours} horas</span>
                                </div>
                                <span className="font-medium">{formatCurrency(session.cost)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="border-t dark:border-gray-700 pt-4 text-center text-sm text-gray-500 italic">
                    No hay horas registradas para este empleado en la pestaña 'Caja'.
                </div>
            )}
        </Card>
    )
}


const PersonnelCost: React.FC<PersonnelCostProps> = ({ employees, sessions, onAddEmployee, onDeleteEmployee }) => {
    const [activeTab, setActiveTab] = useState<'salaried' | 'hourly'>('salaried');
    
    const { salariedEmployees, hourlyEmployees, totalSalariedCost, totalHourlyCost } = useMemo(() => {
        const salaried = employees.filter((e): e is SalariedEmployee => e.employeeType === EmployeeType.Salaried);
        const hourly = employees.filter((e): e is HourlyEmployee => e.employeeType === EmployeeType.Hourly);
    
        const salariedCost = salaried.reduce((sum, emp) => sum + emp.baseSalary + emp.otherCosts, 0);
        
        const hourlyCost = sessions.reduce((totalCost, session) => {
            const sessionHourlyCost = session.workedHours.reduce((sessionSum, log) => {
                const employee = hourly.find(e => e.id === log.employeeId);
                if (employee) {
                    return sessionSum + (log.hours * employee.hourlyRate);
                }
                return sessionSum;
            }, 0);
            return totalCost + sessionHourlyCost;
        }, 0);
    
        return {
            salariedEmployees: salaried,
            hourlyEmployees: hourly,
            totalSalariedCost: salariedCost,
            totalHourlyCost: hourlyCost
        };
      }, [employees, sessions]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
    };

    const tabButtonClasses = (tabName: 'salaried' | 'hourly') =>
        `px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
        activeTab === tabName
            ? 'bg-indigo-600 text-white shadow'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Gestión de Personal</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <div className="flex items-center">
                        <UsersIcon className="h-8 w-8 text-indigo-500 mr-4" />
                        <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Nº de Empleados</p>
                        <p className="text-2xl font-bold">{employees.length}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center">
                        <p className="text-3xl font-bold mr-4">💶</p>
                        <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Coste Fijo Mensual</p>
                        <p className="text-2xl font-bold text-orange-500">{formatCurrency(totalSalariedCost)}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center">
                        <ClockIcon className="h-8 w-8 text-blue-500 mr-4" />
                        <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Coste Variable (Horas)</p>
                        <p className="text-2xl font-bold text-orange-500">{formatCurrency(totalHourlyCost)}</p>
                        </div>
                    </div>
                </Card>
            </div>
            
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Gestión de Personal</h3>
                    <nav className="flex space-x-2">
                        <button className={tabButtonClasses('salaried')} onClick={() => setActiveTab('salaried')}>Fijos</button>
                        <button className={tabButtonClasses('hourly')} onClick={() => setActiveTab('hourly')}>Por Horas</button>
                    </nav>
                </div>

                {activeTab === 'salaried' ? (
                    <div className="space-y-4">
                        <SalariedEmployeeForm onAddEmployee={onAddEmployee as any} />
                        <Card>
                            <h3 className="text-lg font-semibold mb-4">Lista de Personal Fijo</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                    <tr className="border-b dark:border-gray-700">
                                        <th className="p-2">Nombre</th>
                                        <th className="p-2 text-right">Salario Base</th>
                                        <th className="p-2 text-right">Otros Costes</th>
                                        <th className="p-2 text-right font-bold">Coste Total</th>
                                        <th className="p-2 text-center">Acción</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {salariedEmployees.length > 0 ? (
                                        salariedEmployees.map((e) => (
                                        <tr key={e.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="p-2 font-medium">{e.name}</td>
                                            <td className="p-2 text-right">{formatCurrency(e.baseSalary)}</td>
                                            <td className="p-2 text-right">{formatCurrency(e.otherCosts)}</td>
                                            <td className="p-2 text-right font-bold text-orange-500">{formatCurrency(e.baseSalary + e.otherCosts)}</td>
                                            <td className="p-2 text-center">
                                            <button onClick={() => onDeleteEmployee(e.id)} className="bg-red-500 hover:bg-red-600 p-2 rounded-full text-white transition-colors duration-200">
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                            </td>
                                        </tr>
                                        ))
                                    ) : (
                                        <tr>
                                        <td colSpan={5} className="p-4 text-center text-gray-500 dark:text-gray-400">
                                            No hay personal fijo registrado.
                                        </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <HourlyEmployeeForm onAddEmployee={onAddEmployee as any} />
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {hourlyEmployees.length > 0 ? (
                            hourlyEmployees.map(emp => (
                                <HourlyEmployeeCard 
                                    key={emp.id}
                                    employee={emp}
                                    sessions={sessions}
                                    onDeleteEmployee={onDeleteEmployee}
                                    formatCurrency={formatCurrency}
                                />
                            ))
                           ) : (
                            <div className="md:col-span-2 p-4 text-center text-gray-500 dark:text-gray-400">
                                No hay personal por horas registrado.
                            </div>
                           )}
                         </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default PersonnelCost;