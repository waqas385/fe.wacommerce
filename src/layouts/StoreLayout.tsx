import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';

const StoreLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default StoreLayout;
