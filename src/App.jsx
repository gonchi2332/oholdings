import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Hero from './components/Hero';
import ChartSlideshow from './components/ChartSlideshow';
import Testimonials from './components/Testimonials';
import AutomationWorkflow from './components/AutomationWorkflow';
import About from './components/About';
import AppointmentForm from './components/AppointmentForm';
import AppointmentList from './components/AppointmentList';
import CalendarView from './components/CalendarView';
import AdminDashboard from './components/AdminDashboard';
import { useAuth } from './context/AuthContext';
import { adminService } from './services/admin';

function App() {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'admin'

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setUserRole(null);
        setLoading(false);
        return;
      }
      try {
        const role = await adminService.getUserRole();
        setUserRole(role);
      } catch (error) {
        console.error('Error checking role:', error);
        setUserRole('user');
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

  // Show admin dashboard if user is admin or employee
  const isAdminOrEmployee = userRole === 'admin' || userRole === 'employee';
  
  // Check if user wants to view admin dashboard (can be toggled)
  if (isAdminOrEmployee && currentView === 'admin') {
    return (
      <Layout>
        <div className="mb-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <button
            onClick={() => setCurrentView('home')}
            className="text-mineral-green hover:text-mineral-green-dark font-medium"
          >
            ← Volver al inicio
          </button>
        </div>
        <AdminDashboard />
      </Layout>
    );
  }

  return (
    <Layout>
      {isAdminOrEmployee && (
        <div className="bg-mineral-green text-white py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <span className="text-sm">
              {userRole === 'admin' ? 'Panel de Administración disponible' : 'Vista de Empleado disponible'}
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
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Manage Appointments</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Schedule, view, and manage your consultations.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
              {/* Form Section */}
              <div className="lg:col-span-4">
                <AppointmentForm 
                  onSuccess={() => setRefreshTrigger(prev => prev + 1)} 
                  onSpecialistChange={(employeeId) => setSelectedEmployeeId(employeeId)}
                />
              </div>

              {/* Calendar Section */}
              <div className="lg:col-span-8">
                <CalendarView refreshTrigger={refreshTrigger} selectedEmployeeId={selectedEmployeeId} />
              </div>
            </div>

            {/* Appointments List Section */}
            <div className="border-t border-gray-200 pt-16">
              <AppointmentList refreshTrigger={refreshTrigger} onRefresh={() => setRefreshTrigger(prev => prev + 1)} />
            </div>
          </div>
        </section>
      )}

      <ChartSlideshow />
      <AutomationWorkflow />
      <Testimonials />
      <About />
    </Layout>
  )
}

export default App;
