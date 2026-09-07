import React from 'react';
import { StaffManager } from './StaffManager';
import { Business } from '../../types';

interface WaitersManagerProps {
  business: Business;
}

export const WaitersManager: React.FC<WaitersManagerProps> = ({ business }) => {
  return <StaffManager business={business} />;
};

export { StaffManager };
