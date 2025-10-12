'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Users, PiggyBank } from 'lucide-react';

interface SummaryCardsProps {
  totalRevenue: number;
  parkingRevenue: number;
  carwashRevenue: number;
  totalCommissions: number;
  netProfit: number;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalRevenue,
  parkingRevenue,
  carwashRevenue,
  totalCommissions,
  netProfit
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const cards = [
    {
      title: 'Ingresos Totales',
      value: totalRevenue,
      icon: DollarSign,
      gradient: 'from-blue-600 to-blue-800',
      iconBg: 'bg-blue-500/20'
    },
    {
      title: 'Parqueadero',
      value: parkingRevenue,
      icon: TrendingUp,
      gradient: 'from-purple-600 to-purple-800',
      iconBg: 'bg-purple-500/20'
    },
    {
      title: 'Lavadero',
      value: carwashRevenue,
      icon: DollarSign,
      gradient: 'from-indigo-600 to-indigo-800',
      iconBg: 'bg-indigo-500/20'
    },
    {
      title: 'Comisiones Trabajadores',
      value: totalCommissions,
      icon: Users,
      gradient: 'from-orange-600 to-orange-800',
      iconBg: 'bg-orange-500/20'
    },
    {
      title: 'Ganancia Neta',
      value: netProfit,
      icon: PiggyBank,
      gradient: 'from-green-600 to-green-800',
      iconBg: 'bg-green-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.05 }}
          className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-6 text-white shadow-2xl border border-white/10`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`${card.iconBg} p-3 rounded-xl`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div className="text-xs text-white/70 uppercase tracking-wider">
              {card.title === 'Ganancia Neta' ? '💰' : '📊'}
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-white/80">{card.title}</h3>
            <p className="text-2xl font-bold">{formatCurrency(card.value)}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SummaryCards;
