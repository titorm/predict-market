'use client';

import React from 'react';

export interface TopNavAndCommandPillProps {
  activeTab?: 'forecast' | 'stores' | 'receipts';
  onTabChange?: (tab: 'forecast' | 'stores' | 'receipts') => void;
  baseBasketLabel?: string;
  targetMonthLabel?: string;
  transitPenaltyLabel?: string;
  onOpenScanner?: () => void;
  showPill?: boolean;
}

export const TopNavAndCommandPill: React.FC<TopNavAndCommandPillProps> = () => {
  return null;
};
