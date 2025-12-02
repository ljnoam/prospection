
import React, { useRef, useState } from 'react';
import { Prospect, ProspectStatus, STATUS_COLORS, STATUS_LABELS } from '../types';
import { updateProspect, deleteProspect, batchDeleteProspects } from '../services/prospectService';
import { Phone, Mail, MapPin, Briefcase, Trash2, Map, Loader2, Check, X } from 'lucide-react';

interface ProspectListProps {
  prospects: Prospect[];
  groupByCity: boolean;
}

// --- Helpers & Sub-components ---

const openGoogleMaps = (lat?: number, lon?: number) => {
  if (lat && lon) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, '_blank');
  }
};

interface StatusSelectProps {
  id: string;
  status: ProspectStatus;
  isMobile?: boolean;
  onStatusChange: (id: string, s: ProspectStatus) => void;
}

const StatusSelect: React.FC<StatusSelectProps> = ({ 
  id, 
  status, 
  isMobile = false, 
  onStatusChange 
}) => (
  <div className="relative">
    <select
      value={status}
      onChange={(e) => onStatusChange(id, e.target.value as ProspectStatus)}
      className={`
        appearance-none cursor-pointer focus:outline-none transition-all font-semibold rounded-lg
        ${isMobile 
          ? `w-full px-3 py-2 text-sm border ${STATUS_COLORS[status]}`
          : `w-full py-1.5 px-3 text-xs border-0 ${STATUS_COLORS[status]}`
        }
      `}
    >
      {Object.values(ProspectStatus).map((s) => (
        <option key={s} value={s} className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  </div>
);

interface ActionButtonsProps {
  p: Prospect;
  deletingId: string | null;
  confirmDeleteId: string | null;
  onDeleteInit: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  p, 
  deletingId, 
  confirmDeleteId,
  onDeleteInit,
  onDeleteConfirm,
  onDeleteCancel 
}) => {
  const isConfirming = confirmDeleteId === p.id;
  const isDeleting = deletingId === p.id;

  // État de suppression en cours (Loader)
  if (isDeleting) {
    return (
      <div className="flex items-center justify-end">
        <Loader2 className="w-4 h-4 animate-spin text-red-500" />
      </div>
    );
  }

  // État de confirmation (UI Non bloquante)
  if (isConfirming) {
    return (
      <div className="flex items-center gap-1 justify-end animate-in fade-in zoom-in duration-200 origin-right">
        <button 
          onClick={() => p.id && onDeleteConfirm(p.id)}
          className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 rounded-md transition-colors"
          title="Confirmer la suppression"
        >
          <Check className="w-4 h-4" />
        </button>
        <button 
          onClick={onDeleteCancel}
          className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 rounded-md transition-colors"
          title="Annuler"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // État par défaut
  return (
    <div className="flex items-center gap-2 justify-end">
      {/* Google Maps Button */}
      {p.lat && p.lon && (
        <button
          onClick={() => openGoogleMaps(p.lat, p.lon)}
          className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-full transition-colors"
          title="Ouvrir dans Maps"
        >
          <Map className="w-4 h-4" />
        </button>
      )}

      {/* Delete Button */}
      <button 
        onClick={() => {
            if (p.id) onDeleteInit(p.id);
            else console.error("ID manquant pour ce prospect:", p);
        }}
        disabled={deletingId !== null || confirmDeleteId !== null}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Supprimer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

const ContactInfo = ({ p }: { p: Prospect }) => (
  <div className="flex flex-col gap-1.5 text-sm">
    {p.phone ? (
      <a href={`tel:${p.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors truncate">
        <Phone className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{p.phone}</span>
      </a>
    ) : (
      <span className="flex items-center gap-2 text-gray-400 text-xs italic">
        <Phone className="w-3.5 h-3.5 shrink-0" /> N/A
      </span>
    )}
    
    {p.email ? (
      <a href={`mailto:${p.email}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate">
        <Mail className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{p.email}</span>
      </a>
    ) : (
      <span className="flex items-center gap-2 text-gray-400 text-xs italic">
        <Mail className="w-3.5 h-3.5 shrink-0" /> N/A
      </span>
    )}
  </div>
);

interface ProspectRowProps {
  p: Prospect;
  isLast: boolean;
  groupByCity: boolean;
  deletingId: string | null;
  confirmDeleteId: string | null;
  onStatusChange: (id: string, s: ProspectStatus) => void;
  onNotesChange: (id: string, n: string) => void;
  onDeleteInit: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}

const ProspectRow: React.FC<ProspectRowProps> = ({ 
  p, 
  isLast, 
  groupByCity,
  deletingId,
  confirmDeleteId,
  onStatusChange,
  onNotesChange,
  onDeleteInit,
  onDeleteConfirm,
  onDeleteCancel
}) => {
  return (
    <div className={`
      group relative transition-colors duration-200
      bg-white dark:bg-gray-900
      ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}
    `}>
      
      {/* DESKTOP VIEW (MD+) - GRID LAYOUT */}
      <div className="hidden md:grid grid-cols-12 gap-4 p-4 items-center">
        
        {/* Col 1-2: Name (2 cols) */}
        <div className="col-span-2 pr-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate" title={p.name}>
            {p.name}
          </h3>
        </div>

        {/* Col 3-4: Notes (2 cols) - DÉDIÉ */}
        <div className="col-span-2">
          <input
            defaultValue={p.notes}
            onBlur={(e) => p.id && onNotesChange(p.id, e.target.value)}
            placeholder="Ajouter une note..."
            className="w-full text-xs bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 rounded px-2 py-1.5 outline-none text-gray-700 dark:text-gray-300 transition-all placeholder-gray-400 truncate focus:overflow-visible focus:absolute focus:z-10 focus:w-64 focus:shadow-md"
          />
        </div>

        {/* Col 5-7: Contact (3 cols) */}
        <div className="col-span-3">
          <ContactInfo p={p} />
        </div>

        {/* Col 8-9: Meta (Activity & City) (2 cols) */}
        <div className="col-span-2 flex flex-col gap-1 text-xs">
          <span className="font-medium text-gray-700 dark:text-gray-300 truncate px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md w-fit max-w-full">
            {p.activity || 'Autre'}
          </span>
          {!groupByCity && (
            <span className="flex items-center text-gray-500 dark:text-gray-500 truncate">
              <MapPin className="w-3 h-3 mr-1" /> {p.city}
            </span>
          )}
        </div>

        {/* Col 10-11: Status (2 cols) */}
        <div className="col-span-2">
          <StatusSelect id={p.id!} status={p.status} onStatusChange={onStatusChange} />
        </div>

        {/* Col 12: Actions (1 col) */}
        <div className="col-span-1 flex justify-end">
          <ActionButtons 
            p={p} 
            deletingId={deletingId} 
            confirmDeleteId={confirmDeleteId}
            onDeleteInit={onDeleteInit}
            onDeleteConfirm={onDeleteConfirm}
            onDeleteCancel={onDeleteCancel}
          />
        </div>
      </div>


      {/* MOBILE VIEW (< MD) - STACKED CARD */}
      <div className="md:hidden p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1 mr-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
              {p.name}
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-300">
                {p.activity || 'Autre'}
              </span>
              {!groupByCity && (
                 <span className="flex items-center text-xs text-gray-500">
                   <MapPin className="w-3 h-3 mr-1" /> {p.city}
                 </span>
              )}
            </div>
          </div>
          <div className="shrink-0 flex gap-1">
            <ActionButtons 
              p={p} 
              deletingId={deletingId} 
              confirmDeleteId={confirmDeleteId}
              onDeleteInit={onDeleteInit}
              onDeleteConfirm={onDeleteConfirm}
              onDeleteCancel={onDeleteCancel}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
           <ContactInfo p={p} />
        </div>

        <div className="pt-2">
          <StatusSelect id={p.id!} status={p.status} isMobile={true} onStatusChange={onStatusChange} />
        </div>

        {/* Note Area Mobile */}
        <div className="pt-1">
           <textarea
              defaultValue={p.notes}
              onBlur={(e) => p.id && onNotesChange(p.id, e.target.value)}
              placeholder="Notes..."
              rows={1}
              className="w-full text-sm bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800 px-3 py-2 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:ring-1 focus:ring-blue-500 resize-none transition-all focus:bg-white dark:focus:bg-gray-900"
            />
        </div>
      </div>
    </div>
  );
};

// --- Header Component ---

const DesktopHeader = () => (
  <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider backdrop-blur-sm sticky top-0 z-10">
    <div className="col-span-2">Nom</div>
    <div className="col-span-2">Notes</div>
    <div className="col-span-3">Contact</div>
    <div className="col-span-2">Activité</div>
    <div className="col-span-2">Statut</div>
    <div className="col-span-1 text-right">Actions</div>
  </div>
);

// --- Main Component ---

const ProspectList: React.FC<ProspectListProps> = ({ prospects, groupByCity }) => {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // États de suppression
  const [deletingCity, setDeletingCity] = useState<string | null>(null);
  const [confirmCityName, setConfirmCityName] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // --- Handlers ---
  const handleStatusChange = async (id: string, newStatus: ProspectStatus) => {
    if(!id) return;
    try {
      await updateProspect(id, { status: newStatus });
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const handleNotesChange = (id: string, newNotes: string) => {
    if(!id) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
       try {
        await updateProspect(id, { notes: newNotes });
      } catch (error) {
        console.error("Failed to update notes", error);
      }
    }, 800);
  };

  // --- SINGLE DELETE HANDLERS (Non-blocking UI) ---
  
  const handleDeleteInit = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleDeleteCancel = () => {
    setConfirmDeleteId(null);
  };

  const handleDeleteConfirm = async (id: string) => {
    console.log("Confirmation suppression ID :", id);
    setConfirmDeleteId(null); // On ferme la bulle de confirm
    setDeletingId(id); // On active le loader
    
    try {
      await deleteProspect(id);
      console.log("Suppression réussie pour :", id);
    } catch (error) {
      console.error("Erreur suppression:", error);
      alert("Erreur technique lors de la suppression. Vérifiez la console.");
    } finally {
      setDeletingId(null);
    }
  };

  // --- CITY BATCH DELETE HANDLERS (Non-blocking UI) ---

  const handleDeleteCityInit = (city: string) => {
    setConfirmCityName(city);
  }

  const handleDeleteCityCancel = () => {
    setConfirmCityName(null);
  }

  const handleDeleteCityConfirm = async (city: string, ids: string[]) => {
    console.log(`Confirmation suppression ville ${city} (${ids.length} items)`);
    if (ids.length === 0) return;

    setConfirmCityName(null);
    setDeletingCity(city);

    try {
      await batchDeleteProspects(ids);
      console.log("Suppression de groupe réussie");
    } catch (error) {
      console.error("Failed to delete batch", error);
      alert("Erreur lors de la suppression en masse.");
    } finally {
      setDeletingCity(null);
    }
  }

  // --- Empty State ---
  if (prospects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
        <Briefcase className="w-12 h-12 opacity-50 mb-3" />
        <p className="font-medium">Aucun prospect trouvé</p>
      </div>
    );
  }

  // --- Grouped View ---
  if (groupByCity) {
    const grouped = prospects.reduce((acc, p) => {
      const city = p.city || 'Sans ville';
      if (!acc[city]) acc[city] = [];
      acc[city].push(p);
      return acc;
    }, {} as Record<string, Prospect[]>);

    const sortedCities = Object.keys(grouped).sort();

    return (
      <div className="space-y-8 pb-20">
        {sortedCities.map(city => (
          <div key={city} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-800 overflow-hidden">
            {/* Header Ville */}
            <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center flex-wrap gap-4">
              <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                  <MapPin className="w-4 h-4" />
                </span>
                {city}
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded-full">
                  {grouped[city].length}
                </span>
              </h2>
              
              {/* City Delete Action */}
              {confirmCityName === city ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400 hidden sm:inline">Vraiment tout supprimer ?</span>
                  <button 
                    onClick={() => handleDeleteCityConfirm(city, grouped[city].map(p => p.id!).filter(Boolean) as string[])}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    <Check className="w-3 h-3" /> Oui
                  </button>
                  <button 
                    onClick={handleDeleteCityCancel}
                    className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => handleDeleteCityInit(city)}
                  disabled={deletingCity === city || confirmCityName !== null}
                  className={`text-xs border px-3 py-1.5 rounded-lg transition-all flex items-center gap-2
                    ${deletingCity === city 
                      ? 'text-red-400 border-red-200 bg-red-50 cursor-not-allowed opacity-70' 
                      : 'text-red-500 hover:text-white border-red-200 dark:border-red-900 hover:bg-red-500 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-red-500'
                    }`}
                >
                  {deletingCity === city ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3 h-3" />
                      Tout supprimer
                    </>
                  )}
                </button>
              )}
            </div>
            
            {/* Table Header (Desktop only) */}
            <DesktopHeader />

            {/* Liste */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {grouped[city].map((p, idx) => (
                <ProspectRow 
                  key={p.id || idx}
                  p={p} 
                  isLast={idx === grouped[city].length - 1} 
                  groupByCity={true}
                  deletingId={deletingId}
                  confirmDeleteId={confirmDeleteId}
                  onStatusChange={handleStatusChange}
                  onNotesChange={handleNotesChange}
                  onDeleteInit={handleDeleteInit}
                  onDeleteConfirm={handleDeleteConfirm}
                  onDeleteCancel={handleDeleteCancel}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // --- Flat View ---
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-800 overflow-hidden pb-0 mb-20">
      <DesktopHeader />
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {prospects.map((p, idx) => (
          <ProspectRow 
            key={p.id || idx}
            p={p} 
            isLast={idx === prospects.length - 1} 
            groupByCity={false}
            deletingId={deletingId}
            confirmDeleteId={confirmDeleteId}
            onStatusChange={handleStatusChange}
            onNotesChange={handleNotesChange}
            onDeleteInit={handleDeleteInit}
            onDeleteConfirm={handleDeleteConfirm}
            onDeleteCancel={handleDeleteCancel}
          />
        ))}
      </div>
    </div>
  );
};

export default ProspectList;
