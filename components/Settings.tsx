import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface SettingsProps {
  spreadsheetId: string;
  onDisconnect: () => void;
}

const Settings: React.FC<SettingsProps> = ({ spreadsheetId, onDisconnect }) => {
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Ajustes</h2>
      
      <Card>
        <h3 className="text-lg font-semibold mb-4">Hoja de Cálculo Conectada</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Todos los datos se están guardando en la siguiente hoja de cálculo de tu Google Drive:
        </p>
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-sm break-all mb-4">
            <a href={spreadsheetUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                {spreadsheetUrl}
            </a>
        </div>
        <Button onClick={() => window.open(spreadsheetUrl, '_blank')}>
            Abrir en Google Sheets
        </Button>
      </Card>

      <Card className="border border-red-500/50 dark:border-red-500/30">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Desconectar Hoja de Cálculo</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Si desconectas la hoja de cálculo, se borrará la conexión de este navegador y volverás a la pantalla de bienvenida para crear o conectar otra hoja. 
            <strong className="font-semibold"> Tus datos en Google Drive no se eliminarán.</strong>
        </p>
        <Button onClick={onDisconnect} className="bg-red-600 hover:bg-red-700">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Desconectar y Empezar de Nuevo
        </Button>
      </Card>
    </div>
  );
};

export default Settings;
