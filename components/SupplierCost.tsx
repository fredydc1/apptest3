import React, { useState, useRef } from 'react';
import { SupplierExpense } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { BuildingStorefrontIcon } from './icons/BuildingStorefrontIcon';
import { CameraIcon } from './icons/CameraIcon';
import { UploadIcon } from './icons/UploadIcon';

interface SupplierCostProps {
  expenses: SupplierExpense[];
  onAddExpense: (expense: Omit<SupplierExpense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
};

const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error('Invalid data URL');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const CameraModal: React.FC<{ onClose: () => void; onCapture: (file: File) => void }> = ({ onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
  
    React.useEffect(() => {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error accessing camera: ", err);
          alert("No se pudo acceder a la cámara. Asegúrate de haber concedido los permisos.");
          onClose();
        }
      };
      startCamera();
  
      return () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };
    }, [onClose]);
  
    const handleTakePhoto = () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const file = dataURLtoFile(dataUrl, `capture-${Date.now()}.jpg`);
        onCapture(file);
        onClose();
      }
    };
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg max-w-lg w-full">
          <h3 className="text-lg font-bold mb-4">Capturar Foto</h3>
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-md mb-4"></video>
          <canvas ref={canvasRef} className="hidden"></canvas>
          <div className="flex justify-end space-x-2">
            <Button onClick={onClose} className="bg-gray-500 hover:bg-gray-600">Cancelar</Button>
            <Button onClick={handleTakePhoto}>Tomar Foto</Button>
          </div>
        </div>
      </div>
    );
  };

const SupplierCost: React.FC<SupplierCostProps> = ({ expenses, onAddExpense, onDeleteExpense }) => {
  const [supplierName, setSupplierName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Procesando...');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File | null) => {
    if (file) {
        setImageFile(file);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(URL.createObjectURL(file));
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileSelect(file);
  };
  
  const resetImageState = () => {
    setImageFile(null);
    if(imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!supplierName.trim() || !description.trim() || isNaN(numAmount) || numAmount <= 0) {
      alert('Por favor, completa todos los campos con valores válidos.');
      return;
    }
    if (!imageFile) {
      alert('Por favor, sube o captura una imagen del albarán.');
      return;
    }
    
    setIsProcessing(true);
    try {
        setProcessingMessage('Procesando imagen...');
        const imageUrl = await fileToDataUrl(imageFile);
        
        setProcessingMessage('Guardando gasto...');
        await onAddExpense({ supplierName, description, amount: numAmount, date, imageUrl });
        
        // Reset form
        setSupplierName('');
        setDescription('');
        setAmount('');
        resetImageState();
    } catch (error) {
        console.error("Failed to add supplier expense:", error);
        alert(`Error al añadir el gasto: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        setIsProcessing(false);
    }
  };
  
  const totalSupplierCost = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Gestión de Proveedores</h2>
        <Card>
            <div className="flex items-center">
                <BuildingStorefrontIcon className="h-8 w-8 text-indigo-500 mr-4" />
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gasto Total en Proveedores</p>
                    <p className="text-2xl font-bold text-red-500">{formatCurrency(totalSupplierCost)}</p>
                </div>
            </div>
        </Card>
      <Card>
        <h3 className="text-lg font-semibold mb-4">Añadir Gasto de Proveedor</h3>
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input value={supplierName} onChange={e => setSupplierName(e.target.value)} label="Nombre del Proveedor" placeholder="Ej: Distribuciones ABC" />
            <Input value={description} onChange={e => setDescription(e.target.value)} label="Descripción del Gasto" placeholder="Ej: Compra de bebidas" />
            <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} label="Importe (€)" placeholder="0.00" step="0.01" />
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} label="Fecha" />
          </div>

          <div className="border-t dark:border-gray-700 pt-4">
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Justificante (Albarán/Factura)
             </label>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Button type="button" onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                    <UploadIcon className="h-5 w-5 mr-2"/> Subir Albarán
                </Button>
                <Button type="button" onClick={() => setIsCameraOpen(true)} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700">
                    <CameraIcon className="h-5 w-5 mr-2"/> Capturar con Cámara
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                 {imagePreview && (
                    <div className="relative group">
                        <img src={imagePreview} alt="Previsualización" className="h-16 w-16 object-cover rounded-md shadow-md"/>
                        <button 
                            type="button" 
                            onClick={resetImageState} 
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            X
                        </button>
                    </div>
                 )}
            </div>
          </div>
          
          <Button type="submit" className="w-full flex items-center justify-center !mt-6" disabled={isProcessing}>
            {isProcessing ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {processingMessage}
                </>
            ) : (
                <>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Añadir Gasto
                </>
            )}
          </Button>
        </form>
      </Card>
      
      {isCameraOpen && <CameraModal onClose={() => setIsCameraOpen(false)} onCapture={handleFileSelect} />}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Historial de Gastos</h3>
        {expenses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {expenses.map(expense => (
              <Card key={expense.id} className="flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h4 className="font-bold">{expense.supplierName}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(expense.date).toLocaleDateString('es-ES')}</p>
                    </div>
                     <button onClick={() => onDeleteExpense(expense.id)} className="bg-red-500 hover:bg-red-600 p-2 rounded-full text-white transition-colors duration-200">
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </div>
                <p className="text-sm mb-2">{expense.description}</p>
                <p className="text-xl font-bold text-red-500 mb-4">{formatCurrency(expense.amount)}</p>
                {expense.imageUrl && (
                  <a href={expense.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-auto">
                    <img src={expense.imageUrl} alt={`Albarán de ${expense.supplierName}`} className="w-full h-40 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity" />
                  </a>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-8">
            <BuildingStorefrontIcon className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No hay gastos de proveedores</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Añade un nuevo gasto para empezar a llevar el control.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SupplierCost;