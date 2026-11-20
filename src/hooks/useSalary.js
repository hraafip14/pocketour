import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useProfile } from '../contexts/ProfileContext';

export function useSalary() {
  const { activeProfile, isEditor } = useProfile();
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inisialisasi otomatis jika di Supabase belum ada data salary untuk profil ini
  const initSupabaseSalaryIfNeeded = async (profileId, profileEmail) => {
    try {
      const isHasby = profileEmail?.toLowerCase().includes('hasajalah');
      const baseSalary = isHasby ? 8000000 : 7500000;

      // 1. Insert salary November 2026
      const { data: newSal, error: salErr } = await supabase
        .from('salaries')
        .insert({
          profile_id: profileId,
          month: 11,
          year: 2026,
          base_salary: baseSalary,
        })
        .select()
        .single();

      if (salErr || !newSal) return null;

      // 2. Insert 3 kantong default
      await supabase.from('pockets').insert([
        { salary_id: newSal.id, name: 'Kebutuhan', percentage: 50 },
        { salary_id: newSal.id, name: 'Jajan', percentage: 30 },
        { salary_id: newSal.id, name: 'Investasi', percentage: 20 },
      ]);

      // 3. Insert insentif default
      if (isHasby) {
        await supabase.from('incentives').insert([
          { salary_id: newSal.id, label: 'Tunjangan Transport', amount: 750000 },
          { salary_id: newSal.id, label: 'Bonus Performa', amount: 1250000 },
        ]);
      } else {
        await supabase.from('incentives').insert([
          { salary_id: newSal.id, label: 'Tunjangan Makan', amount: 600000 },
        ]);
      }

      return newSal;
    } catch (err) {
      console.warn('Gagal menginisialisasi salary di Supabase:', err);
      return null;
    }
  };

  // Cek dan buat otomatis bulan baru pada tanggal 1
  const checkAutoCreateNextMonth = async (currentSalaries) => {
    if (!currentSalaries || !currentSalaries.length || !isEditor || !activeProfile) {
      return currentSalaries;
    }

    const sorted = [...currentSalaries].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    const latest = sorted[0];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    let nextMonth = latest.month + 1;
    let nextYear = latest.year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    const isNowPastNextMonthFirst =
      currentYear > nextYear || (currentYear === nextYear && currentMonth >= nextMonth);

    const alreadyExists = currentSalaries.some(
      (s) => s.month === nextMonth && s.year === nextYear
    );

    if (isNowPastNextMonthFirst && !alreadyExists) {
      try {
        const { data: created, error } = await supabase
          .from('salaries')
          .insert({
            profile_id: activeProfile.id,
            month: nextMonth,
            year: nextYear,
            base_salary: latest.base_salary,
          })
          .select()
          .single();

        if (!error && created) {
          // Buat 3 kantong default
          await supabase.from('pockets').insert([
            { salary_id: created.id, name: 'Kebutuhan', percentage: 50 },
            { salary_id: created.id, name: 'Jajan', percentage: 30 },
            { salary_id: created.id, name: 'Investasi', percentage: 20 },
          ]);

          return [created, ...currentSalaries];
        }
      } catch (err) {
        console.warn('Gagal auto-create bulan baru di Supabase:', err);
      }
    }

    return currentSalaries;
  };

  // Fetch seluruh data salary dari Supabase
  const fetchSalaries = useCallback(async () => {
    if (!activeProfile) return;
    setLoading(true);

    try {
      let dbSalaries = null;
      let salErr = null;

      const res = await supabase
        .from('salaries')
        .select(`
          id, profile_id, month, year, base_salary, payday_date,
          incentives ( id, label, amount )
        `)
        .eq('profile_id', activeProfile.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (res.error && (res.error.message?.includes('payday_date') || res.error.code === '42703')) {
        // Fallback jika kolom payday_date belum ada di database Supabase
        const fallbackRes = await supabase
          .from('salaries')
          .select(`
            id, profile_id, month, year, base_salary,
            incentives ( id, label, amount )
          `)
          .eq('profile_id', activeProfile.id)
          .order('year', { ascending: false })
          .order('month', { ascending: false });

        dbSalaries = (fallbackRes.data || []).map((s) => ({ ...s, payday_date: null }));
        salErr = fallbackRes.error;
      } else {
        dbSalaries = res.data;
        salErr = res.error;
      }

      if (salErr) {
        console.error('Supabase query error:', salErr);
        throw new Error(salErr.message);
      }

      // Jika data belum ada dan user adalah editor profil ini, buatkan data awal di Supabase
      if ((!dbSalaries || dbSalaries.length === 0) && isEditor) {
        const created = await initSupabaseSalaryIfNeeded(activeProfile.id, activeProfile.email);
        if (created) {
          // Fetch ulang setelah data terbuat
          const { data: reFetched } = await supabase
            .from('salaries')
            .select(`
              id, profile_id, month, year, base_salary,
              incentives ( id, label, amount )
            `)
            .eq('profile_id', activeProfile.id)
            .order('year', { ascending: false })
            .order('month', { ascending: false });

          setSalaries(reFetched || [created]);
          setLoading(false);
          return;
        }
      }

      const checked = await checkAutoCreateNextMonth(dbSalaries || []);
      setSalaries(checked);
    } catch (err) {
      console.error('Fetch salaries gagal:', err);
    } finally {
      setLoading(false);
    }
  }, [activeProfile, isEditor]);

  useEffect(() => {
    fetchSalaries();
  }, [fetchSalaries]);

  // Update Gaji Pokok langsung di Supabase
  const updateBaseSalary = async (salaryId, newAmount) => {
    if (!isEditor) throw new Error('Hanya Editor yang dapat mengubah gaji.');
    const parsed = Number(newAmount) || 0;

    const { error } = await supabase
      .from('salaries')
      .update({ base_salary: parsed, updated_at: new Date().toISOString() })
      .eq('id', salaryId);

    if (error) {
      throw new Error(`Gagal memperbarui gaji di Supabase: ${error.message}`);
    }

    setSalaries((prev) =>
      prev.map((s) => (s.id === salaryId ? { ...s, base_salary: parsed } : s))
    );
  };

  // Update Tanggal Gajian langsung di Supabase
  const updatePaydayDate = async (salaryId, newDate) => {
    if (!isEditor) throw new Error('Hanya Editor yang dapat mengubah tanggal gajian.');
    const cleanDate = newDate ? String(newDate).trim() : null;

    const { error } = await supabase
      .from('salaries')
      .update({ payday_date: cleanDate, updated_at: new Date().toISOString() })
      .eq('id', salaryId);

    if (error) {
      if (error.message?.includes('payday_date') || error.code === '42703') {
        throw new Error('Kolom payday_date belum dibuat di Supabase. Silakan jalankan script SQL migrasi di Supabase SQL Editor.');
      }
      throw new Error(`Gagal memperbarui tanggal gajian di Supabase: ${error.message}`);
    }

    setSalaries((prev) =>
      prev.map((s) => (s.id === salaryId ? { ...s, payday_date: cleanDate } : s))
    );
  };

  // Tambah Insentif langsung di Supabase
  const addIncentive = async (salaryId, label, amount) => {
    if (!isEditor) throw new Error('Hanya Editor yang dapat menambah insentif.');

    const cleanLabel = label.trim();
    const cleanAmount = Number(amount) || 0;

    const { data, error } = await supabase
      .from('incentives')
      .insert({
        salary_id: salaryId,
        label: cleanLabel,
        amount: cleanAmount,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Gagal menyimpan insentif ke Supabase: ${error?.message || 'Unknown error'}`);
    }

    setSalaries((prev) =>
      prev.map((s) => {
        if (s.id === salaryId) {
          return {
            ...s,
            incentives: [...(s.incentives || []), data],
          };
        }
        return s;
      })
    );

    return data;
  };

  // Hapus Insentif langsung di Supabase
  const deleteIncentive = async (salaryId, incentiveId) => {
    if (!isEditor) throw new Error('Hanya Editor yang dapat menghapus insentif.');

    const { error } = await supabase
      .from('incentives')
      .delete()
      .eq('id', incentiveId);

    if (error) {
      throw new Error(`Gagal menghapus insentif di Supabase: ${error.message}`);
    }

    setSalaries((prev) =>
      prev.map((s) => {
        if (s.id === salaryId) {
          return {
            ...s,
            incentives: (s.incentives || []).filter((inc) => inc.id !== incentiveId),
          };
        }
        return s;
      })
    );
  };

  // Hitung total gaji suatu kartu
  const calculateTotalSalary = (salary) => {
    if (!salary) return 0;
    const base = Number(salary.base_salary) || 0;
    const incTotal = (salary.incentives || []).reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );
    return base + incTotal;
  };

  return {
    salaries,
    loading,
    refreshSalaries: fetchSalaries,
    updateBaseSalary,
    updatePaydayDate,
    addIncentive,
    deleteIncentive,
    calculateTotalSalary,
  };
}
