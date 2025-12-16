import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Calculator from './pages/Calculator';
import { useAuth } from './context/AuthContext';

function App() {
  const { isAuthenticated } = useAuth();

  // If not authenticated, show message to access via Discourse
  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        padding: '20px',
        background: '#09090b',
        color: '#fff'
      }}>
        <h1 style={{ marginBottom: '16px' }}>Pepplanner</h1>
        <p style={{ color: '#a1a1aa' }}>
          Please access this application through Discourse to authenticate.
        </p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* All routes wrapped in Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="calculator" element={<Calculator />} />
        </Route>

        {/* Redirect any unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
