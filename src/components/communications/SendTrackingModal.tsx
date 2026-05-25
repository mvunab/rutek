import { useState } from 'react';
import { Mail, MessageCircle, Link2, ExternalLink, Copy, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '../../lib/api';
import { toast } from '../../store/useToastStore';

type Channel = 'email' | 'whatsapp';

interface Props {
  orderId: string;
  orderCode: string;
  open: boolean;
  onClose: () => void;
}

interface SendResult {
  trackingUrl: string;
  whatsappUrl: string | null;
}

export function SendTrackingModal({ orderId, orderCode, open, onClose }: Props) {
  const [channel, setChannel] = useState<Channel>('whatsapp');
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setRecipient('');
    setResult(null);
    setCopied(false);
    onClose();
  };

  const handleSend = async () => {
    if (!recipient.trim()) return;
    setLoading(true);
    try {
      const res = await api.post<SendResult>(
        `/communications/orders/${orderId}/send-tracking`,
        { channel, recipient: recipient.trim() },
      );
      setResult(res);
      if (channel === 'email') {
        toast.info(`Email enviado a ${recipient.trim()}`);
      }
    } catch {
      toast.error('No se pudo enviar el link de seguimiento');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.trackingUrl) return;
    await navigator.clipboard.writeText(result.trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (result?.whatsappUrl) window.open(result.whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal open={open} onClose={handleClose} title={`Enviar seguimiento — ${orderCode}`}>
      <div className="space-y-5 pt-1">
        {!result ? (
          <>
            {/* Channel selector */}
            <div>
              <p className="text-sm font-medium text-stone-700 mb-2">Canal</p>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Seleccionar canal">
                <button
                  type="button"
                  onClick={() => setChannel('whatsapp')}
                  aria-pressed={channel === 'whatsapp'}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                    channel === 'whatsapp'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <MessageCircle className="size-4" aria-hidden />
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('email')}
                  aria-pressed={channel === 'email'}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                    channel === 'email'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Mail className="size-4" aria-hidden />
                  Email
                </button>
              </div>
            </div>

            {/* Recipient input */}
            <div>
              <label htmlFor="tracking-recipient" className="block text-sm font-medium text-stone-700 mb-1.5">
                {channel === 'email' ? 'Correo electrónico' : 'Número de teléfono'}
              </label>
              <Input
                id="tracking-recipient"
                type={channel === 'email' ? 'email' : 'tel'}
                inputMode={channel === 'email' ? 'email' : 'tel'}
                placeholder={channel === 'email' ? 'cliente@empresa.com…' : '+56 9 1234 5678…'}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                autoComplete={channel === 'email' ? 'email' : 'tel'}
                spellCheck={false}
                onKeyDown={(e) => { if (e.key === 'Enter' && recipient.trim()) handleSend(); }}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSend}
                disabled={!recipient.trim() || loading}
              >
                {loading ? 'Enviando…' : channel === 'email' ? 'Enviar email' : 'Generar link'}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Success state */}
            <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 space-y-1">
              <p className="text-xs text-stone-500 font-medium uppercase tracking-wide">Link de seguimiento</p>
              <div className="flex items-center gap-2 min-w-0">
                <Link2 className="size-4 text-stone-400 shrink-0" aria-hidden />
                <span className="text-sm text-stone-700 truncate flex-1">{result.trackingUrl}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label="Copiar link"
                  className="shrink-0 p-1.5 rounded-md hover:bg-stone-200 text-stone-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  {copied ? <Check className="size-4 text-emerald-500" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                </button>
              </div>
            </div>

            {result.whatsappUrl && (
              <button
                type="button"
                onClick={handleWhatsApp}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <MessageCircle className="size-4" aria-hidden />
                Abrir en WhatsApp
                <ExternalLink className="size-3.5 opacity-60" aria-hidden />
              </button>
            )}

            <div className="flex justify-end pt-1">
              <Button variant="secondary" onClick={handleClose}>
                Cerrar
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
