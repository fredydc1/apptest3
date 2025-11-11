import React, { useState, useEffect } from 'react';
import CashFlow from './components/CashFlow';
import PersonnelCost from './components/PersonnelCost';
import Dashboard from './components/Dashboard';
import SupplierCost from './components/SupplierCost';
import StructuralCost from './components/StructuralCost';
import LoginScreen from './components/LoginScreen';

import * as apiService from './services/apiService';
import { Employee, SupplierExpense, StructuralCost as StructuralCostData, CashFlowSession, AppData } from './types';

import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { LogoutIcon } from './components/icons/LogoutIcon';
import Markdown from 'react-markdown';

type View = 'dashboard' | 'cash' | 'personnel' | 'suppliers' | 'structure';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!sessionStorage.getItem('is-authenticated'));
  const [appData, setAppData] = useState<AppData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(isLoggedIn);
  const [activeView, setActiveView] = useState<View>('dashboard');
  
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    const loadData = async () => {
        setIsLoadingData(true);
        try {
            const data = await apiService.getAllData();
            setAppData(data);
        } catch (e) {
            console.error("Could not load data from API", e);
            alert("Error al cargar los datos. Comprueba la conexión con el servidor.");
        } finally {
            setIsLoadingData(false);
        }
    };
    loadData();
  }, [isLoggedIn]);

  const handleLogin = async (password: string): Promise<boolean> => {
      try {
          const success = await apiService.login(password);
          if (success) {
              sessionStorage.setItem('is-authenticated', 'true');
              setIsLoggedIn(true);
              return true;
          }
          return false;
      } catch (error) {
          console.error("Login failed:", error);
          return false;
      }
  };

  const handleLogout = () => {
      sessionStorage.removeItem('is-authenticated');
      setIsLoggedIn(false);
      setAppData(null);
  };

  const updateAndSaveData = async (updatedData: AppData) => {
    const previousData = appData;
    setAppData(updatedData); // Optimistic update
    try {
        await apiService.saveData(updatedData);
    } catch (error) {
        console.error("Failed to save data:", error);
        alert("No se pudieron guardar los cambios. Se restaurarán los datos anteriores.");
        setAppData(previousData); // Revert on failure
    }
  };

  // --- DATA HANDLERS ---
  const handleAddEmployee = async (employee: Omit<Employee, 'id'>) => {
    if (!appData) return;
    const newEmployee: Employee = { ...employee, id: crypto.randomUUID() } as Employee;
    const newAppData = { ...appData, employees: [...appData.employees, newEmployee] };
    await updateAndSaveData(newAppData);
  };
  
  const handleDeleteEmployee = async (id: string) => {
    if (!appData) return;
    const newAppData = { ...appData, employees: appData.employees.filter(e => e.id !== id) };
    await updateAndSaveData(newAppData);
  };
  
  const handleAddSession = async (sessionData: Pick<CashFlowSession, 'date' | 'description'>) => {
    if (!appData) return;
    const newSession: CashFlowSession = { ...sessionData, id: crypto.randomUUID(), income: null, expenses: [], workedHours: [] };
    const newAppData = { ...appData, cashFlowSessions: [...appData.cashFlowSessions, newSession] };
    await updateAndSaveData(newAppData);
  };

  const handleDeleteSession = async (id: string) => {
    if (!appData) return;
    const newAppData = { ...appData, cashFlowSessions: appData.cashFlowSessions.filter(s => s.id !== id) };
    await updateAndSaveData(newAppData);
  };
  
  const handleUpdateSession = async (id: string, session: Omit<CashFlowSession, 'id'>) => {
     if (!appData) return;
     const updatedSessions = appData.cashFlowSessions.map(s => s.id === id ? { id, ...session } : s);
     const newAppData = { ...appData, cashFlowSessions: updatedSessions };
     await updateAndSaveData(newAppData);
  }

  const handleAddSupplierExpense = async (expense: Omit<SupplierExpense, 'id'>) => {
    if (!appData) return;
    const newExpense: SupplierExpense = { ...expense, id: crypto.randomUUID() };
    const newAppData = { ...appData, supplierExpenses: [...appData.supplierExpenses, newExpense] };
    await updateAndSaveData(newAppData);
  };

  const handleDeleteSupplierExpense = async (id: string) => {
    if (!appData) return;
    const newAppData = { ...appData, supplierExpenses: appData.supplierExpenses.filter(e => e.id !== id) };
    await updateAndSaveData(newAppData);
  };

  const handleAddStructuralCost = async (cost: Omit<StructuralCostData, 'id'>) => {
    if (!appData) return;
    const newCost: StructuralCostData = { ...cost, id: crypto.randomUUID() };
    const newAppData = { ...appData, structuralCosts: [...appData.structuralCosts, newCost] };
    await updateAndSaveData(newAppData);
  };

  const handleDeleteStructuralCost = async (id: string) => {
    if (!appData) return;
    const newAppData = { ...appData, structuralCosts: appData.structuralCosts.filter(c => c.id !== id) };
    await updateAndSaveData(newAppData);
  };

  const handleUpdateStructuralCost = async (id: string, costData: Omit<StructuralCostData, 'id'>) => {
    if (!appData) return;
    const updatedCosts = appData.structuralCosts.map(c => c.id === id ? { id, ...costData } : c);
    const newAppData = { ...appData, structuralCosts: updatedCosts };
    await updateAndSaveData(newAppData);
  };
  // --- END OF DATA HANDLERS ---

  const handleAnalyze = async () => {
    if (!appData) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await apiService.analyzeFinancialData(appData);
      setAnalysis(result);
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysis("Se ha producido un error durante el análisis. Por favor, inténtalo de nuevo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const navButtonClasses = (view: View) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
      activeView === view
        ? 'bg-indigo-600 text-white shadow-md'
        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
    }`;
  
  if (!isLoggedIn) {
      return <LoginScreen onLogin={handleLogin} />;
  }

  if (isLoadingData || !appData) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
          <Card className="text-center">Cargando datos desde la base de datos...</Card>
      </div>
    );
  }

  const renderView = () => {
      switch(activeView) {
          case 'dashboard': return <Dashboard sessions={appData.cashFlowSessions} employees={appData.employees} expenses={appData.supplierExpenses} structuralCosts={appData.structuralCosts} />;
          case 'cash': return <CashFlow sessions={appData.cashFlowSessions} employees={appData.employees} onAddSession={handleAddSession} onDeleteSession={handleDeleteSession} onUpdateSession={handleUpdateSession} />;
          case 'personnel': return <PersonnelCost employees={appData.employees} sessions={appData.cashFlowSessions} onAddEmployee={handleAddEmployee} onDeleteEmployee={handleDeleteEmployee} />;
          case 'suppliers': return <SupplierCost expenses={appData.supplierExpenses} onAddExpense={handleAddSupplierExpense} onDeleteExpense={handleDeleteSupplierExpense} />;
          case 'structure': return <StructuralCost costs={appData.structuralCosts} onAddCost={handleAddStructuralCost} onUpdateCost={handleUpdateStructuralCost} onDeleteCost={handleDeleteStructuralCost} />;
          default: return null;
      }
    }

  return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
        <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              Panel de Finanzas
            </h1>
            <nav className="flex flex-wrap justify-center items-center gap-4">
              <div className="flex flex-wrap justify-center space-x-2 bg-gray-200 dark:bg-gray-900 p-1 rounded-lg">
                  <button onClick={() => setActiveView('dashboard')} className={navButtonClasses('dashboard')}>Dashboard</button>
                  <button onClick={() => setActiveView('cash')} className={navButtonClasses('cash')}>Caja</button>
                  <button onClick={() => setActiveView('personnel')} className={navButtonClasses('personnel')}>Personal</button>
                  <button onClick={() => setActiveView('suppliers')} className={navButtonClasses('suppliers')}>Proveedores</button>
                  <button onClick={() => setActiveView('structure')} className={navButtonClasses('structure')}>Estructura</button>
              </div>
              <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-xs">
                  <LogoutIcon className="h-4 w-4 mr-2" />
                  Cerrar Sesión
              </Button>
            </nav>
          </div>
        </header>

        <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
           <Card>
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                   <div>
                       <h2 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">Análisis Financiero con IA</h2>
                       <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4 sm:mb-0">
                           Obtén una visión global y consejos prácticos sobre tus finanzas combinadas.
                       </p>
                   </div>
                   <Button onClick={handleAnalyze} disabled={isAnalyzing || (appData.cashFlowSessions.length === 0 && appData.employees.length === 0 && appData.supplierExpenses.length === 0 && appData.structuralCosts.length === 0)}>
                       <SparklesIcon className="h-5 w-5 mr-2" />
                       {isAnalyzing ? 'Analizando...' : 'Analizar con IA'}
                   </Button>
               </div>
               {isAnalyzing && <div className="mt-4 text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">Analizando con Gemini en el servidor, por favor espera...</div>}
               {analysis && (
                   <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                       <Markdown className="prose prose-sm dark:prose-invert max-w-none">{analysis}</Markdown>
                   </div>
               )}
           </Card>
        
          {renderView()}
        </main>

        <footer className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Business Finance Tracker. All rights reserved.</p>
        </footer>
      </div>
    );
};

export default App;