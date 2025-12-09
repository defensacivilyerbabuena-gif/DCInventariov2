
import React, { useState, useEffect } from 'react';
import { User, UserRole, ViewState } from './types';
import { supabase } from './integrations/supabase/client';
import { 
  Shield, 
  Menu, 
  Package, 
  ClipboardList, 
  Bot, 
  LogOut, 
  User as UserIcon,
  Plus,
  Users
} from 'lucide-react';
import { Login } from './pages/Login';
import { InventoryScreen } from './components/InventoryScreen';
import { RequestsScreen } from './components/RequestsScreen';
import { AIAssistantScreen } from './components/AIAssistantScreen';
import { UserManagementScreen } from './components/UserManagementScreen';
import { DYCLogo } from './components/DYCLogo';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('LOGIN');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inventoryHash, setInventoryHash] = useState(0); // Used to trigger refreshes
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Initialize view based on auth
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setLoading(false);
        setCurrentView('LOGIN');
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
        setCurrentView('LOGIN');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email: string | undefined) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Fallback user if profile missing (should be handled by trigger, but just in case)
        setUser({
          id: userId,
          email: email || '',
          name: email?.split('@')[0] || 'Usuario',
          role: UserRole.USER,
        });
      } else if (data) {
        setUser({
          id: data.id,
          email: data.email || email || '',
          name: data.full_name || email?.split('@')[0] || 'Usuario',
          role: (data.role as UserRole) || UserRole.USER,
          avatar: data.avatar_url
        });
      }
      setCurrentView('INVENTORY');
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentView('LOGIN');
    setSession(null);
  };

  const handleDemoLogin = (demoUser: User) => {
    setUser(demoUser);
    setSession({ user: { id: demoUser.id, email: demoUser.email } }); // Fake session
    setCurrentView('INVENTORY');
  };

  const refreshData = () => {
    setInventoryHash(prev => prev + 1);
  };

  const getUserRoleLabel = (role?: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'Administrador';
      case UserRole.SUPERVISOR: return 'Supervisor';
      default: return 'Agente Operativo';
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-100 flex items-center justify-center`}>
         <div className={`flex flex-col items-center animate-pulse`}>
            <DYCLogo className={`w-16 h-16 mb-4 opacity-50`} />
            <p className={`text-gray-500 font-bold`}>Cargando sistema...</p>
         </div>
      </div>
    );
  }

  if (!user) {
    return <Login onDemoLogin={handleDemoLogin} />;
  }

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsSidebarOpen(false); // Close mobile sidebar on navigate
      }}
      className={`flex items-center w-full px-4 py-3 mb-1 text-sm font-medium transition-colors rounded-lg ${
        currentView === view
          ? 'bg-dcRed text-white shadow-md'
          : 'text-gray-600 hover:bg-gray-100 hover:text-dcRed'
      }`}
    >
      <Icon className={`w-5 h-5 mr-3`} />
      {label}
    </button>
  );

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col md:flex-row relative overflow-hidden`}>
      
      {/* BACKGROUND LOGO WATERMARK */}
      <div className={`fixed inset-0 z-0 flex items-center justify-center pointer-events-none opacity-[0.03]`}>
        <DYCLogo className={`w-[800px] h-[800px] grayscale`} />
      </div>

      {/* Mobile Header */}
      <div className={`md:hidden bg-dcRed text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-20`}>
        <div className={`flex items-center space-x-3 bg-gray-900/20 px-3 py-1 rounded-lg backdrop-blur-sm`}>
          {/* Logo en móvil usando componente SVG */}
          <DYCLogo className={`w-8 h-8`} />
          <div className={`flex flex-col`}>
            <span className={`font-bold text-sm leading-tight`}>Defensa Civil</span>
            <span className={`text-[10px] text-gray-200`}>Yerba Buena</span>
          </div>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <Menu className={`w-6 h-6`} />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition duration-200 ease-in-out z-30 w-64 bg-white shadow-xl flex flex-col`}
      >
        {/* Sidebar Header con Fondo Gris Translúcido */}
        <div className={`p-6 border-b border-gray-100 hidden md:flex flex-col items-center bg-gray-50`}>
          <div className={`bg-gray-200/50 backdrop-blur-md p-4 rounded-xl mb-3 border border-gray-200 w-full flex justify-center shadow-inner relative`}>
             {/* LOGO PRINCIPAL SVG */}
             <DYCLogo className={`w-24 h-24 drop-shadow-sm`} />
             <div className={`absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse`} title="Sistema Online"></div>
          </div>
          <div className={`text-center`}>
            <h1 className={`text-gray-800 font-bold text-lg leading-tight`}>Defensa Civil</h1>
            <p className={`text-dcRed text-sm font-medium`}>Municipalidad de Yerba Buena</p>
          </div>
        </div>

        <div className={`p-4 flex-1`}>
          <div className={`mb-6 px-4 py-3 bg-red-50 rounded-lg border border-red-100 flex items-center space-x-3`}>
             <div className={`bg-dcRed rounded-full p-1 shadow-sm`}>
                <UserIcon className={`w-4 h-4 text-white`} />
             </div>
             <div>
               <p className={`text-sm font-bold text-gray-800 leading-none mb-1`}>{user?.name}</p>
               <p className={`text-xs text-dcRed font-medium uppercase tracking-wide`}>{getUserRoleLabel(user?.role)}</p>
             </div>
          </div>

          <nav>
            <NavItem view="INVENTORY" icon={Package} label="Inventario" />
            <NavItem view="REQUESTS" icon={ClipboardList} label="Solicitudes" />
            {user?.role === UserRole.ADMIN && (
              <NavItem view="USERS" icon={Users} label="Equipo" />
            )}
            <NavItem view="AI_ASSISTANT" icon={Bot} label="Asistente IA" />
          </nav>
        </div>

        <div className={`p-4 border-t border-gray-100`}>
          <button
            onClick={handleLogout}
            className={`flex items-center w-full px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors`}
          >
            <LogOut className={`w-5 h-5 mr-3`} />
            Cerrar Sesión
          </button>
          <div className={`mt-4 text-center`}>
             <p className={`text-[10px] text-gray-300 font-medium`}>v2.0.0 - Supabase Connected</p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 overflow-y-auto h-screen p-4 md:p-8 relative z-10`}>
        <div className={`max-w-6xl mx-auto`}>
          {currentView === 'INVENTORY' && <InventoryScreen user={user!} onRefresh={refreshData} key={inventoryHash} />}
          {currentView === 'REQUESTS' && <RequestsScreen user={user!} onRefresh={refreshData} key={inventoryHash} />}
          {currentView === 'USERS' && user?.role === UserRole.ADMIN && <UserManagementScreen currentUser={user} />}
          {currentView === 'AI_ASSISTANT' && <AIAssistantScreen />}
        </div>
      </main>
    </div>
  );
};

export default App;
