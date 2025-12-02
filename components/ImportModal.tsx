import React, { useState } from 'react';
import { parseProspectCSV } from '../utils/csvParser';
import { batchAddProspects } from '../services/prospectService';
import { filterJunkLeads } from '../services/geminiService';
import { X, Upload, Loader2, AlertCircle, Bot, CheckCircle2 } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
  const [city, setCity] = useState('');
  const [csvData, setCsvData] = useState('');
  
  // States du processus
  const [status, setStatus] = useState<'IDLE' | 'PARSING' | 'AI_CLEANING' | 'SAVING' | 'SUCCESS'>('IDLE');
  const [error, setError] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState<{ imported: number; excluded: number } | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    setError(null);
    setStats(null);
    setStatus('IDLE');

    if (!city.trim()) {
      setError("Le nom de la ville est obligatoire.");
      return;
    }
    if (!csvData.trim()) {
      setError("Veuillez coller les données CSV.");
      return;
    }

    try {
      // Étape 1 : Parsing local
      setStatus('PARSING');
      const parsedData = parseProspectCSV(csvData, city);
      
      if (parsedData.length === 0) {
        setError("Aucun prospect valide trouvé. Vérifiez le format du CSV.");
        setStatus('IDLE');
        return;
      }

      // Étape 2 : Nettoyage IA
      setStatus('AI_CLEANING');
      const allNames = parsedData.map(p => p.name);
      
      // Appel à Gemini
      let excludedNames: string[] = [];
      try {
        excludedNames = await filterJunkLeads(allNames);
      } catch (aiError) {
        console.error("Erreur IA, on continue sans filtre", aiError);
        // On ne bloque pas l'import si l'IA échoue, mais on prévient (optionnel)
      }

      // Filtrage des données
      const cleanData = parsedData.filter(p => !excludedNames.includes(p.name));
      const excludedCount = parsedData.length - cleanData.length;

      if (cleanData.length === 0) {
        setError("L'IA a filtré tous les prospects (considérés comme indésirables).");
        setStatus('IDLE');
        return;
      }

      // Étape 3 : Sauvegarde Firebase
      setStatus('SAVING');
      await batchAddProspects(cleanData);
      
      // Succès
      setStats({ imported: cleanData.length, excluded: excludedCount });
      setStatus('SUCCESS');
      
      // Reset form
      setCsvData('');
      setCity('');
      
      // Fermeture auto différée
      setTimeout(() => {
        onClose();
        // Reset states après fermeture
        setTimeout(() => {
            setStatus('IDLE');
            setStats(null);
        }, 300);
      }, 3000);

    } catch (e: any) {
      console.error(e);
      setError("Une erreur technique est survenue.");
      setStatus('IDLE');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Importer CSV
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-800/50">
            <p className="font-semibold mb-1">Format Overpass Turbo</p>
            <p className="opacity-80">Copiez/collez les données brutes. L'IA filtrera automatiquement les chaînes et franchises.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Ville cible <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Paris"
                disabled={status !== 'IDLE'}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-gray-400 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Coller le CSV brut <span className="text-red-500">*</span>
              </label>
              <textarea 
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder="@id;name;phone..."
                rows={6}
                disabled={status !== 'IDLE'}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-xs placeholder-gray-400 disabled:opacity-50"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm border border-red-100 dark:border-red-900/50">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {/* Feedback Zone */}
          {status === 'AI_CLEANING' && (
            <div className="flex flex-col items-center justify-center p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50 animate-pulse">
              <Bot className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-2" />
              <p className="font-semibold text-indigo-800 dark:text-indigo-200">L'IA nettoie la liste...</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Identification des chaînes, banques et franchises</p>
            </div>
          )}

          {status === 'SAVING' && (
            <div className="flex items-center justify-center p-4 text-blue-600 dark:text-blue-400">
               <Loader2 className="w-5 h-5 animate-spin mr-2" />
               Sauvegarde en cours...
            </div>
          )}

          {status === 'SUCCESS' && stats && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-900/50 space-y-2">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-bold">
                <CheckCircle2 className="w-5 h-5" />
                Import terminé !
              </div>
              <div className="text-sm text-green-800 dark:text-green-200 pl-7">
                <p>✅ <strong>{stats.imported}</strong> prospects ajoutés.</p>
                <p className="text-xs mt-1 opacity-80">🗑️ {stats.excluded} éléments écartés par l'IA (Franchises, chaînes, etc.)</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={status !== 'IDLE' && status !== 'SUCCESS'}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Fermer
          </button>
          
          {status !== 'SUCCESS' && (
            <button 
              onClick={handleImport}
              disabled={status !== 'IDLE'}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none min-w-[120px] justify-center"
            >
              {status === 'IDLE' ? (
                <>Importer avec IA</>
              ) : (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ImportModal;