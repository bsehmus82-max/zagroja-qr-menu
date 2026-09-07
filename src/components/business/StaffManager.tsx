import React, { useState, useEffect } from 'react';
import { 
  Users, Smartphone, QrCode, Trash2, CheckCircle2, 
  XCircle, Clock, ShieldCheck, RefreshCw, Copy, Check, 
  UserCheck, ShieldAlert, Plus, Edit2, KeyRound, ChefHat,
  UtensilsCrossed, MonitorDot, CreditCard, Layers, Lock, Shield
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { Business, WaiterDevice, StaffMember, StaffRole, StaffPermissions } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';

interface StaffManagerProps {
  business: Business;
}

const DEFAULT_PERMISSIONS: Record<StaffRole, StaffPermissions> = {
  manager: {
    can_take_orders: true,
    can_view_orders: true,
    can_handle_calls: true,
    can_access_pos: true,
    can_access_kitchen: true,
    can_manage_tables: true,
    can_manage_menu: true,
    is_full_access: true,
  },
  waiter: {
    can_take_orders: true,
    can_view_orders: true,
    can_handle_calls: true,
    can_access_pos: false,
    can_access_kitchen: false,
    can_manage_tables: true,
    can_manage_menu: false,
    is_full_access: false,
  },
  kitchen: {
    can_take_orders: false,
    can_view_orders: false,
    can_handle_calls: false,
    can_access_pos: false,
    can_access_kitchen: true,
    can_manage_tables: false,
    can_manage_menu: false,
    is_full_access: false,
  },
  cashier: {
    can_take_orders: true,
    can_view_orders: true,
    can_handle_calls: true,
    can_access_pos: true,
    can_access_kitchen: false,
    can_manage_tables: true,
    can_manage_menu: false,
    is_full_access: false,
  },
  custom: {
    can_take_orders: true,
    can_view_orders: true,
    can_handle_calls: false,
    can_access_pos: false,
    can_access_kitchen: false,
    can_manage_tables: false,
    can_manage_menu: false,
    is_full_access: false,
  },
};

export const StaffManager: React.FC<StaffManagerProps> = ({ business }) => {
  const toast = useToast();
  
  // Staff List State
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Form State for Staff Modal
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState<StaffRole>('waiter');
  const [staffPin, setStaffPin] = useState('');
  const [staffPermissions, setStaffPermissions] = useState<StaffPermissions>(DEFAULT_PERMISSIONS.waiter);

  // Devices State
  const [approvedDevices, setApprovedDevices] = useState<WaiterDevice[]>([]);
  const [pendingDevices, setPendingDevices] = useState<WaiterDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [pairingSecret, setPairingSecret] = useState<string>(business.pairing_secret || '');
  const [isRotatingQr, setIsRotatingQr] = useState(false);
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WaiterDevice | null>(null);
  const [deleteStaffTarget, setDeleteStaffTarget] = useState<StaffMember | null>(null);

  const pairingUrl = `${window.location.origin}/pair-waiter?biz=${business.slug}${pairingSecret ? `&key=${pairingSecret}` : ''}`;

  const loadData = async () => {
    try {
      setLoading(true);
      const [devicesRes, bizRes, waitersRes] = await Promise.all([
        supabase
          .from('waiter_devices')
          .select('*')
          .eq('business_id', business.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('businesses')
          .select('pairing_secret')
          .eq('id', business.id)
          .single(),
        supabase
          .from('waiters')
          .select('*')
          .eq('business_id', business.id)
          .order('created_at', { ascending: false }),
      ]);

      if (bizRes.data?.pairing_secret) setPairingSecret(bizRes.data.pairing_secret);

      const mappedStaff: StaffMember[] = (waitersRes.data || []).map((w: any) => ({
        id: w.id,
        business_id: w.business_id,
        name: w.name,
        role: w.role || 'waiter',
        pin_code: w.pin_code || '123456',
        permissions: w.permissions || DEFAULT_PERMISSIONS[w.role as StaffRole] || DEFAULT_PERMISSIONS.waiter,
        is_active: w.is_active !== false,
        created_at: w.created_at,
      }));

      if (devicesRes.data) {
        const approved = devicesRes.data.filter((d: any) => d.status === 'approved' && d.is_trusted);
        const pending = devicesRes.data.filter((d: any) => d.status === 'pending');
        setApprovedDevices(approved);
        setPendingDevices(pending);

        // Include any approved devices that were paired before a formal waiter record was created
        approved.forEach((d: any) => {
          const dName = (d.waiter_name || d.device_name || 'Personel').trim();
          const exists = mappedStaff.some(
            (s) => s.id === d.staff_id || s.id === d.waiter_id || s.name.toLowerCase() === dName.toLowerCase()
          );
          if (!exists) {
            mappedStaff.push({
              id: d.id,
              business_id: d.business_id,
              name: dName,
              role: 'waiter',
              pin_code: '123456',
              permissions: DEFAULT_PERMISSIONS.waiter,
              is_active: true,
              created_at: d.created_at,
            });
          }
        });

        const initialNames: Record<string, string> = {};
        pending.forEach((d: any) => {
          initialNames[d.id] = d.waiter_name || '';
        });
        setEditingNames(initialNames);
      }

      setStaffList(mappedStaff);
    } catch (e) {
      console.error('Veriler yüklenemedi:', e);
      toast.error('Personel listesi yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel(`staff-devices-live-${business.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'waiter_devices', filter: `business_id=eq.${business.id}` },
        (payload: any) => {
          loadData();
          if (payload.eventType === 'INSERT' && payload.new?.status === 'pending') {
            toast.info(`Yeni Personel Cihaz Talebi: "${payload.new.waiter_name || payload.new.device_name}" onay bekliyor!`);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'waiters', filter: `business_id=eq.${business.id}` },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [business.id]);

  // Open modal for new staff
  const handleOpenAddStaff = () => {
    setEditingStaff(null);
    setStaffName('');
    setStaffRole('waiter');
    setStaffPin(Math.floor(100000 + Math.random() * 900000).toString());
    setStaffPermissions(DEFAULT_PERMISSIONS.waiter);
    setIsStaffModalOpen(true);
  };

  // Open modal for editing staff
  const handleOpenEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setStaffName(staff.name);
    setStaffRole(staff.role);
    setStaffPin(staff.pin_code);
    setStaffPermissions(staff.permissions);
    setIsStaffModalOpen(true);
  };

  // Handle Role preset change
  const handleRoleChange = (newRole: StaffRole) => {
    setStaffRole(newRole);
    setStaffPermissions(DEFAULT_PERMISSIONS[newRole]);
  };

  // Save Staff (Insert / Update)
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) {
      toast.error('Lütfen personel adını girin.');
      return;
    }

    if (!staffPin || staffPin.length !== 6) {
      toast.error('PIN kodu tam olarak 6 haneli olmalıdır.');
      return;
    }

    try {
      if (editingStaff) {
        // Check if record exists in waiters table
        const { data: existingWaiter } = await supabase
          .from('waiters')
          .select('id')
          .eq('id', editingStaff.id)
          .maybeSingle();

        if (existingWaiter) {
          const { error } = await supabase
            .from('waiters')
            .update({
              name: staffName.trim(),
              role: staffRole,
              pin_code: staffPin,
              permissions: staffPermissions,
            })
            .eq('id', editingStaff.id);

          if (error) throw error;
        } else {
          // If editing a staff that originated from a device pairing record
          const { data: insertedWaiter, error } = await supabase
            .from('waiters')
            .insert([
              {
                business_id: business.id,
                name: staffName.trim(),
                pin_hash: staffPin,
                role: staffRole,
                pin_code: staffPin,
                permissions: staffPermissions,
                is_active: true,
              },
            ])
            .select()
            .single();

          if (error) throw error;

          if (insertedWaiter) {
            await supabase
              .from('waiter_devices')
              .update({
                waiter_id: insertedWaiter.id,
                waiter_name: staffName.trim(),
              })
              .eq('id', editingStaff.id);
          }
        }

        toast.success(`"${staffName}" personeli güncellendi.`);
      } else {
        const { error } = await supabase.from('waiters').insert([
          {
            business_id: business.id,
            name: staffName.trim(),
            pin_hash: staffPin,
            role: staffRole,
            pin_code: staffPin,
            permissions: staffPermissions,
            is_active: true,
          },
        ]);

        if (error) throw error;
        toast.success(`"${staffName}" personeli başarıyla eklendi.`);
      }

      setIsStaffModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Personel kaydedilirken hata: ' + err.message);
    }
  };

  // Delete Staff
  const handleDeleteStaff = async () => {
    if (!deleteStaffTarget) return;
    try {
      // Delete from waiters table if exists
      await supabase
        .from('waiters')
        .delete()
        .eq('id', deleteStaffTarget.id);

      // Also revoke any device paired with this staff ID or name
      const paired = approvedDevices.find(
        (d) =>
          d.id === deleteStaffTarget.id ||
          d.staff_id === deleteStaffTarget.id ||
          d.waiter_id === deleteStaffTarget.id ||
          (d.waiter_name && d.waiter_name.trim().toLowerCase() === deleteStaffTarget.name.trim().toLowerCase())
      );

      if (paired) {
        await supabase.rpc('revoke_waiter_device', {
          p_device_id: paired.id,
        });
      }

      toast.success('Personel başarıyla silindi.');
      setDeleteStaffTarget(null);
      loadData();
    } catch (err: any) {
      toast.error('Personel silinirken hata: ' + err.message);
    }
  };

  // Rotate QR secret
  const handleRotateQr = async () => {
    try {
      setIsRotatingQr(true);
      const { data, error } = await supabase.rpc('rotate_business_pairing_secret', {
        p_business_id: business.id,
      });

      if (error) throw error;

      setPairingSecret(data);
      toast.success('Personel QR kodu başarıyla yenilendi.');
    } catch (err: any) {
      toast.error('QR kod yenilenirken hata: ' + err.message);
    } finally {
      setIsRotatingQr(false);
    }
  };

  // Approve device
  const handleApproveDevice = async (deviceId: string) => {
    const waiterName = editingNames[deviceId] || '';

    try {
      const { data, error } = await supabase.rpc('approve_waiter_device', {
        p_device_id: deviceId,
        p_waiter_name: waiterName.trim() || null,
      });

      if (error) throw error;

      toast.success(`"${data.waiter_name}" adlı personel cihazı onaylandı.`);
      loadData();
    } catch (err: any) {
      toast.error('Onaylama sırasında hata: ' + err.message);
    }
  };

  // Reject device
  const handleRejectDevice = async (deviceId: string) => {
    try {
      const { error } = await supabase.rpc('reject_waiter_device', {
        p_device_id: deviceId,
      });

      if (error) throw error;

      toast.success('Personel cihaz talebi reddedildi.');
      loadData();
    } catch (err: any) {
      toast.error('İşlem başarısız: ' + err.message);
    }
  };

  // Revoke device
  const handleRevokeDevice = async () => {
    if (!deleteTarget) return;

    try {
      const { error } = await supabase.rpc('revoke_waiter_device', {
        p_device_id: deleteTarget.id,
      });

      if (error) throw error;

      toast.success(`"${deleteTarget.waiter_name || deleteTarget.device_name}" cihazının yetkisi kaldırıldı.`);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      toast.error('İşlem başarısız: ' + err.message);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pairingUrl);
    setCopied(true);
    toast.success('Personel eşleştirme bağlantısı panoya kopyalandı.');
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter devices that are not matched to any staff member
  const getPairedDeviceForStaff = (staff: StaffMember) => {
    return approvedDevices.find(
      (d) =>
        d.staff_id === staff.id ||
        d.waiter_id === staff.id ||
        (d.waiter_name && d.waiter_name.trim().toLowerCase() === staff.name.trim().toLowerCase())
    );
  };

  const unassignedDevices = approvedDevices.filter(
    (d) =>
      !staffList.some(
        (s) =>
          s.id === d.staff_id ||
          s.id === d.waiter_id ||
          (d.waiter_name && d.waiter_name.trim().toLowerCase() === s.name.trim().toLowerCase())
      )
  );

  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case 'manager':
        return <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 font-bold text-[11px]">Müdür / Yönetici</span>;
      case 'waiter':
        return <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 font-bold text-[11px]">Garson</span>;
      case 'kitchen':
        return <span className="px-2.5 py-1 rounded-lg bg-orange-500/15 text-orange-300 font-bold text-[11px]">Mutfak Şefi</span>;
      case 'cashier':
        return <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 font-bold text-[11px]">Kasiyer</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg bg-slate-500/15 text-slate-300 font-bold text-[11px]">Özel Yetkili</span>;
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* TEK ANA KART / PANEL */}
      <div className="p-6 sm:p-7 rounded-2xl bg-[#111622] shadow-xl space-y-6">
        {/* 1. Üst Başlık ve Aksiyonlar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-5 h-5 text-white" />
              <span>Personel & Terminal Yetkilendirme</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              İşletmenizin garson, mutfak ve kasa personellerine modül yetkileri atayın, 6 haneli PIN tanımlayın ve eşleşen mobil terminallerini yönetin.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenAddStaff}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Personel Ekle</span>
            </button>

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#1C2433] hover:bg-[#253043] text-white font-bold text-xs transition flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-white" />
              <span>Terminal Eşleme QR</span>
            </button>
          </div>
        </div>

        {/* 2. Onay Bekleyen Cihaz Talebi (Varsa) */}
        {pendingDevices.length > 0 && (
          <div className="p-4 sm:p-5 rounded-xl bg-[#1A1824] space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white">
                Onay Bekleyen Personel Terminali
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingDevices.map((device) => (
                <div key={device.id} className="p-3.5 rounded-xl bg-[#0C1017] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-white">{device.device_name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(device.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Personel Adı / Unvanı"
                      value={editingNames[device.id] || ''}
                      onChange={(e) => setEditingNames({ ...editingNames, [device.id]: e.target.value })}
                      className="flex-1 bg-[#141A26] rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none font-medium"
                    />
                    <button
                      onClick={() => handleApproveDevice(device.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => handleRejectDevice(device.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#1C2433] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-bold transition cursor-pointer"
                    >
                      Reddet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Kayıtlı Personeller & Eşleşen Terminaller Listesi */}
        {loading && staffList.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold">Personel listesi yükleniyor...</p>
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-10 sm:p-12 rounded-2xl bg-[#0C1017] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1C2433] flex items-center justify-center mx-auto text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Henüz Kayıtlı Personel Yok</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Garson, mutfak şefi veya kasa personeli ekleyerek 6 haneli PIN kodu ve modül yetkileri tanımlayabilirsiniz.
            </p>
            <button
              onClick={handleOpenAddStaff}
              className="mt-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Personel Ekle</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {staffList.map((staff, index) => {
              const pairedDevice = getPairedDeviceForStaff(staff);

              return (
                <div
                  key={staff.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#0C1017] hover:bg-[#141A26] transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                >
                  {/* Sol Bölüm: Sıra No, Personel Bilgisi, PIN & Rol */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="font-mono text-xs font-bold text-slate-500 w-5 shrink-0 text-right">
                      {index + 1}.
                    </span>

                    <div className="w-10 h-10 rounded-xl bg-[#1C2433] flex items-center justify-center font-bold text-sm text-white shrink-0">
                      {staff.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="font-bold text-sm text-white truncate">{staff.name}</h4>
                        {getRoleBadge(staff.role)}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                        PIN: •••••• ({staff.pin_code})
                      </span>
                    </div>
                  </div>

                  {/* Orta Bölüm: Yetki Hapları */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {staff.permissions.can_take_orders && (
                      <span className="px-2.5 py-1 rounded-lg bg-[#141A26] text-slate-300 text-[10px] font-bold">
                        Masaya Sipariş
                      </span>
                    )}
                    {staff.permissions.can_handle_calls && (
                      <span className="px-2.5 py-1 rounded-lg bg-[#141A26] text-slate-300 text-[10px] font-bold">
                        Garson Çağrısı
                      </span>
                    )}
                    {staff.permissions.can_access_kitchen && (
                      <span className="px-2.5 py-1 rounded-lg bg-orange-500/15 text-orange-300 text-[10px] font-bold">
                        Mutfak Ekranı
                      </span>
                    )}
                    {staff.permissions.can_access_pos && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-[10px] font-bold">
                        Kasa POS
                      </span>
                    )}
                    {staff.permissions.is_full_access && (
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 text-[10px] font-bold">
                        Tam Yetkili
                      </span>
                    )}
                  </div>

                  {/* Sağ Bölüm: Eşleşen Cihaz & Aksiyonlar */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0">
                    {/* Eşleşen Cihaz Rozeti */}
                    {pairedDevice ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111622] text-emerald-400 text-xs font-bold">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[110px]">{pairedDevice.device_name}</span>
                        <button
                          onClick={() => setDeleteTarget(pairedDevice)}
                          className="ml-1 p-1 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer"
                          title="Terminal Bağlantısını Kes"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-500 text-xs font-medium">
                        <Smartphone className="w-3.5 h-3.5 text-slate-600" />
                        <span>Cihaz bağlı değil</span>
                      </div>
                    )}

                    {/* Aksiyon Butonları */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditStaff(staff)}
                        className="px-3 py-1.5 rounded-xl bg-[#1C2433] hover:bg-[#253043] text-slate-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Düzenle</span>
                      </button>

                      <button
                        onClick={() => setDeleteStaffTarget(staff)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer"
                        title="Personeli Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Bağımsız / Genel Eşleşmiş Terminaller (Varsa) */}
            {unassignedDevices.length > 0 && (
              <div className="pt-3 mt-3 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block px-1">
                  Diğer Eşleşmiş Terminaller
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {unassignedDevices.map((device) => (
                    <div
                      key={device.id}
                      className="p-3 rounded-xl bg-[#0C1017] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {device.waiter_name || device.device_name}
                          </span>
                          <span className="text-[10px] text-slate-500">{device.device_name}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setDeleteTarget(device)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition cursor-pointer"
                        title="Yetkiyi Kaldır"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Personel Ekle / Düzenle */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111622] rounded-3xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold text-white">
                  {editingStaff ? 'Personel Yetkilerini Düzenle' : 'Personel Ekle'}
                </h3>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Personel Adı Soyadı</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="w-full bg-[#0C1017] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none font-medium"
                />
              </div>

              {/* Role Preset */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">Personel Rolü</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(['waiter', 'kitchen', 'cashier', 'manager'] as StaffRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleChange(r)}
                      className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        staffRole === r
                          ? 'bg-[#1C2433] text-white shadow-xs'
                          : 'bg-[#0C1017] text-slate-400 hover:text-white'
                      }`}
                    >
                      {r === 'waiter' ? 'Garson' : r === 'kitchen' ? 'Mutfak' : r === 'cashier' ? 'Kasiyer' : 'Müdür'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6-digit PIN */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Hızlı Giriş PIN Kodu (6 Haneli)</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full bg-[#0C1017] rounded-xl pl-9.5 pr-3.5 py-2.5 text-xs text-white font-mono tracking-widest focus:outline-none"
                  />
                </div>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-2">Modül & Operasyon Yetkileri</label>
                <div className="space-y-2.5 bg-[#0C1017] p-3.5 rounded-2xl text-xs">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={staffPermissions.can_take_orders}
                      onChange={(e) => {
                        setStaffRole('custom');
                        setStaffPermissions({ ...staffPermissions, can_take_orders: e.target.checked });
                      }}
                      className="rounded accent-white"
                    />
                    <span className="text-slate-300 font-semibold">Masalara Sipariş Girme</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={staffPermissions.can_handle_calls}
                      onChange={(e) => {
                        setStaffRole('custom');
                        setStaffPermissions({ ...staffPermissions, can_handle_calls: e.target.checked });
                      }}
                      className="rounded accent-white"
                    />
                    <span className="text-slate-300 font-semibold">Garson Çağrılarını Takip Etme & Onaylama</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={staffPermissions.can_access_kitchen}
                      onChange={(e) => {
                        setStaffRole('custom');
                        setStaffPermissions({ ...staffPermissions, can_access_kitchen: e.target.checked });
                      }}
                      className="rounded accent-white"
                    />
                    <span className="text-slate-300 font-semibold">Mutfak Ekranına Erişim</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={staffPermissions.can_access_pos}
                      onChange={(e) => {
                        setStaffRole('custom');
                        setStaffPermissions({ ...staffPermissions, can_access_pos: e.target.checked });
                      }}
                      className="rounded accent-white"
                    />
                    <span className="text-slate-300 font-semibold">Kasa / Hızlı POS & Tahsilat</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#1C2433] text-slate-300 text-xs font-bold hover:bg-[#253043] cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-white text-slate-950 text-xs font-bold hover:bg-slate-200 cursor-pointer shadow-sm"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QR Pairing Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#111622] rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Personel Terminali Eşleme QR Kodu</h3>
            <p className="text-xs text-slate-400">
              Personel cihazınızın kamerasıyla bu QR kodu okutarak terminal uygulamasını anında eşleyin.
            </p>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-lg mx-auto">
              <QRCodeSVG value={pairingUrl} size={180} />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#1C2433] hover:bg-[#253043] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Kopyalandı' : 'Linki Kopyala'}</span>
              </button>

              <button
                onClick={handleRotateQr}
                disabled={isRotatingQr}
                className="py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="QR Kodu Yenile"
              >
                <RefreshCw className={`w-4 h-4 ${isRotatingQr ? 'animate-spin' : ''}`} />
                <span>Yenile</span>
              </button>
            </div>

            <button
              onClick={() => setIsQrModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Delete Device Modal */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={true}
          title="Terminal Yetkisini Kaldır"
          message={`"${deleteTarget.waiter_name || deleteTarget.device_name}" cihazının erişim yetkisi kaldırılacak. Devam etmek istiyor musunuz?`}
          onConfirm={handleRevokeDevice}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Delete Staff Modal */}
      {deleteStaffTarget && (
        <ConfirmModal
          isOpen={true}
          title="Personeli Sil"
          message={`"${deleteStaffTarget.name}" personeli sistemden silinecek. Devam etmek istiyor musunuz?`}
          onConfirm={handleDeleteStaff}
          onCancel={() => setDeleteStaffTarget(null)}
        />
      )}
    </div>
  );
};

