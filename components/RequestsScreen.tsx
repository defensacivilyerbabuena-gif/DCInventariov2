
import React, { useState, useEffect } from 'react';
import { ItemRequest, User, UserRole, RequestStatus, InventoryItem } from '../types';
import * as api from '../services/supabaseService';
import { Clock, CheckCircle, XCircle, RotateCcw, PlusCircle, FileSpreadsheet, Trash2, AlertTriangle, User as UserIcon, Loader2 } from 'lucide-react';

interface RequestsScreenProps {
  user: User;
  onRefresh: () => void;
}

export const RequestsScreen: React.FC<RequestsScreenProps> = ({ user, onRefresh }) => {
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  // States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestNotes, setRequestNotes] = useState('');
  const [customRequesterName, setCustomRequesterName] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    const [reqData, itemsData] = await Promise.all([
        api.getRequests(),
        api.getItems()
    ]);
    setRequests(reqData);
    setItems(itemsData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return;

    const item = items.find(i => i.id === selectedItemId);
    if (item) {
        setIsProcessing(true);
        try {
            // Logic for Admin manual requester name
            const finalRequesterName = (user.role === UserRole.ADMIN && customRequesterName.trim() !== '') 
            ? customRequesterName 
            : user.name;

            // Supervisor Auto-Approval Logic
            const initialStatus = user.role === UserRole.SUPERVISOR ? RequestStatus.APPROVED : RequestStatus.PENDING;

            await api.createRequest(user.id, finalRequesterName, item, requestQuantity, requestNotes, initialStatus);
            
            await fetchData();
            setIsRequestModalOpen(false);
            // Reset
            setSelectedItemId('');
            setRequestQuantity(1);
            setRequestNotes('');
            setCustomRequesterName('');
            onRefresh();
        } catch (error) {
            alert("Error al crear solicitud.");
        } finally {
            setIsProcessing(false);
        }
    }
  };

  const handleStatusChange = async (reqId: string, status: RequestStatus) => {
    const request = requests.find(r => r.id === reqId);
    const item = items.find(i => i.id === request?.itemId);
    
    if (request && item) {
        setIsProcessing(true);
        try {
            await api.updateRequestStatus(reqId, status, request, item.available);
            await fetchData();
            onRefresh();
        } catch(e) {
            alert("Error al actualizar estado");
        } finally {
            setIsProcessing(false);
        }
    }
  };

  const confirmDeleteAll = async () => {
    setIsProcessing(true);
    try {
        await api.clearAllRequests();
        await fetchData();
        setIsDeleteModalOpen(false);
        onRefresh();
    } catch (e) {
        alert("Error al borrar historial");
    } finally {
        setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.APPROVED:
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800`}><CheckCircle className={`w-3 h-3 mr-1`} /> Aprobado</span>;
      case RequestStatus.REJECTED:
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800`}><XCircle className={`w-3 h-3 mr-1`} /> Rechazado</span>;
      case RequestStatus.RETURNED:
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800`}><RotateCcw className={`w-3 h-3 mr-1`} /> Devuelto</span>;
      default:
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800`}><Clock className={`w-3 h-3 mr-1`} /> Pendiente</span>;
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID Solicitud", "Fecha", "Solicitante", "ID Agente", "Equipo Solicitado", "Cantidad", "Estado", "Notas"];
    const rows = requests.map(r => {
      let estadoEs = 'Pendiente';
      if(r.status === RequestStatus.APPROVED) estadoEs = 'Aprobado';
      if(r.status === RequestStatus.REJECTED) estadoEs = 'Rechazado';
      if(r.status === RequestStatus.RETURNED) estadoEs = 'Devuelto';
      const cleanNotes = r.notes ? r.notes.replace(/"/g, '""') : '';
      return [
        r.id, new Date(r.requestDate).toLocaleDateString('es-AR'), `"${r.userName}"`, r.userId, `"${r.itemName}"`, r.quantity, estadoEs, `"${cleanNotes}"`
      ].join(',');
    });
    const csvContent = "\ufeff" + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_solicitudes_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
        <div className={`flex items-center justify-center h-64`}>
            <Loader2 className={`w-8 h-8 animate-spin text-dcRed`} />
        </div>
    )
}

  return (
    <div className={`space-y-6`}>
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4`}>
        <div>
          <h2 className={`text-2xl font-bold text-gray-900`}>Solicitudes de Equipo</h2>
          <p className={`text-gray-600 text-sm font-medium`}>Administración de préstamos y devoluciones</p>
        </div>
        <div className={`flex flex-wrap gap-2 w-full lg:w-auto`}>
          {user.role === UserRole.ADMIN && (
              <button 
                onClick={() => setIsDeleteModalOpen(true)}
                className={`flex-1 lg:flex-none bg-white border border-red-200 hover:bg-red-50 text-red-700 px-5 py-2.5 rounded-2xl shadow-sm flex items-center justify-center transition-colors font-bold text-sm`}
              >
                <Trash2 className={`w-5 h-5 mr-2`} /> Limpiar Historial
              </button>
          )}
          <button onClick={handleExportCSV} className={`flex-1 lg:flex-none bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 px-5 py-2.5 rounded-2xl shadow-sm flex items-center justify-center transition-colors font-bold text-sm`}>
            <FileSpreadsheet className={`w-5 h-5 mr-2 text-green-700`} /> Exportar Excel
          </button>
          <button onClick={() => setIsRequestModalOpen(true)} className={`flex-1 lg:flex-none bg-dcRed hover:bg-dcDarkRed text-white px-5 py-2.5 rounded-2xl shadow flex items-center justify-center transition-colors font-bold text-sm`}>
            <PlusCircle className={`w-5 h-5 mr-2`} /> Nueva Solicitud
          </button>
        </div>
      </div>

      <div className={`bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden`}>
        <div className={`overflow-x-auto`}>
          <table className={`min-w-full divide-y divide-gray-200`}>
            <thead className={`bg-gray-50`}>
              <tr>
                <th className={`px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase`}>Fecha</th>
                <th className={`px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase`}>Solicitante</th>
                <th className={`px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase`}>Equipo</th>
                <th className={`px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase`}>Estado</th>
                <th className={`px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase`}>Acciones</th>
              </tr>
            </thead>
            <tbody className={`bg-white divide-y divide-gray-200`}>
              {requests.map(request => (
                <tr key={request.id} className={`hover:bg-gray-50 transition-colors`}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium`}>{new Date(request.requestDate).toLocaleDateString()}</td>
                  <td className={`px-6 py-4 whitespace-nowrap`}><div className={`text-sm font-bold text-gray-900`}>{request.userName}</div><div className={`text-xs text-gray-600 font-medium`}>ID: {request.userId.substring(0,8)}...</div></td>
                  <td className={`px-6 py-4`}><div className={`text-sm text-gray-900 font-bold`}>{request.itemName}</div><div className={`text-sm text-gray-700 font-medium`}>Cantidad: {request.quantity}</div>{request.notes && <div className={`text-xs text-gray-600 italic mt-1 bg-gray-100 p-1 rounded-lg inline-block border border-gray-200`}>"{request.notes}"</div>}</td>
                  <td className={`px-6 py-4 whitespace-nowrap`}>{getStatusBadge(request.status)}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium`}>
                    {user.role === UserRole.ADMIN && request.status === RequestStatus.PENDING && (
                      <div className={`flex justify-end space-x-2`}>
                        <button disabled={isProcessing} onClick={() => handleStatusChange(request.id, RequestStatus.APPROVED)} className={`text-green-700 bg-green-100 px-3 py-1.5 rounded-xl text-xs font-bold border border-green-200`}>Aprobar</button>
                        <button disabled={isProcessing} onClick={() => handleStatusChange(request.id, RequestStatus.REJECTED)} className={`text-red-700 bg-red-100 px-3 py-1.5 rounded-xl text-xs font-bold border border-red-200`}>Rechazar</button>
                      </div>
                    )}
                    {user.role === UserRole.ADMIN && request.status === RequestStatus.APPROVED && (
                      <button disabled={isProcessing} onClick={() => handleStatusChange(request.id, RequestStatus.RETURNED)} className={`text-blue-700 bg-blue-100 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center ml-auto border border-blue-200`}><RotateCcw className={`w-3 h-3 mr-1`} /> Marcar Devuelto</button>
                    )}
                    {user.role !== UserRole.ADMIN && request.status === RequestStatus.PENDING && <span className={`text-gray-600 text-xs bg-gray-100 px-2 py-1 rounded-lg font-bold border border-gray-200`}>Esperando aprobación</span>}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && <tr><td colSpan={5} className={`px-6 py-12 text-center text-gray-500 font-medium`}>No hay solicitudes registradas</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

       {/* NEW REQUEST MODAL */}
       {isRequestModalOpen && (
        <div className={`fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm`}>
          <div className={`bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-gray-200`}>
            <div className={`p-6 border-b border-gray-200`}><h3 className={`text-xl font-bold text-gray-900`}>Nueva Solicitud</h3></div>
            <form onSubmit={handleCreateRequest} className={`p-6 space-y-4`}>
               {/* ADMIN MANUAL REQUESTER FIELD */}
               {user.role === UserRole.ADMIN && (
                   <div className={`bg-amber-50 p-3 rounded-2xl border border-amber-200`}>
                      <label className={`block text-xs font-bold text-amber-800 mb-1 flex items-center`}><UserIcon className={`w-3 h-3 mr-1`} /> Solicitante (Verbal / Manual)</label>
                      <input type="text" className={`w-full px-3 py-2 border border-amber-300 rounded-xl bg-white text-gray-900 text-sm font-medium placeholder-gray-500`} placeholder="Ej: Oficial García" value={customRequesterName} onChange={e => setCustomRequesterName(e.target.value)} />
                   </div>
               )}
               <div><label className={`block text-sm font-bold text-gray-800 mb-1`}>Equipo</label><select required className={`w-full px-4 py-3 border border-gray-400 rounded-2xl bg-white text-gray-900 font-bold`} value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)}><option value="">-- Seleccionar --</option>{items.filter(i => i.available > 0).map(i => <option key={i.id} value={i.id}>{i.name} (Disp: {i.available})</option>)}</select></div>
               <div><label className={`block text-sm font-bold text-gray-800 mb-1`}>Cantidad</label><input type="number" min="1" max={items.find(i => i.id === selectedItemId)?.available || 1} required className={`w-full px-4 py-3 border border-gray-400 rounded-2xl bg-white text-gray-900 font-bold`} value={requestQuantity} onChange={e => setRequestQuantity(parseInt(e.target.value))} /></div>
               <div><label className={`block text-sm font-bold text-gray-800 mb-1`}>Notas</label><textarea className={`w-full px-4 py-3 border border-gray-400 rounded-2xl h-24 bg-white text-gray-900 font-medium placeholder-gray-600`} placeholder="Motivo de la solicitud..." value={requestNotes} onChange={e => setRequestNotes(e.target.value)}></textarea></div>
               <div className={`flex justify-end pt-2 space-x-3`}><button type="button" onClick={() => setIsRequestModalOpen(false)} className={`px-5 py-2.5 text-gray-700 bg-gray-100 rounded-2xl font-bold border border-gray-300 hover:bg-gray-200`}>Cancelar</button><button type="submit" className={`px-5 py-2.5 bg-dcRed text-white rounded-2xl font-bold shadow-md hover:bg-dcDarkRed flex items-center`}>
                    {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Solicitar
                </button></div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className={`fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in`}>
           <div className={`bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-6 text-center border border-gray-200`}>
              <div className={`w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4`}><AlertTriangle className={`w-8 h-8 text-red-700`} /></div>
              <h3 className={`text-xl font-bold text-gray-900 mb-2`}>¿Borrar Historial?</h3>
              <p className={`text-sm text-gray-700 mb-6 font-medium`}>Esto eliminará <strong>todas</strong> las solicitudes registradas permanentemente.</p>
              <div className={`flex gap-3`}>
                 <button onClick={() => setIsDeleteModalOpen(false)} className={`flex-1 py-3 bg-gray-100 text-gray-800 font-bold rounded-2xl border border-gray-300 hover:bg-gray-200`}>Cancelar</button>
                 <button onClick={confirmDeleteAll} className={`flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl shadow-lg hover:bg-red-700`}>Sí, Borrar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
