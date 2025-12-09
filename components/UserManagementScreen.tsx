
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import * as api from '../services/supabaseService';
import { UserPlus, Shield, User as UserIcon, Trash2, X, Lock, HardHat, Fingerprint, AlertTriangle, Loader2 } from 'lucide-react';

interface UserManagementScreenProps {
  currentUser: User;
}

export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await api.getProfiles();
    setUsers(data);
    setIsLoading(false);
  };

  const handleDeleteClick = (userId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (userId === currentUser.id) {
      alert("No puedes eliminar tu propio usuario.");
      return;
    }
    setUserToDelete(userId);
  };

  const confirmDeleteUser = async () => {
    if (userToDelete) {
        try {
            await api.deleteUser(userToDelete);
            await loadUsers();
            setUserToDelete(null);
        } catch (e) {
            alert("Error al eliminar el perfil.");
        }
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch(role) {
      case UserRole.ADMIN:
        return (
          <span className={`bg-red-50 text-dcRed text-[10px] font-bold px-2 py-1 rounded border border-red-100 flex items-center uppercase tracking-wider`}>
            <Shield className={`w-3 h-3 mr-1`} /> Administración
          </span>
        );
      case UserRole.SUPERVISOR:
        return (
          <span className={`bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-1 rounded border border-amber-200 flex items-center uppercase tracking-wider`}>
            <HardHat className={`w-3 h-3 mr-1`} /> Supervisión
          </span>
        );
      default:
        return (
          <span className={`bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-1 rounded border border-blue-200 flex items-center uppercase tracking-wider`}>
            <UserIcon className={`w-3 h-3 mr-1`} /> Agente Operativo
          </span>
        );
    }
  };

  const getRoleColor = (role: UserRole) => {
     switch(role) {
       case UserRole.ADMIN: return 'from-dcRed to-dcDarkRed';
       case UserRole.SUPERVISOR: return 'from-amber-400 to-amber-600';
       default: return 'from-blue-500 to-blue-700';
     }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
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
      <div className={`flex justify-between items-center`}>
        <div>
          <h2 className={`text-2xl font-bold text-gray-900`}>Personal Operativo</h2>
          <p className={`text-gray-600 text-sm font-medium`}>Nómina oficial y gestión de credenciales</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className={`bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl shadow flex items-center transition-colors font-bold`}
        >
          <UserPlus className={`w-5 h-5 mr-2`} />
          Invitar Agente
        </button>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}>
        {users.map(user => (
          <div key={user.id} className={`bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden hover:shadow-md transition-shadow relative`}>
             <div className={`h-2 w-full bg-gradient-to-r ${getRoleColor(user.role)}`}></div>
             
             <div className={`p-5 flex items-start space-x-4`}>
                <div className={`w-14 h-14 rounded-lg shadow-md bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center flex-shrink-0 text-white`}>
                   <span className={`font-bold text-lg tracking-widest font-mono`}>{getInitials(user.name)}</span>
                </div>

                <div className={`flex-1 min-w-0`}>
                  <h3 className={`text-lg font-bold text-gray-900 truncate leading-tight`}>{user.name}</h3>
                  <div className={`text-xs text-gray-500 font-mono mb-2 flex items-center font-bold`}>
                     ID: {user.id.substring(0,6).toUpperCase()}
                  </div>
                  {getRoleBadge(user.role)}
                  <p className={`text-xs text-gray-600 mt-2 truncate font-medium`}>{user.email}</p>
                </div>
             </div>

             <div className={`absolute -bottom-4 -right-4 opacity-[0.03] text-gray-900 pointer-events-none`}>
                <Fingerprint className={`w-24 h-24`} />
             </div>

            {user.id !== currentUser.id && (
              <div className={`absolute top-3 right-3 z-50`}>
                  <button 
                    onClick={(e) => handleDeleteClick(user.id, e)}
                    className={`bg-white text-gray-400 hover:text-red-600 p-2 rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm active:scale-95 cursor-pointer z-50`}
                    title="Eliminar usuario"
                  >
                    <Trash2 className={`w-4 h-4`} />
                  </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* INVITE USER INFO MODAL */}
      {isModalOpen && (
        <div className={`fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm`}>
          <div className={`bg-white rounded-[2rem] w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 relative z-50 border border-gray-200 p-6`}>
            <div className={`flex justify-between items-center mb-4`}>
                 <h3 className={`text-xl font-bold text-gray-900`}>Alta de Personal</h3>
                 <button onClick={() => setIsModalOpen(false)} className={`text-gray-500 hover:text-gray-700 bg-gray-100 p-2 rounded-full`}>
                    <X className={`w-5 h-5`} />
                 </button>
            </div>
            
            <div className={`space-y-4`}>
               <div className={`bg-blue-50 border border-blue-200 rounded-xl p-4`}>
                  <p className={`text-sm text-blue-900 font-medium`}>
                    Para agregar un nuevo agente, pídale que se registre en la pantalla de inicio o comparta el enlace de la aplicación.
                  </p>
               </div>
               
               <p className={`text-sm text-gray-600`}>
                  Una vez registrados, aparecerán en esta lista con el rol de <strong>Agente Operativo (USER)</strong> por defecto.
               </p>

               <p className={`text-sm text-gray-600`}>
                 Para cambiar permisos (Administrador/Supervisor), debe editar el campo "Role" directamente en la tabla de <strong>Base de Datos</strong> de Supabase por seguridad.
               </p>
               
               <button 
                  onClick={() => setIsModalOpen(false)}
                  className={`w-full bg-gray-900 text-white font-bold py-3 rounded-xl mt-4`}
               >
                  Entendido
               </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {userToDelete && (
        <div className={`fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in`}>
           <div className={`bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-6 text-center border border-gray-200`}>
              <div className={`w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <AlertTriangle className={`w-8 h-8 text-red-700`} />
              </div>
              <h3 className={`text-xl font-bold text-gray-900 mb-2`}>¿Eliminar Usuario?</h3>
              <p className={`text-sm text-gray-700 mb-6 font-medium`}>Esta acción eliminará el perfil del agente de la lista visible.</p>
              <div className={`flex gap-3`}>
                 <button onClick={() => setUserToDelete(null)} className={`flex-1 py-3 bg-gray-100 text-gray-800 font-bold rounded-2xl border border-gray-300 hover:bg-gray-200`}>Cancelar</button>
                 <button onClick={confirmDeleteUser} className={`flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl shadow-lg hover:bg-red-700`}>Eliminar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
