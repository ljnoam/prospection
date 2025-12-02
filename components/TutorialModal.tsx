import React, { useState, useEffect } from 'react';
import { X, Copy, ExternalLink, Check, AlertTriangle, MapPin, Loader2, CircleHelp } from 'lucide-react';
import { getUniqueCities } from '../services/prospectService';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OVERPASS_SCRIPT = `/*
  Recherche de prospects.
*/

[out:csv(::id, ::lat, ::lon, "name", "phone", "contact:phone", "mobile", "email", "contact:email", "addr:postcode", "addr:city", "shop", "craft", "amenity"; true; ";")]
[timeout:60];

// --- CONFIGURATION DE LA VILLE ---
// ASTUCE : Si ça ne marche pas, ajoute le département (ex: Bagneux, Hauts-de-Seine)
{{geocodeArea:Bagneux, Hauts-de-Seine}}->.searchArea;

(
  // GROUPE 1 : LES COMMERCES
  node["shop"][!"website"]["phone"](area.searchArea);
  node["shop"][!"website"]["contact:phone"](area.searchArea);
  node["shop"][!"website"]["mobile"](area.searchArea);
  node["shop"][!"website"]["email"](area.searchArea);
  node["shop"][!"website"]["contact:email"](area.searchArea);

  // GROUPE 2 : LES ARTISANS
  node["craft"][!"website"]["phone"](area.searchArea);
  node["craft"][!"website"]["contact:phone"](area.searchArea);
  node["craft"][!"website"]["mobile"](area.searchArea);
  node["craft"][!"website"]["email"](area.searchArea);
  node["craft"][!"website"]["contact:email"](area.searchArea);

  // GROUPE 3 : RESTAURATION
  node["amenity"~"restaurant|bar|cafe|fast_food"][!"website"]["phone"](area.searchArea);
  node["amenity"~"restaurant|bar|cafe|fast_food"][!"website"]["contact:phone"](area.searchArea);
  node["amenity"~"restaurant|bar|cafe|fast_food"][!"website"]["mobile"](area.searchArea);
  node["amenity"~"restaurant|bar|cafe|fast_food"][!"website"]["email"](area.searchArea);
  node["amenity"~"restaurant|bar|cafe|fast_food"][!"website"]["contact:email"](area.searchArea);
);

out;`;

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [existingCities, setExistingCities] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchCities = async () => {
        setIsLoadingCities(true);
        const cities = await getUniqueCities();
        setExistingCities(cities);
        setIsLoadingCities(false);
      };
      fetchCities();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(OVERPASS_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CircleHelp className="w-5 h-5 text-blue-600" />
            Guide de récupération des données
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* Step 1 */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              Ouvrir Overpass Turbo
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-8">
              C'est l'outil gratuit pour extraire les données d'OpenStreetMap.
            </p>
            <a 
              href="https://overpass-turbo.eu/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-8 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Accéder au site <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
             <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              Copier le script magique
            </h3>
            <div className="ml-8 relative">
              <pre className="bg-gray-100 dark:bg-gray-950 p-4 rounded-lg text-xs font-mono text-gray-800 dark:text-gray-300 overflow-x-auto border border-gray-200 dark:border-gray-800 max-h-48 custom-scrollbar">
                <code>{OVERPASS_SCRIPT}</code>
              </pre>
              <button 
                onClick={handleCopy}
                className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white text-sm font-medium rounded-lg transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copié !' : 'Copier le script'}
              </button>
            </div>
          </div>

          {/* Step 3 (Warning) */}
          <div className="ml-8 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl flex items-start gap-3">
             <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
             <div className="text-sm text-orange-800 dark:text-orange-200">
               <p className="font-bold mb-1">Attention aux noms de villes !</p>
               <p className="opacity-90 leading-relaxed">
                 Si la liste est vide (ex: Bagneux), il faut préciser le département. <br/>
                 Remplacez <code className="bg-orange-100 dark:bg-orange-900 px-1 rounded text-orange-900 dark:text-orange-100 font-mono">geocodeArea:NomVille</code> par <code className="bg-orange-100 dark:bg-orange-900 px-1 rounded text-orange-900 dark:text-orange-100 font-mono">geocodeArea:NomVille, Département</code> <br/>
                 (ex: <strong>Bagneux, Hauts-de-Seine</strong>).
               </p>
             </div>
          </div>

          {/* Villes déjà faites */}
          <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              Villes déjà dans la base
            </h3>
            
            {isLoadingCities ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 ml-8">
                <Loader2 className="w-4 h-4 animate-spin" /> Chargement des villes...
              </div>
            ) : existingCities.length > 0 ? (
              <div className="flex flex-wrap gap-2 ml-8" id="existing-cities-list">
                {existingCities.map((city) => (
                  <span 
                    key={city}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-900/50"
                  >
                    {city}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic ml-8">Aucune ville importée pour le moment.</p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default TutorialModal;