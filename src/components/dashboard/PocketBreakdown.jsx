import React from 'react';
import styles from './PocketBreakdown.module.css';
import { formatRupiah } from '../../utils/formatters';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { ShoppingBag, Coffee, TrendingUp } from 'lucide-react';

const POCKET_ICONS = {
  Kebutuhan: ShoppingBag,
  Jajan: Coffee,
  Investasi: TrendingUp,
};

// Subtle harmonious colors (Anti AI-slop: clean, soft, distinct)
const POCKET_COLORS = {
  Kebutuhan: '#00D2FF',
  Jajan: '#C94472',
  Investasi: '#22945B',
};

export default function PocketBreakdown({
  pockets = [],
  totalSalary,
}) {
  const chartData = pockets.map((pkt) => {
    const limit = Math.round(((Number(pkt.percentage) || 0) / 100) * totalSalary);
    const spent = (pkt.expenses || []).reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0
    );
    const remaining = Math.max(0, limit - spent);

    return {
      name: pkt.name,
      limit,
      terpakai: spent,
      sisa: remaining,
      percentage: pkt.percentage,
    };
  });

  return (
    <div className={styles.container}>
      <div className={styles.chartSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Visualisasi Batas vs Terpakai</h3>
          <span className={styles.sectionSub}>Komparasi nominal alokasi dan pengeluaran aktual</span>
        </div>

        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} />
              <YAxis
                stroke="var(--color-text-secondary)"
                fontSize={11}
                tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`}
                tickLine={false}
              />
              <Tooltip
                formatter={(val) => [formatRupiah(val)]}
                contentStyle={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  color: 'var(--color-text-primary)',
                  boxShadow: 'var(--shadow-md)',
                }}
                itemStyle={{
                  color: 'var(--color-text-primary)',
                }}
                labelStyle={{
                  color: 'var(--color-text-primary)',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  paddingTop: '12px',
                  color: 'var(--color-text-primary)',
                }}
                formatter={(value) => (
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 600, marginRight: 8 }}>
                    {value}
                  </span>
                )}
              />
              <Bar dataKey="limit" name="Batas Anggaran" fill="var(--color-border)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="terpakai" name="Aktual Terpakai" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={POCKET_COLORS[entry.name] || 'var(--color-accent)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.cardsSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Rincian Kantong</h3>
          <span className={styles.sectionSub}>Status sisa saldo per kantong</span>
        </div>

        <div className={styles.pocketCardsList}>
          {pockets.map((pkt) => {
            const Icon = POCKET_ICONS[pkt.name] || ShoppingBag;
            const limit = Math.round(((Number(pkt.percentage) || 0) / 100) * totalSalary);
            const spent = (pkt.expenses || []).reduce(
              (sum, e) => sum + (Number(e.amount) || 0),
              0
            );
            const remaining = limit - spent;
            const isOverbudget = remaining < 0;

            return (
              <div key={pkt.name} className={styles.pocketItemCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.pocketMeta}>
                    <div className={styles.iconBox}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className={styles.pocketName}>{pkt.name}</div>
                      <div className={styles.pocketRatio}>
                        Alokasi: <span className={styles.ratioHighlight}>{pkt.percentage}%</span> · Batas: <span className={styles.limitHighlight}>{formatRupiah(limit)}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`${styles.remainingBadge} ${isOverbudget ? styles.badgeOver : styles.badgeNormal}`}>
                    {isOverbudget ? 'Lebih ' : 'Sisa '}
                    {formatRupiah(Math.abs(remaining))}
                  </div>
                </div>

                <div className={styles.progressRow}>
                  <div className={styles.progressTrack}>
                    <div
                      className={`${styles.progressBar} ${isOverbudget ? styles.barOver : ''}`}
                      style={{
                        width: `${Math.min(100, limit > 0 ? (spent / limit) * 100 : 0)}%`,
                        backgroundColor: isOverbudget
                          ? 'var(--color-danger)'
                          : POCKET_COLORS[pkt.name] || 'var(--color-accent)',
                      }}
                    />
                  </div>
                  <div className={styles.comparisonRow}>
                    <span className={styles.spentLabel}>
                      Aktual Terpakai: <strong className={isOverbudget ? styles.spentOver : styles.spentValue}>{formatRupiah(spent)}</strong>
                    </span>
                    <span className={styles.percentText}>
                      {limit > 0 ? Math.round((spent / limit) * 100) : 0}% terpakai
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
