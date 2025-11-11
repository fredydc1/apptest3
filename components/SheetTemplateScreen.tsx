import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { ShieldExclamationIcon } from './icons/ShieldExclamationIcon';
import * as googleSheetsService from '../services/googleSheetsService';

interface SheetTemplateScreenProps {
  onSheetCreated: (spreadsheetId: string) => void;
}

const SheetTemplateScreen: React.FC<SheetTemplateScreenProps> = ({ onSheetCreated }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateSheet = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const spreadsheetId = await googleSheetsService.createSpreadsheet();
            if (spreadsheetId) {
                onSheetCreated(spreadsheetId);
            } else {
                setError('No se pudo crear la hoja de cálculo. Por favor, inténtalo de nuevo.');
            }
        } catch (err) {
            console.error(err);
            setError('Ha ocurrido un error inesperado al crear la hoja de cálculo.');
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <div className="text-center">
            <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-indigo-500" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">¡Bienvenido!</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Para empezar a registrar tus finanzas, necesitas una hoja de cálculo en tu Google Drive.
                Podemos crear una para ti con todas las columnas y pestañas necesarias.
            </p>
        </div>
        
        <div className="mt-8">
            <Button onClick={handleCreateSheet} disabled={isLoading} className="w-full">
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creando hoja de cálculo...
                    </>
                ) : (
                   'Crear Hoja de Cálculo de Finanzas'
                )}
            </Button>
            {error && <p className="mt-2 text-center text-sm text-red-500">{error}</p>}
        </div>
        
        <div className="mt-6 flex items-start p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <ShieldExclamationIcon className="h-6 w-6 text-yellow-500 mr-3 shrink-0" />
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Esta acción creará un nuevo archivo "Finance Tracker" en la carpeta principal de tu Google Drive. La aplicación solo tendrá acceso a los archivos que cree.
            </p>
        </div>
      </Card>
    </div>
  );
};

export default SheetTemplateScreen;