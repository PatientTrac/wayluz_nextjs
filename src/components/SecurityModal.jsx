'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, ShieldOff, KeyRound, Loader2, CheckCircle2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useToast } from '@/components/ui/use-toast';

const SecurityModal = ({ isOpen, onClose }) => {
  const { enrollMfa, confirmEnrollment, listMfaFactors, disableMfa, changePassword } = useAdminAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [factor, setFactor] = useState(null); // verified totp factor, if any
  const [enroll, setEnroll] = useState(null);  // { factorId, qr, secret, uri } during setup
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const factors = await listMfaFactors();
    setFactor(factors.find((f) => f.status === 'verified') || null);
    setLoading(false);
  };

  useEffect(() => { if (isOpen) { setEnroll(null); setCode(''); setErr(''); refresh(); } /* eslint-disable-next-line */ }, [isOpen]);

  const startEnroll = async () => {
    setErr(''); setBusy(true);
    const res = await enrollMfa();
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    setEnroll(res);
  };

  const finishEnroll = async () => {
    setErr('');
    if (!/^\d{6}$/.test(code.trim())) { setErr('Enter the 6-digit code shown in your app.'); return; }
    setBusy(true);
    const ok = await confirmEnrollment(enroll.factorId, code);
    setBusy(false);
    if (!ok) { setErr('That code didn\u2019t match. Try the current one (they rotate every 30s).'); setCode(''); return; }
    toast({ title: 'Two-factor enabled', description: 'You\u2019ll be asked for a code at each sign-in.' });
    setEnroll(null); setCode(''); refresh();
  };

  const removeMfa = async () => {
    if (!factor) return;
    setBusy(true);
    const ok = await disableMfa(factor.id);
    setBusy(false);
    if (ok) { toast({ title: 'Two-factor disabled' }); refresh(); }
    else toast({ title: 'Could not disable 2FA', variant: 'destructive' });
  };

  const savePassword = async () => {
    if (pw1.length < 8) { toast({ title: 'Password too short', description: 'Use at least 8 characters.', variant: 'destructive' }); return; }
    if (pw1 !== pw2) { toast({ title: 'Passwords don\u2019t match', variant: 'destructive' }); return; }
    setPwBusy(true);
    const res = await changePassword(pw1);
    setPwBusy(false);
    if (res.ok) { toast({ title: 'Password updated' }); setPw1(''); setPw2(''); }
    else toast({ title: 'Could not update password', description: res.error, variant: 'destructive' });
  };

  if (!isOpen) return null;

  const qrIsImg = enroll?.qr && enroll.qr.trim().startsWith('data:');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#1a1a1a] border border-[#d4af37]/30 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden my-8">
          <div className="flex items-center justify-between p-4 border-b border-[#d4af37]/20 bg-[#0f0f0f]">
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><ShieldCheck size={20} className="text-[#d4af37]" /> Security</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
          </div>

          <div className="p-6 space-y-8">
            {/* Two-factor authentication */}
            <section>
              <h4 className="text-white font-semibold mb-1 flex items-center gap-2"><Smartphone size={16} className="text-[#d4af37]" /> Authenticator app (2FA)</h4>
              <p className="text-gray-500 text-sm mb-4">Google Authenticator, Authy, 1Password — any TOTP app.</p>

              {loading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 className="animate-spin" size={16} /> Checking status…</div>
              ) : enroll ? (
                <div className="bg-[#0f0f0f] border border-[#d4af37]/20 rounded-lg p-4">
                  <p className="text-gray-300 text-sm mb-3">1. Scan this in your authenticator app:</p>
                  <div className="flex justify-center mb-3">
                    <div className="bg-white p-3 rounded-lg w-[180px] h-[180px] flex items-center justify-center">
                      {qrIsImg
                        ? <img src={enroll.qr} alt="2FA QR code" width={156} height={156} />
                        : <div className="w-[156px] h-[156px] [&_svg]:w-full [&_svg]:h-full" dangerouslySetInnerHTML={{ __html: enroll.qr || '' }} />}
                    </div>
                  </div>
                  {enroll.secret && (
                    <p className="text-gray-500 text-xs text-center mb-4 break-all">Can't scan? Enter this key manually:<br /><span className="text-[#d4af37] font-mono">{enroll.secret}</span></p>
                  )}
                  <p className="text-gray-300 text-sm mb-2">2. Enter the 6-digit code it shows:</p>
                  <div className="flex gap-2">
                    <input type="text" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="flex-1 bg-[#1a1a1a] border border-[#d4af37]/30 rounded-lg px-4 py-2.5 text-white text-center text-lg tracking-[0.4em] focus:outline-none focus:border-[#d4af37]" placeholder="000000" autoFocus />
                    <Button onClick={finishEnroll} disabled={busy} className="bg-[#d4af37] hover:bg-[#c9a961] text-black font-medium">
                      {busy ? <Loader2 className="animate-spin" size={18} /> : 'Verify'}
                    </Button>
                  </div>
                  {err && <p className="text-red-400 text-sm mt-2">{err}</p>}
                  <button onClick={() => { setEnroll(null); setErr(''); setCode(''); }} className="text-gray-500 hover:text-white text-xs mt-3">Cancel setup</button>
                </div>
              ) : factor ? (
                <div className="flex items-center justify-between bg-green-900/10 border border-green-600/40 rounded-lg p-4">
                  <span className="text-green-300 text-sm flex items-center gap-2"><CheckCircle2 size={16} /> Enabled — a code is required at sign-in.</span>
                  <Button onClick={removeMfa} disabled={busy} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 gap-2">
                    {busy ? <Loader2 className="animate-spin" size={16} /> : <><ShieldOff size={16} /> Disable</>}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-amber-900/10 border border-amber-600/40 rounded-lg p-4">
                  <span className="text-amber-300 text-sm">Not enabled. Strongly recommended.</span>
                  <Button onClick={startEnroll} disabled={busy} className="bg-[#d4af37] hover:bg-[#c9a961] text-black font-medium gap-2">
                    {busy ? <Loader2 className="animate-spin" size={16} /> : <><ShieldCheck size={16} /> Enable 2FA</>}
                  </Button>
                </div>
              )}
              {err && !enroll && <p className="text-red-400 text-sm mt-2">{err}</p>}
            </section>

            {/* Change password */}
            <section className="border-t border-white/5 pt-6">
              <h4 className="text-white font-semibold mb-1 flex items-center gap-2"><KeyRound size={16} className="text-[#d4af37]" /> Change password</h4>
              <p className="text-gray-500 text-sm mb-4">Updates immediately — no email required.</p>
              <div className="space-y-3">
                <input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} className="w-full bg-[#0f0f0f] border border-[#d4af37]/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#d4af37]" placeholder="New password (min 8 characters)" autoComplete="new-password" />
                <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} className="w-full bg-[#0f0f0f] border border-[#d4af37]/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#d4af37]" placeholder="Confirm new password" autoComplete="new-password" />
                <Button onClick={savePassword} disabled={pwBusy} className="bg-[#d4af37] hover:bg-[#c9a961] text-black font-medium w-full">
                  {pwBusy ? <Loader2 className="animate-spin" size={18} /> : 'Update password'}
                </Button>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SecurityModal;
