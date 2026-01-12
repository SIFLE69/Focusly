import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import dbService from './services/database';
import Onboarding from './components/Onboarding';
import Workspace from './components/Workspace';
import { useModal } from './context/ModalContext';
import './App.css';

import { LoaderOne } from './components/ui/loader';

function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useModal();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await dbService.init();
      setIsDbReady(true);

      const workspaces = await dbService.getAll('workspaces');

      if (workspaces && workspaces.length > 0) {
        setCurrentWorkspace(workspaces[0].id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      showAlert('System Error', 'Failed to initialize application. Please refresh the page.', 'error');
      setLoading(false);
    }
  };

  const handleOnboardingComplete = (workspaceId) => {
    setCurrentWorkspace(workspaceId);
  };

  if (loading) {
    return <LoaderOne />;
  }

  if (!isDbReady) {
    return (
      <div className="app-error">
        <Zap size={48} className="text-error" />
        <h2>Failed to initialize</h2>
        <p className="text-secondary">Please refresh the page and try again.</p>
      </div>
    );
  }

  if (!currentWorkspace) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return <Workspace workspaceId={currentWorkspace} />;
}

export default App;
