
import React from 'react';
import { UserMenu } from '../Auth/UserMenu';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              ProLoadCalc.com
            </h1>
          </div>
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
