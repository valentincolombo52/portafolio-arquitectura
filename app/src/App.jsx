import React, { useEffect } from 'react';
import { usePortfolioStore } from './store/usePortfolioStore';
import BentoPortfolio from './components/BentoPortfolio';
import projectsData from './data/projects.json';

export default function App() {
  const loadElements = usePortfolioStore((state) => state.loadElements);

  useEffect(() => {
    if (projectsData && projectsData.length > 0) {
      loadElements(projectsData);
    }
  }, [loadElements]);

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#090d16' }}>
      <BentoPortfolio />
    </div>
  );
}