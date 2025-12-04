import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Hero from './components/Hero';
import Projects from './components/Projects';
import AutomationWorkflow from './components/AutomationWorkflow';
import About from './components/About';
import CalendlyView from './components/CalendlyView';
import AdminDashboard from './components/AdminDashboard';
import { useAuth } from './context/AuthContext';
import { adminService } from './services/admin';

function App() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'admin'

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setUserRole(null);
        setCurrentView('home');
        setLoading(false);
        return;
      }
      try {
        const role = await adminService.getUserRole();
        setUserRole(role);
        
        // Auto-redirect admin to admin dashboard
        if (role === 'admin') {
          setCurrentView('admin');
        } else {
          setCurrentView('home');
        }
      } catch (error) {
        console.error('Error checking role:', error);
        setUserRole('user');
        setCurrentView('home');
      } finally {
        setLoading(false);
      }
    };
    checkRole();
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mineral-green"></div>
        </div>
      </Layout>
    );
  }

  // Check if user wants to view admin dashboard (only admins)
  if (userRole === 'admin' && currentView === 'admin') {
    return (
      <Layout>
        <AdminDashboard />
      </Layout>
    );
  }

  return (
    <Layout>
      {userRole === 'admin' && (
        <div className="bg-mineral-green text-white py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <span className="text-sm">
              Panel de Administración disponible
            </span>
            <button
              onClick={() => setCurrentView('admin')}
              className="text-sm underline hover:no-underline"
            >
              Ir al Panel de Administración →
            </button>
          </div>
        </div>
      )}

      <Hero />

      {user && (
        <section className="py-20 bg-gray-50" id="appointments">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Agendar Consulta</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Selecciona una fecha y hora para tu consulta.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <CalendlyView />
            </div>
          </div>
        </section>
      )}

      <AutomationWorkflow />
      <Projects />
      <About />
    </Layout>
  )
}

export default App;
