import React, { useState, useMemo } from 'react';
import { StructuralCost, StructuralCostType } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';
import { PencilIcon } from './icons/PencilIcon';

interface StructuralCostProps {
  costs: StructuralCost[];
  onAddCost: (cost: Omit<StructuralCost, 'id'>) => void;
  onUpdateCost: (id: string, cost: Omit<StructuralCost, 'id'>) => void;
  onDeleteCost: (id: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
};

const StructuralCost: React.FC<StructuralCostProps> = ({ costs, onAddCost, onUpdateCost, onDeleteCost }) => {
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<StructuralCostType>(StructuralCostType.Fixed);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const resetForm = () => {
    setEditingCostId(null);
    setName('');
    setAmount('');
    setCategory('');
    setType(StructuralCostType.Fixed);
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleEditClick = (cost: StructuralCost) => {
    setEditingCostId(cost.id);
    setName(cost.name);
    setAmount(String(cost.amount));
    setCategory(cost.category);
    setType(cost.type);
    setDate(cost.date);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!name.trim() || !category.trim() || isNaN(numAmount) || numAmount <= 0) {
      alert('Por favor, completa todos los campos con valores válidos.');
      return;
    }

    const costData = { name, amount: numAmount, category, type, date };

    if (editingCostId !== null) {
      await onUpdateCost(editingCostId, costData);
    } else {
      await onAddCost(costData);
    }
    resetForm();
  };
  
  const { totalCost, fixedCosts, variableCosts } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const costsThisMonth = costs.filter(cost => {
        const costDate = new Date(cost.date);
        return costDate.getMonth() === currentMonth && costDate.getFullYear() === currentYear;
    });

    return {
        totalCost: costsThisMonth.reduce((sum, c) => sum + c.amount, 0),
        fixedCosts: costs.filter(c => c.type === StructuralCostType.Fixed),
        variableCosts: costs.filter(c => c.type === StructuralCostType.Variable)
    }
  }, [costs]);

  const CostList: React.FC<{title: string, costItems: StructuralCost[]}> = ({ title, costItems }) => (
     <div className="space-y-2">
        <h4 className="font-semibold text-md text-gray-600 dark:text-gray-300">{title}</h4>
        {costItems.length > 0 ? (
            costItems.map(cost => (
            <div key={cost.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                <div>
                    <p className="font-medium">{cost.name} <span className="text-xs text-gray-400">({cost.category})</span></p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(cost.date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric'})}</p>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="font-bold text-lg text-red-500">{formatCurrency(cost.amount)}</span>
                    <button onClick={() => handleEditClick(cost)} className="p-1 text-gray-500 hover:text-indigo-500"><PencilIcon className="h-5 w-5"/></button>
                    <button onClick={() => onDeleteCost(cost.id)} className="p-1 text-gray-500 hover:text-red-500"><TrashIcon className="h-5 w-5"/></button>
                </div>
            </div>
            ))
        ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic px-3">No hay gastos de este tipo.</p>
        )}
     </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Gastos de Estructura</h2>
        <Card>
            <div className="flex items-center">
                <BuildingOfficeIcon className="h-8 w-8 text-indigo-500 mr-4" />
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Coste Estructural Total (Mes Actual)</p>
                    <p className="text-2xl font-bold text-red-500">{formatCurrency(totalCost)}</p>
                </div>
            </div>
        </Card>
      <Card>
        <h3 className="text-lg font-semibold mb-4">{editingCostId !== null ? 'Editar Gasto' : 'Añadir Nuevo Gasto de Estructura'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input value={name} onChange={e => setName(e.target.value)} label="Nombre del Gasto" placeholder="Ej: Alquiler Local" />
            <Input value={category} onChange={e => setCategory(e.target.value)} label="Categoría" placeholder="Ej: Inmobiliario" />
            <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} label="Importe (€)" placeholder="0.00" step="0.01" />
            <Select label="Tipo de Gasto" value={type} onChange={e => setType(e.target.value as StructuralCostType)}>
                <option value={StructuralCostType.Fixed}>Fijo</option>
                <option value={StructuralCostType.Variable}>Variable</option>
            </Select>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} label="Fecha (Mes del Gasto)" />
          </div>
          
          <div className="flex items-center justify-end space-x-2 pt-2">
            {editingCostId !== null && <Button type="button" onClick={resetForm} className="bg-gray-500 hover:bg-gray-600">Cancelar Edición</Button>}
            <Button type="submit" className="w-full sm:w-auto">
              <PlusIcon className="h-5 w-5 mr-2" />
              {editingCostId !== null ? 'Actualizar Gasto' : 'Añadir Gasto'}
            </Button>
          </div>
        </form>
      </Card>
      
      <Card>
        <h3 className="text-lg font-semibold mb-4">Historial de Gastos</h3>
        <div className="space-y-6">
            <CostList title="Gastos Fijos" costItems={fixedCosts} />
            <CostList title="Gastos Variables" costItems={variableCosts} />
        </div>
      </Card>
    </div>
  );
};

export default StructuralCost;