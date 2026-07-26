import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { KeyRound, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  oobCode: string;
}

export function ResetPasswordScreen({ oobCode }: Props) {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    verifyPasswordResetCode(auth, oobCode)
      .then((email) => { setEmail(email); setVerifying(false); })
      .catch(() => { setError('El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.'); setVerifying(false); });
  }, [oobCode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (newPassword !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      setTimeout(() => {
        window.location.replace(window.location.origin + window.location.pathname);
      }, 2500);
    } catch {
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-accent-500 to-violet-500 shadow-glow">
            <KeyRound size={26} className="text-white" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold text-white tracking-tight">XiX Tech</h1>
          <p className="mt-1 text-sm text-slate-400">Restablecer contraseña</p>
        </div>

        <div className="card relative p-6">
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-accent-500/30 to-transparent" />

          {verifying ? (
            <div className="flex flex-col items-center gap-3 py-6 text-slate-400">
              <Loader2 size={22} className="animate-spin" />
              <p className="text-sm">Verificando enlace...</p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 size={36} className="text-success-500" />
              <p className="font-display text-lg font-semibold text-white">Contraseña actualizada</p>
              <p className="text-sm text-slate-400">Redirigiendo al inicio de sesión...</p>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <h2 className="font-display text-lg font-semibold text-white">Nueva contraseña</h2>
                {email && <p className="mt-0.5 text-sm text-slate-400">Para la cuenta <span className="text-slate-300">{email}</span></p>}
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="label"><Lock size={11} className="inline mr-1" />Nueva contraseña</label>
                  <input type="password" required minLength={6} className="input" disabled={loading || !!error && !newPassword}
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoFocus />
                </div>
                <div>
                  <label className="label"><Lock size={11} className="inline mr-1" />Confirmar contraseña</label>
                  <input type="password" required minLength={6} className="input" disabled={loading}
                    value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repite la nueva contraseña" />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2 rounded-xl border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">
                      <AlertCircle size={15} className="mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" disabled={loading || (!!error && !newPassword && !confirm)} className="btn-primary w-full">
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Guardando...</> : <><KeyRound size={15} /> Guardar nueva contraseña</>}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
