import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { LockClosedIcon } from './icons/LockClosedIcon';

interface LoginScreenProps {
  onLogin: (password: string) => Promise<boolean>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
        const success = await onLogin(password);
        if (!success) {
            setError('Contraseña incorrecta. Inténtalo de nuevo.');
            setPassword('');
        }
    } catch (err) {
        setError('Ha ocurrido un error al iniciar sesión.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50">
            <LockClosedIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Acceso Restringido
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Por favor, introduce la contraseña para acceder al panel de finanzas.
        </p>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <Input
            label="Contraseña"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            disabled={isLoading}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Iniciando sesión...
                    </>
                ) : (
                    'Entrar'
                )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default LoginScreen;
