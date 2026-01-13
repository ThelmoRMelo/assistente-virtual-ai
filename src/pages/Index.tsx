import { useApp } from '@/contexts/AppContext';
import Onboarding from './Onboarding';
import Home from './Home';

const Index = () => {
  const { isOnboarded } = useApp();

  if (!isOnboarded) {
    return <Onboarding />;
  }

  return <Home />;
};

export default Index;
