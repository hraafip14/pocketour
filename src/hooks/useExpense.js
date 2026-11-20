import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useProfile } from '../contexts/ProfileContext';

const DEFAULT_POCKETS = [
  { name: 'Kebutuhan', percentage: 50 },
  { name: 'Jajan', percentage: 30 },
  { name: 'Investasi', percentage: 20 },
];

export function useExpense(salaryList = []) {
  const { activeProfile, isEditor } = useProfile();
  const [expenseData, setExpenseData] = useState({});
  const [loading, setLoading] = useState(true);

  // Inisialisasi 3 kantong default di Supabase jika salary belum punya kantong
  const ensurePocketsForSalaries = async (salaries, existingPockets) => {
    if (!isEditor || !salaries || !salaries.length) return existingPockets;

    const grouped = { ...existingPockets };

    for (const sal of salaries) {
      if (!grouped[sal.id] || grouped[sal.id].length === 0) {
        try {
          const { data: created, error } = await supabase
            .from('pockets')
            .insert(
              DEFAULT_POCKETS.map((dp) => ({
                salary_id: sal.id,
                name: dp.name,
                percentage: dp.percentage,
              }))
            )
            .select(`
              id, salary_id, name, percentage,
              expenses ( id, pocket_id, label, amount, date )
            `);

          if (!error && created) {
            grouped[sal.id] = created;
          }
        } catch (err) {
          console.warn('Gagal membuat kantong di Supabase:', err);
        }
      }
    }

    return grouped;
  };

  // Fetch data kantong & pengeluaran langsung dari Supabase
  const fetchExpenses = useCallback(async () => {
    if (!activeProfile || !salaryList.length) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const salaryIds = salaryList.map((s) => s.id);

      const { data: dbPockets, error: pErr } = await supabase
        .from('pockets')
        .select(`
          id, salary_id, name, percentage,
          expenses ( id, pocket_id, label, amount, date )
        `)
        .in('salary_id', salaryIds);

      if (pErr) {
        console.error('Supabase fetch pockets error:', pErr);
        throw new Error(pErr.message);
      }

      // Kelompokkan per salary_id
      let grouped = {};
      (dbPockets || []).forEach((pkt) => {
        if (!grouped[pkt.salary_id]) grouped[pkt.salary_id] = [];
        grouped[pkt.salary_id].push(pkt);
      });

      // Pastikan semua salary punya 3 kantong
      grouped = await ensurePocketsForSalaries(salaryList, grouped);
      setExpenseData(grouped);
    } catch (err) {
      console.error('Fetch expenses gagal:', err);
    } finally {
      setLoading(false);
    }
  }, [activeProfile, salaryList, isEditor]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Update persentase kantong langsung di Supabase
  const updatePocketPercentages = async (salaryId, updatedPockets) => {
    if (!isEditor) throw new Error('Hanya Editor yang dapat mengubah persentase kantong.');

    const totalPercentage = updatedPockets.reduce(
      (sum, p) => sum + (Number(p.percentage) || 0),
      0
    );

    if (Math.round(totalPercentage) !== 100) {
      throw new Error(`Total persentase harus tepat 100%. Saat ini: ${totalPercentage}%`);
    }

    for (const pkt of updatedPockets) {
      const { error } = await supabase
        .from('pockets')
        .update({
          percentage: Number(pkt.percentage),
          updated_at: new Date().toISOString(),
        })
        .eq('id', pkt.id);

      if (error) {
        throw new Error(`Gagal mengubah persentase di Supabase: ${error.message}`);
      }
    }

    setExpenseData((prev) => {
      const next = {
        ...prev,
        [salaryId]: prev[salaryId]?.map((oldPkt) => {
          const found = updatedPockets.find((p) => p.name === oldPkt.name);
          return found ? { ...oldPkt, percentage: Number(found.percentage) } : oldPkt;
        }) || updatedPockets,
      };
      return next;
    });
  };

  // Tambah transaksi pengeluaran langsung di Supabase
  const addExpense = async (salaryId, pocketId, label, amount, date) => {
    if (!isEditor) throw new Error('Hanya Editor yang dapat menambah pengeluaran.');

    const cleanLabel = label.trim();
    const cleanAmount = Number(amount) || 0;
    const cleanDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        pocket_id: pocketId,
        label: cleanLabel,
        amount: cleanAmount,
        date: cleanDate,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Gagal mencatat pengeluaran di Supabase: ${error?.message || 'Unknown error'}`);
    }

    setExpenseData((prev) => {
      const salaryPockets = prev[salaryId] || [];
      const nextPockets = salaryPockets.map((pkt) => {
        if (pkt.id === pocketId) {
          return {
            ...pkt,
            expenses: [data, ...(pkt.expenses || [])],
          };
        }
        return pkt;
      });

      return { ...prev, [salaryId]: nextPockets };
    });

    return data;
  };

  // Hapus transaksi pengeluaran langsung di Supabase
  const deleteExpense = async (salaryId, pocketId, expenseId) => {
    if (!isEditor) throw new Error('Hanya Editor yang dapat menghapus pengeluaran.');

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      throw new Error(`Gagal menghapus pengeluaran di Supabase: ${error.message}`);
    }

    setExpenseData((prev) => {
      const salaryPockets = prev[salaryId] || [];
      const nextPockets = salaryPockets.map((pkt) => {
        if (pkt.id === pocketId) {
          return {
            ...pkt,
            expenses: (pkt.expenses || []).filter((exp) => exp.id !== expenseId),
          };
        }
        return pkt;
      });

      return { ...prev, [salaryId]: nextPockets };
    });
  };

  return {
    expenseData,
    loading,
    refreshExpenses: fetchExpenses,
    updatePocketPercentages,
    addExpense,
    deleteExpense,
  };
}
