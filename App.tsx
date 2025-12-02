
import React, { useEffect, useState } from 'react';
import { Plus, Database, Search, AlertTriangle, Layers, Moon, Sun, Filter, User, Mail, Phone, CircleHelp, ListFilter } from 'lucide-react';
import ImportModal from './components/ImportModal';
import TutorialModal from './components/TutorialModal';
import ProspectList from './components/ProspectTable';
import { subscribeToProspects } from './services/prospectService';
import { Prospect, ProspectStatus, STATUS_LABELS } from './types';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI States
  const [darkMode, setDarkMode] = useState(false);
  const [groupByCity, setGroupByCity] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<ProspectStatus | 'ALL'>('ALL');
  const [contactFilter, setContactFilter] = useState<'ALL' | 'HAS_EMAIL' | 'HAS_PHONE'>('ALL');

  useEffect(() => {
    // Check system preference for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }

    const unsubscribe = subscribeToProspects(
      (data) => {
        setProspects(data);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Subscription error:", err);
        setIsLoading(false);
        
        // Gestion fine des erreurs Firestore
        if (err.code === 'permission-denied') {
          setError("Accès refusé. Vérifiez les règles de sécurité Firestore.");
        } else if (err.code === 'unavailable') {
          setError("Mode hors ligne ou service indisponible. Vérifiez votre connexion.");
        } else if (err.code === 'resource-exhausted') {
          setError("Quota Firestore dépassé. Veuillez réessayer plus tard.");
        } else {
          setError(`Erreur de connexion (${err.code || 'inconnue'}).`);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // Update HTML class for dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Filtering logic
  const filteredProspects = prospects.filter(p => {
    // 1. Text Search
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    // 2. Contact Filter
    if (contactFilter === 'HAS_EMAIL' && !p.email) return false;
    if (contactFilter === 'HAS_PHONE' && !p.phone) return false;

    // 3. Status Filter
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;

    return true;
  });

  // Stats
  const total = filteredProspects.length;
  const toContact = filteredProspects.filter(p => p.status === ProspectStatus.TO_CONTACT).length;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-100 dark:bg-black transition-colors duration-300">
      
      {/* Navbar (Apple Style Blur) */}
      <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <Database className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight hidden sm:block">ProspectManager</h1>
          </div>

          <div className="flex items-center gap-3">
             {/* Dark Mode Toggle */}
             <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors focus:outline-none"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Tutorial Button */}
            <button
              onClick={() => setIsTutorialOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-full transition-all active:scale-95 border border-gray-200 dark:border-gray-700"
            >
              <CircleHelp className="w-5 h-5" />
              <span className="hidden sm:inline">Comment faire ?</span>
            </button>

            {/* Add Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-full shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Importer</span>
            </button>
          </div>
        </div>

        {/* Filters & Search Bar Area */}
        <div className="max-w-5xl mx-auto px-4 pb-4 space-y-3">
          
          {/* Search */}
          <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                  type="text"
                  placeholder="Rechercher (nom, ville, activité, note...)"
                  className="block w-full pl-10 pr-3 py-2.5 border-none rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 sm:text-sm transition-all focus:bg-white dark:focus:bg-gray-800"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>

          {/* Controls Scrollable */}
          <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar pb-1">
            
            <div className="flex items-center gap-3">
                {/* Contact Filters */}
                <div className="flex bg-gray-200/50 dark:bg-gray-800 p-1 rounded-xl shrink-0">
                  <button 
                      onClick={() => setContactFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${contactFilter === 'ALL' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                  >
                    Tous
                  </button>
                  <button 
                      onClick={() => setContactFilter('HAS_EMAIL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${contactFilter === 'HAS_EMAIL' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                  >
                    <Mail className="w-3.5 h-3.5" /> Emails
                  </button>
                  <button 
                      onClick={() => setContactFilter('HAS_PHONE')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${contactFilter === 'HAS_PHONE' ? 'bg-white dark:bg-gray-700 shadow-sm text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                  >
                    <Phone className="w-3.5 h-3.5" /> Téléphones
                  </button>
                </div>

                {/* Status Filter (Nouveau) */}
                <div className="relative shrink-0">
                    <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as ProspectStatus | 'ALL')}
                        className="pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-semibold shadow-sm focus:ring-2 focus:ring-blue-500 appearance-none text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <option value="ALL">Tous les statuts</option>
                        {Object.values(ProspectStatus).map(s => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Group By City Toggle */}
              <button 
                onClick={() => setGroupByCity(!groupByCity)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all
                  ${groupByCity 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}
                `}
              >
                <Layers className="w-4 h-4" />
                Grouper par ville
              </button>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 px-1 pt-1">
            <span><strong>{total}</strong> prospects affichés</span>
            {toContact > 0 && statusFilter === 'ALL' && (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                {toContact} à contacter
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm text-red-700 dark:text-red-300">
              <p className="font-bold">Problème de connexion</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 animate-spin"></div>
          </div>
        ) : (
          <ProspectList prospects={filteredProspects} groupByCity={groupByCity} />
        )}
      </main>

      <ImportModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

    </div>
  );
}

export default App;
