
import React, { useState, useEffect } from 'react';
import { InventoryItem, User, UserRole, Category, Observation } from '../types';
import * as api from '../services/supabaseService';
import { 
  Search, Plus, Filter, AlertCircle, FileText, Truck, Radio, Wrench, Box, X, Upload, Calendar, 
  Save, MessageSquarePlus, Edit2, Check, XCircle, BarChart3, AlertTriangle, 
  ArrowRight, ArrowLeft, LifeBuoy, Stethoscope, Package, BookOpen, Download, Trash2, Loader2
} from 'lucide-react';

interface InventoryScreenProps {
  user: User;
  onRefresh: () => void;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({ user, onRefresh }) => {
  // --- STATE ---
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showCriticalModal, setShowCriticalModal] = useState(false);
  const [observationToDelete, setObservationToDelete] = useState<string | null>(null);
  
  // Edit & New Item
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // File handling
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedManualFile, setSelectedManualFile] = useState<File | null>(null);
  
  const [editFormData, setEditFormData] = useState<Partial<InventoryItem>>({});
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '', category: Category.RESCUE, quantity: 1, available: 1, 
    description: '', specifications: {}, image: '', observations: [], 
    usageInstructions: '', manualUrl: ''
  });

  // Observations & Specs
  const [isObsFormOpen, setIsObsFormOpen] = useState(false);
  const [newObsText, setNewObsText] = useState('');
  const [newObsType, setNewObsType] = useState<'MAINTENANCE' | 'DAMAGE' | 'GENERAL'>('GENERAL');
  const [tempSpecKey, setTempSpecKey] = useState('');
  const [tempSpecValue, setTempSpecValue] = useState('');

  // --- EFFECTS ---
  const fetchItems = async () => {
    setIsLoading(true);
    const data = await api.getItems();
    setItems(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (selectedItem) {
      setIsEditing(false);
      setIsObsFormOpen(false);
      setEditFormData(selectedItem);
      setSelectedImageFile(null);
      setSelectedManualFile(null);
    }
  }, [selectedItem]);

  // --- HELPERS ---
  const getCategoryConfig = (cat: Category) => {
    switch (cat) {
      case Category.VEHICLES: return { icon: Truck, gradient: 'from-blue-500 to-blue-600' };
      case Category.MEDICAL: return { icon: Stethoscope, gradient: 'from-red-500 to-red-600' };
      case Category.COMMS: return { icon: Radio, gradient: 'from-yellow-400 to-yellow-600' };
      case Category.TOOLS: return { icon: Wrench, gradient: 'from-gray-500 to-gray-700' };
      case Category.RESCUE: return { icon: LifeBuoy, gradient: 'from-orange-500 to-orange-600' };
      default: return { icon: Package, gradient: 'from-purple-500 to-purple-600' };
    }
  };

  const getCategoryIcon = (cat: Category) => {
     const Config = getCategoryConfig(cat);
     const Icon = Config.icon;
     return <Icon className={`w-4 h-4`} />;
  };

  const getObsTypeLabel = (type: string) => {
    switch(type) {
      case 'DAMAGE': return { label: 'Daño / Falla', color: 'text-red-700 bg-red-100 border-red-200' };
      case 'MAINTENANCE': return { label: 'Mantenimiento', color: 'text-blue-700 bg-blue-100 border-blue-200' };
      default: return { label: 'General', color: 'text-gray-800 bg-gray-100 border-gray-200' };
    }
  };

  // --- FILTERS ---
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalUnits = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalAvailable = items.reduce((acc, item) => acc + item.available, 0);
  const criticalItemsList = items.filter(item => item.available < 2);
  const lowStockItems = criticalItemsList.length;
  const showCategoryView = filterCategory === 'ALL' && searchTerm === '';

  // --- HANDLERS ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImageFile(file);
      // Preview
      setNewItem(prev => ({ ...prev, image: URL.createObjectURL(file) }));
    }
  };

  const handleManualSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setSelectedManualFile(e.target.files[0]);
    }
  };

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
        setSelectedImageFile(e.target.files[0]);
        // Update local preview immediately
        setEditFormData(prev => ({ ...prev, image: URL.createObjectURL(e.target.files![0]) }));
     }
  }

  const handleEditManualSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedManualFile(e.target.files[0]);
    }
  };

  const handleAddSpec = () => {
    if (tempSpecKey && tempSpecValue) {
      setNewItem(prev => ({ ...prev, specifications: { ...prev.specifications, [tempSpecKey]: tempSpecValue } }));
      setTempSpecKey('');
      setTempSpecValue('');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.name && newItem.quantity) {
      setIsSubmitting(true);
      try {
        await api.addItem(
            newItem as InventoryItem, 
            selectedImageFile || undefined, 
            selectedManualFile || undefined
        );
        await fetchItems();
        setIsAddModalOpen(false);
        onRefresh();
        // Reset
        setNewItem({ name: '', category: Category.RESCUE, quantity: 1, available: 1, description: '', specifications: {}, image: '', observations: [], usageInstructions: '', manualUrl: '' });
        setSelectedImageFile(null);
        setSelectedManualFile(null);
        setTempSpecKey('');
        setTempSpecValue('');
      } catch (error) {
          alert('Error al guardar el ítem. Intente nuevamente.');
          console.error(error);
      } finally {
          setIsSubmitting(false);
      }
    }
  };

  const handleAddObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem && newObsText.trim()) {
      const newObs: Observation = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('es-AR'),
        author: user.name,
        text: newObsText,
        type: newObsType
      };
      
      try {
          await api.addObservation(selectedItem.id, newObs, selectedItem.observations || []);
          // Optimistic update for UI
          const updatedObservations = [newObs, ...(selectedItem.observations || [])];
          const updatedItem = { ...selectedItem, observations: updatedObservations };
          setSelectedItem(updatedItem);
          setItems(prev => prev.map(i => i.id === selectedItem.id ? updatedItem : i));
          setNewObsText('');
          setIsObsFormOpen(false);
      } catch (e) {
          alert("Error al guardar observación");
      }
    }
  };

  const handleDeleteObservationClick = (obsId: string) => {
    setObservationToDelete(obsId);
  };

  const confirmDeleteObservation = async () => {
    if (!selectedItem || !observationToDelete) return;
    try {
        await api.deleteObservation(selectedItem.id, observationToDelete, selectedItem.observations || []);
        
        const updatedObservations = (selectedItem.observations || []).filter(o => o.id !== observationToDelete);
        const updatedItem = { ...selectedItem, observations: updatedObservations };
        setSelectedItem(updatedItem);
        setItems(prev => prev.map(i => i.id === selectedItem.id ? updatedItem : i));
        
        setObservationToDelete(null);
    } catch (e) {
        alert("Error al eliminar observación");
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedItem || !editFormData) return;
    setIsSubmitting(true);
    const updatedItem: InventoryItem = {
      ...selectedItem,
      ...editFormData,
      quantity: Number(editFormData.quantity),
      available: Number(editFormData.available)
    };

    try {
        await api.updateItem(updatedItem, selectedImageFile || undefined, selectedManualFile || undefined);
        await fetchItems();
        setSelectedItem(updatedItem);
        setIsEditing(false);
        onRefresh();
    } catch (error) {
        alert("Error al actualizar");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) {
      return (
          <div className={`flex items-center justify-center h-64`}>
              <Loader2 className={`w-8 h-8 animate-spin text-dcRed`} />
          </div>
      )
  }

  return (
    <div className={`space-y-6 animate-in fade-in duration-500`}>
      {/* HEADER */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
        <div className={`flex items-center`}>
          {filterCategory !== 'ALL' && !searchTerm && (
             <button onClick={() => setFilterCategory('ALL')} className={`mr-3 p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors`}>
               <ArrowLeft className={`w-5 h-5`} />
             </button>
          )}
          <div>
            <h2 className={`text-2xl font-bold text-gray-900`}>
               {filterCategory === 'ALL' ? 'Inventario General' : filterCategory}
            </h2>
            <p className={`text-gray-600 text-sm font-medium`}>
               {filterCategory === 'ALL' ? 'Seleccione una categoría o busque un equipo' : `Listado de equipos de ${filterCategory}`}
            </p>
          </div>
        </div>
        
        {user.role === UserRole.ADMIN && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className={`bg-dcRed hover:bg-dcDarkRed text-white px-4 py-2 rounded-2xl shadow flex items-center transition-colors transform hover:scale-105 active:scale-95 font-bold`}
          >
            <Plus className={`w-5 h-5 mr-2`} />
            Nuevo Ítem
          </button>
        )}
      </div>

      {/* DASHBOARD STATS */}
      {showCategoryView && (
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-2`}>
            <div className={`bg-white p-4 rounded-[1.5rem] border border-gray-200 shadow-sm flex items-center space-x-4`}>
                <div className={`p-3 bg-blue-50 rounded-2xl text-blue-700`}><BarChart3 className={`w-6 h-6`} /></div>
                <div><p className={`text-xs text-gray-600 font-bold uppercase tracking-wider`}>Total Unidades</p><p className={`text-2xl font-bold text-gray-900`}>{totalUnits}</p></div>
            </div>
            <div className={`bg-white p-4 rounded-[1.5rem] border border-gray-200 shadow-sm flex items-center space-x-4`}>
                <div className={`p-3 bg-green-50 rounded-2xl text-green-700`}><Check className={`w-6 h-6`} /></div>
                <div><p className={`text-xs text-gray-600 font-bold uppercase tracking-wider`}>Disponibles</p><p className={`text-2xl font-bold text-gray-900`}>{totalAvailable}</p></div>
            </div>
            <div 
              onClick={() => { if (lowStockItems > 0) setShowCriticalModal(true); }} 
              className={`bg-white p-4 rounded-[1.5rem] border border-gray-200 shadow-sm flex items-center space-x-4 transition-all ${lowStockItems > 0 ? 'cursor-pointer hover:shadow-lg hover:border-red-300' : ''}`}
            >
                <div className={`p-3 rounded-2xl ${lowStockItems > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'}`}><AlertTriangle className={`w-6 h-6`} /></div>
                <div className={`flex-1`}>
                    <div className={`flex justify-between items-start`}>
                        <div>
                            <p className={`text-xs text-gray-600 font-bold uppercase tracking-wider`}>Stock Crítico</p>
                            <div className={`flex items-baseline space-x-2`}>
                                <p className={`text-2xl font-bold ${lowStockItems > 0 ? 'text-red-700' : 'text-gray-900'}`}>{lowStockItems}</p>
                                {lowStockItems > 0 && <span className={`text-xs text-red-600 font-bold`}>Requieren atención</span>}
                            </div>
                        </div>
                        {lowStockItems > 0 && <ArrowRight className={`w-4 h-4 text-gray-400`} />}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* SEARCH */}
      <div className={`bg-white p-4 rounded-3xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 sticky top-2 z-10`}>
        <div className={`relative flex-1`}>
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5`} />
          <input 
            type="text" 
            placeholder="Buscar equipamiento..." 
            className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-dcRed focus:border-transparent outline-none transition-all bg-white text-gray-900 placeholder-gray-500 font-medium`} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        {!showCategoryView && (
             <div className={`flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0`}>
             <Filter className={`w-5 h-5 text-gray-500`} />
             <select 
               className={`border border-gray-300 rounded-2xl px-4 py-3 bg-white text-gray-900 outline-none focus:border-dcRed transition-colors font-bold`} 
               value={filterCategory} 
               onChange={(e) => setFilterCategory(e.target.value)}
             >
                 <option value="ALL">Todo</option>
                 {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
             </select>
             </div>
        )}
      </div>

      {/* CATEGORY GRID */}
      {showCategoryView ? (
        <div className={`py-8`}>
            <h3 className={`text-lg font-bold text-gray-800 mb-6 pl-2`}>Seleccione una Categoría</h3>
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8`}>
                {Object.values(Category).map(cat => {
                    const config = getCategoryConfig(cat);
                    const Icon = config.icon;
                    const count = items.filter(i => i.category === cat).length;
                    return (
                        <button 
                          key={cat} 
                          onClick={() => setFilterCategory(cat)} 
                          className={`group flex flex-col items-center justify-center space-y-4 p-6 rounded-[3rem] bg-white border border-gray-200 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 transform hover:-translate-y-1`}
                        >
                            <div className={`w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center bg-gradient-to-br ${config.gradient} shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                                <Icon className={`w-12 h-12 md:w-16 md:h-16 text-white`} />
                            </div>
                            <div className={`text-center`}>
                                <h4 className={`text-lg md:text-xl font-bold text-gray-900 group-hover:text-dcRed transition-colors`}>{cat}</h4>
                                <span className={`text-sm text-gray-700 font-bold`}>{count} ítems</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
      ) : (
        /* ITEM LIST */
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500`}>
            {filteredItems.map(item => (
            <div key={item.id} className={`bg-white rounded-[2rem] shadow-sm border border-gray-200 p-3 hover:shadow-lg transition-all duration-300 flex flex-col group`}>
                <div className={`h-48 rounded-[1.5rem] overflow-hidden relative bg-gray-100 mb-3 shadow-inner border-b border-gray-200`}>
                    <img src={item.image || 'https://placehold.co/600x400/png?text=Sin+Imagen'} alt={item.name} className={`w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500`} />
                    <div className={`absolute top-3 right-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-gray-800 flex items-center shadow-md border border-gray-200`}>
                        {getCategoryIcon(item.category)}<span className={`ml-1`}>{item.category}</span>
                    </div>
                </div>
                <div className={`px-3 pb-3 flex-1 flex flex-col`}>
                    <h3 className={`text-lg font-bold text-gray-900 mb-1 leading-tight group-hover:text-dcRed transition-colors`}>{item.name}</h3>
                    <p className={`text-gray-600 text-sm mb-4 line-clamp-2 flex-1`}>{item.description}</p>
                    <div className={`flex justify-between items-center mb-4 gap-2`}>
                        <div className={`text-center bg-gray-100 p-2 rounded-2xl flex-1 border border-gray-300`}><span className={`block text-[10px] text-gray-600 uppercase tracking-wider font-bold`}>Total</span><span className={`font-bold text-gray-900`}>{item.quantity}</span></div>
                        <div className={`text-center p-2 rounded-2xl flex-1 border ${item.available === 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}><span className={`block text-[10px] opacity-80 uppercase tracking-wider font-bold`}>Disp.</span><span className={`font-bold`}>{item.available}</span></div>
                    </div>
                    {item.available === 0 && <div className={`mb-4 flex items-center text-xs text-red-700 font-bold bg-red-50 p-2 rounded-xl border border-red-200`}><AlertCircle className={`w-4 h-4 mr-2`} /> Sin stock</div>}
                    <div className={`pt-2 flex justify-between items-center`}>
                        <button onClick={() => { setSelectedItem(item); setIsObsFormOpen(false); setIsEditing(false); }} className={`w-full bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 flex items-center justify-center px-4 py-3 rounded-2xl transition-colors shadow-sm active:scale-95`}><FileText className={`w-4 h-4 mr-2`} /> Ver Detalles</button>
                    </div>
                </div>
            </div>
            ))}
            {filteredItems.length === 0 && (
            <div className={`col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-[2rem] border border-gray-300 border-dashed`}>
                <Box className={`w-12 h-12 mx-auto mb-3 opacity-30`} />
                <p className={`font-medium`}>No se encontraron equipos con ese criterio.</p>
                {filterCategory !== 'ALL' && <button onClick={() => setFilterCategory('ALL')} className={`mt-4 text-dcRed font-bold hover:underline`}>Volver a categorías</button>}
            </div>
            )}
        </div>
      )}

      {/* MODALS */}
      {showCriticalModal && (
        <div className={`fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm`}>
           <div className={`bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-200`}>
              <div className={`p-6 border-b border-gray-200 flex justify-between items-center`}>
                <div className={`flex items-center text-red-700`}><AlertTriangle className={`w-6 h-6 mr-2`} /><h3 className={`text-xl font-bold`}>Stock Crítico</h3></div>
                <button onClick={() => setShowCriticalModal(false)} className={`text-gray-500 hover:text-gray-700 bg-gray-100 p-2 rounded-full`}><X className={`w-5 h-5`} /></button>
              </div>
              <div className={`p-6 max-h-[60vh] overflow-y-auto space-y-3`}>
                 <p className={`text-sm text-gray-700 font-medium mb-4`}>Los siguientes ítems tienen menos de 2 unidades disponibles:</p>
                 {criticalItemsList.map(item => (
                    <div key={item.id} className={`flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-2xl`}>
                       <div className={`flex items-center space-x-3`}>
                          <img src={item.image} alt={item.name} className={`w-10 h-10 object-cover rounded-lg bg-white border border-gray-200`} />
                          <div><p className={`text-sm font-bold text-gray-900 leading-tight`}>{item.name}</p><p className={`text-xs text-red-700 font-bold`}>{item.category}</p></div>
                       </div>
                       <div className={`text-center bg-white px-3 py-1 rounded-lg border border-red-200 shadow-sm`}>
                          <span className={`block text-[10px] text-gray-500 uppercase font-bold`}>Disp</span>
                          <span className={`text-lg font-bold text-red-700`}>{item.available}</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {selectedItem && (
        <div className={`fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md`}>
          <div className={`bg-white rounded-[2.5rem] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200 border-4 border-white`}>
            <div className={`relative h-64 bg-gray-200 m-2 rounded-[2rem] overflow-hidden`}>
              <img src={selectedItem.image || 'https://placehold.co/600x400/png?text=Sin+Imagen'} alt={selectedItem.name} className={`w-full h-full object-cover`} />
              <button onClick={() => setSelectedItem(null)} className={`absolute top-4 right-4 bg-white/30 backdrop-blur-md p-2 rounded-full shadow-lg hover:bg-white transition-colors z-20`}><X className={`w-5 h-5 text-white hover:text-gray-900`} /></button>
              <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-12`}>
                {isEditing ? (
                   <div className={`space-y-2 mb-2 p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30`}>
                      <select className={`bg-white text-xs font-bold px-3 py-2 rounded-xl text-gray-900 w-full mb-2 outline-none`} value={editFormData.category} onChange={e => setEditFormData({...editFormData, category: e.target.value as Category})}>
                         {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <input type="text" className={`w-full bg-white rounded-xl px-3 py-2 text-lg font-bold text-gray-900 outline-none`} value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                   </div>
                ) : (
                  <><span className={`bg-dcRed text-white text-xs font-bold px-2 py-1 rounded-lg mb-2 inline-block shadow-sm`}>{selectedItem.category}</span><h3 className={`text-2xl font-bold text-white leading-tight`}>{selectedItem.name}</h3></>
                )}
              </div>
            </div>
            <div className={`px-6 pb-8 space-y-6 pt-2`}>
              <div className={`flex justify-between items-center border-b border-gray-200 pb-2`}>
                 <h4 className={`text-xs font-bold text-gray-500 uppercase tracking-widest`}>Información Técnica</h4>
                 {user.role === UserRole.ADMIN && (
                   isEditing ? (
                     <div className={`flex space-x-2`}>
                        <button onClick={() => setIsEditing(false)} className={`text-gray-600 hover:text-gray-800 flex items-center text-xs px-3 py-2 rounded-xl bg-gray-100 font-bold border border-gray-200`}><XCircle className={`w-3 h-3 mr-1`} /> Cancelar</button>
                        <button onClick={handleSaveEdit} disabled={isSubmitting} className={`text-white bg-green-600 hover:bg-green-700 flex items-center text-xs px-3 py-2 rounded-xl shadow-sm font-bold`}>
                            {isSubmitting ? <Loader2 className="w-3 h-3 mr-1 animate-spin"/> : <Check className={`w-3 h-3 mr-1`} />}
                            Guardar
                        </button>
                     </div>
                   ) : (
                     <button onClick={() => setIsEditing(true)} className={`text-dcRed hover:text-dcDarkRed flex items-center text-xs font-bold px-3 py-2 rounded-xl hover:bg-red-50 transition-colors border border-red-100`}><Edit2 className={`w-3 h-3 mr-1`} /> Editar Ítem</button>
                   )
                 )}
              </div>
              <div className={`flex space-x-4`}>
                <div className={`flex-1 rounded-2xl p-3 text-center border ${isEditing ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                   <p className={`text-xs text-gray-600 uppercase mb-1 font-bold`}>Inventario Total</p>
                   {isEditing ? <input type="number" className={`w-full text-center font-bold text-xl bg-white border border-gray-300 text-gray-900 rounded p-1`} value={editFormData.quantity} onChange={e => setEditFormData({...editFormData, quantity: Number(e.target.value)})} /> : <p className={`text-xl font-bold text-gray-900`}>{selectedItem.quantity}</p>}
                </div>
                <div className={`flex-1 rounded-2xl p-3 text-center border ${isEditing ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                   <p className={`text-xs text-gray-600 uppercase mb-1 font-bold`}>Disponible</p>
                   {isEditing ? <input type="number" className={`w-full text-center font-bold text-xl bg-white border border-gray-300 text-gray-900 rounded p-1`} value={editFormData.available} onChange={e => setEditFormData({...editFormData, available: Number(e.target.value)})} /> : <p className={`text-xl font-bold ${selectedItem.available > 0 ? 'text-green-700' : 'text-red-700'}`}>{selectedItem.available}</p>}
                </div>
              </div>
              <div>
                <h4 className={`text-sm font-bold text-gray-800 mb-2 flex items-center`}><FileText className={`w-4 h-4 mr-2 text-dcRed`} /> Descripción</h4>
                {isEditing ? <textarea className={`w-full text-sm p-3 border border-gray-300 rounded-2xl min-h-[100px] bg-white text-gray-900 font-medium`} value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})} /> : <p className={`text-gray-800 text-sm leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-200 font-medium`}>{selectedItem.description}</p>}
              </div>
              
              {/* IMAGE EDITING */}
              {isEditing && (
                 <div className={`bg-blue-50 p-4 rounded-2xl border border-blue-200`}>
                     <h4 className={`text-sm font-bold text-blue-900 mb-2`}>Actualizar Imagen</h4>
                     <input type="file" accept="image/*" onChange={handleEditImageSelect} className={`text-xs text-gray-700 font-medium`} />
                 </div>
              )}

              {(selectedItem.manualUrl || isEditing) && (
                  <div className={`bg-blue-50 p-4 rounded-2xl border border-blue-200`}>
                     <h4 className={`text-sm font-bold text-blue-900 mb-2 flex items-center`}><BookOpen className={`w-4 h-4 mr-2`} /> Manual de Usuario</h4>
                     {isEditing ? (
                        <div className={`mt-2`}><input type="file" accept="application/pdf" onChange={handleEditManualSelect} className={`text-xs text-gray-700 font-medium`} /></div>
                     ) : (
                        selectedItem.manualUrl ? <a href={selectedItem.manualUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center px-4 py-2 bg-white border border-blue-300 rounded-xl text-blue-800 text-sm font-bold shadow-sm hover:bg-blue-50`}><Download className={`w-4 h-4 mr-2`} /> Descargar / Ver PDF</a> : <p className={`text-xs text-gray-500 italic`}>No disponible.</p>
                     )}
                  </div>
              )}
              {(selectedItem.usageInstructions || isEditing) && (
                  <div>
                     <h4 className={`text-sm font-bold text-gray-800 mb-2 flex items-center`}><Check className={`w-4 h-4 mr-2 text-dcRed`} /> Instrucciones de Uso</h4>
                     {isEditing ? <textarea className={`w-full text-sm p-3 border border-gray-300 rounded-2xl min-h-[120px] bg-white text-gray-900 font-medium`} value={editFormData.usageInstructions || ''} onChange={e => setEditFormData({...editFormData, usageInstructions: e.target.value})} /> : <div className={`bg-amber-50 p-4 rounded-2xl border border-amber-200 text-sm text-gray-900 leading-relaxed whitespace-pre-line font-medium`}>{selectedItem.usageInstructions}</div>}
                  </div>
              )}
              {!isEditing && (
                <div className={`pt-4 border-t border-gray-200`}>
                  <div className={`flex justify-between items-center mb-3`}>
                      <h4 className={`text-sm font-bold text-gray-800 flex items-center`}><Calendar className={`w-4 h-4 mr-2 text-dcRed`} /> Bitácora</h4>
                      {!isObsFormOpen && <button onClick={() => setIsObsFormOpen(true)} className={`text-xs bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-full flex items-center font-bold shadow-md`}><MessageSquarePlus className={`w-3 h-3 mr-1`} /> Agregar Nota</button>}
                  </div>
                  {isObsFormOpen && (
                    <div className={`bg-red-50 p-4 rounded-2xl border border-red-200 mb-4 animate-in fade-in`}>
                      <select className={`w-full text-sm border border-gray-300 rounded-xl p-2 mb-2 bg-white text-gray-900 font-bold`} value={newObsType} onChange={(e) => setNewObsType(e.target.value as any)}><option value="GENERAL">General</option><option value="MAINTENANCE">Mantenimiento</option><option value="DAMAGE">Daño / Falla</option></select>
                      <textarea className={`w-full text-sm border border-gray-300 rounded-xl p-3 mb-2 h-20 bg-white text-gray-900 font-medium`} placeholder="Describa la situación..." value={newObsText} onChange={(e) => setNewObsText(e.target.value)}></textarea>
                      <div className={`flex justify-end gap-2`}><button onClick={() => setIsObsFormOpen(false)} className={`text-xs text-gray-600 font-bold`}>Cancelar</button><button onClick={handleAddObservation} className={`text-xs bg-dcRed text-white px-4 py-1.5 rounded-full flex items-center font-bold shadow-sm`}><Save className={`w-3 h-3 mr-1`} /> Guardar</button></div>
                    </div>
                  )}
                  <div className={`space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar`}>
                      {selectedItem.observations?.map(obs => {
                          const style = getObsTypeLabel(obs.type);
                          return (
                            <div key={obs.id} className={`bg-white border border-gray-200 rounded-2xl p-4 shadow-sm group/obs relative`}>
                              <div className={`flex justify-between items-start mb-1`}>
                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase border ${style.color}`}>{style.label}</span>
                                <div className={`flex items-center space-x-2`}>
                                    <span className={`text-[10px] text-gray-500 font-bold`}>{obs.date}</span>
                                    {user.role === UserRole.ADMIN && (
                                        <button 
                                            onClick={() => handleDeleteObservationClick(obs.id)}
                                            className={`text-gray-400 hover:text-red-600 opacity-0 group-hover/obs:opacity-100 transition-opacity`}
                                            title="Eliminar observación"
                                        >
                                            <Trash2 className={`w-3 h-3`} />
                                        </button>
                                    )}
                                </div>
                              </div>
                              <p className={`text-gray-900 text-sm font-bold mt-1`}>{obs.text}</p>
                              <p className={`text-xs text-gray-600 mt-2 text-right italic font-medium`}>— {obs.author}</p>
                            </div>
                          );
                      })}
                      {(!selectedItem.observations || selectedItem.observations.length === 0) && <p className={`text-sm text-gray-500 italic text-center py-4 font-medium`}>Sin observaciones registradas.</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className={`fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm`}>
          <div className={`bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200`}>
            <div className={`p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10`}>
              <h3 className={`text-xl font-bold text-gray-900 flex items-center`}><Plus className={`w-6 h-6 mr-2 text-dcRed`} /> Agregar Nuevo Ítem</h3>
              <button onClick={() => setIsAddModalOpen(false)} className={`text-gray-500 hover:text-gray-700 bg-gray-100 p-2 rounded-full`}><X className={`w-5 h-5`} /></button>
            </div>
            <form onSubmit={handleAddItem} className={`p-6 space-y-6`}>
              <div className={`bg-gray-50 p-4 rounded-3xl border-2 border-dashed border-gray-300 text-center h-48 flex flex-col items-center justify-center relative hover:bg-gray-100 transition-colors`}>
                 <input type="file" accept="image/*" className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20`} onChange={handleImageSelect} />
                 {newItem.image ? <img src={newItem.image} className={`w-full h-full object-contain rounded-xl`} /> : <><Upload className={`w-6 h-6 text-dcRed mb-2`} /><p className={`text-sm text-gray-800 font-bold`}>Subir imagen</p></>}
              </div>
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4`}>
                <div><label className={`block text-sm font-bold text-gray-800 mb-1`}>Nombre</label><input type="text" required className={`w-full px-4 py-3 border border-gray-300 rounded-2xl bg-white text-gray-900 font-medium`} value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} /></div>
                <div><label className={`block text-sm font-bold text-gray-800 mb-1`}>Categoría</label><select className={`w-full px-4 py-3 border border-gray-300 rounded-2xl bg-white text-gray-900 font-bold`} value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value as Category})}>{Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
              </div>
              <div><label className={`block text-sm font-bold text-gray-800 mb-1`}>Cantidad Total</label><input type="number" min="1" required className={`w-full px-4 py-3 border border-gray-300 rounded-2xl bg-white text-gray-900 font-medium`} value={newItem.quantity} onChange={e => { const val = parseInt(e.target.value)||0; setNewItem({...newItem, quantity: val, available: val}); }} /></div>
              <div><label className={`block text-sm font-bold text-gray-800 mb-1`}>Descripción</label><textarea className={`w-full px-4 py-3 border border-gray-300 rounded-2xl h-24 bg-white text-gray-900 font-medium`} value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})}></textarea></div>
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4`}>
                 <div><label className={`block text-sm font-bold text-gray-800 mb-1`}>Manual (PDF)</label><input type="file" accept="application/pdf" onChange={handleManualSelect} className={`block w-full text-sm text-gray-700 font-medium`} /></div>
                 <div><label className={`block text-sm font-bold text-gray-800 mb-1`}>Instrucciones</label><textarea className={`w-full px-4 py-3 border border-gray-300 rounded-2xl h-24 bg-white text-gray-900 font-medium`} value={newItem.usageInstructions} onChange={e => setNewItem({...newItem, usageInstructions: e.target.value})}></textarea></div>
              </div>
              <div className={`bg-gray-50 p-5 rounded-3xl border border-gray-300`}>
                  <h4 className={`text-sm font-bold text-gray-800 mb-3`}>Especificaciones</h4>
                  <div className={`flex gap-2 mb-3`}>
                      <input type="text" placeholder="Caract. (ej: Peso)" className={`flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 placeholder-gray-500 font-medium`} value={tempSpecKey} onChange={e => setTempSpecKey(e.target.value)} />
                      <input type="text" placeholder="Valor (ej: 5kg)" className={`flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 placeholder-gray-500 font-medium`} value={tempSpecValue} onChange={e => setTempSpecValue(e.target.value)} />
                      <button type="button" onClick={handleAddSpec} className={`bg-gray-800 text-white px-4 py-2 rounded-xl text-sm hover:bg-gray-700`}><Plus className={`w-4 h-4`} /></button>
                  </div>
                  <div className={`flex flex-wrap gap-2`}>{Object.entries(newItem.specifications || {}).map(([key, value]) => <span key={key} className={`bg-white border border-gray-300 px-3 py-1 rounded-lg text-xs font-bold text-gray-900`}>{key}: {value}</span>)}</div>
              </div>
              <div className={`flex justify-end pt-4 space-x-3 border-t border-gray-200`}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className={`px-6 py-3 text-gray-700 bg-gray-100 rounded-2xl font-bold hover:bg-gray-200`}>Cancelar</button>
                <button type="submit" disabled={isSubmitting} className={`px-8 py-3 bg-dcRed text-white rounded-2xl font-bold hover:bg-dcDarkRed shadow-md flex items-center`}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Guardar Ítem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE OBSERVATION MODAL - Z-INDEX HIGH */}
      {observationToDelete && (
        <div className={`fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in`}>
           <div className={`bg-white rounded-[2rem] w-full max-w-sm shadow-2xl p-6 text-center transform scale-100 transition-transform border border-gray-200`}>
              <div className={`w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                 <Trash2 className={`w-6 h-6 text-red-700`} />
              </div>
              <h3 className={`text-lg font-bold text-gray-900 mb-2`}>¿Eliminar nota?</h3>
              <p className={`text-sm text-gray-700 mb-6 font-medium`}>
                 Esta acción no se puede deshacer.
              </p>
              <div className={`flex gap-3`}>
                 <button 
                    onClick={() => setObservationToDelete(null)}
                    className={`flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-sm transition-colors`}
                 >
                    Cancelar
                 </button>
                 <button 
                    onClick={confirmDeleteObservation}
                    className={`flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 text-sm transition-colors`}
                 >
                    Eliminar
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
