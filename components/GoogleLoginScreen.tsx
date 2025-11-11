import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { GoogleIcon } from './icons/GoogleIcon';
import * as googleSheetsService from '../services/googleSheetsService';

const GoogleLoginScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            Panel de Finanzas
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
            Conecta tu cuenta de Google para gestionar tus finanzas directamente en Google Sheets.
        </p>
        <div className="mt-8">
            <Button onClick={googleSheetsService.signIn} className="w-full">
                <GoogleIcon className="h-5 w-5 mr-3" />
                Iniciar sesión con Google
            </Button>
        </div>
        <p className="mt-6 text-xs text-gray-500">
            Al continuar, concedes permiso a esta aplicación para acceder y modificar tus archivos de Google Sheets creados por ella.
        </p>
      </Card>
    </div>
  );
};

export default GoogleLoginScreen;