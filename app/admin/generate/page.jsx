'use client';

import { useState } from 'react';
import { ShieldCheck, Key, Copy, CheckCircle2, Loader2, AlertCircle, Building2, Smartphone, CalendarDays, Mail, Lock, ArrowLeft } from 'lucide-react';

export default function AdminGenerateLicense() {
    const [formData, setFormData] = useState({
        adminSecret: '',
        schoolName: '',
        schoolEmail: '',
        licenseType: 'annual',
        maxDevices: 5,
        expiresAt: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setResult(null);
        setCopied(false);

        try {
            console.log('[Admin] Sending request to /api/admin/generate-key...');

            const res = await fetch('/api/admin/generate-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-secret': formData.adminSecret,
                },
                body: JSON.stringify({
                    schoolName: formData.schoolName,
                    schoolEmail: formData.schoolEmail || '',
                    licenseType: formData.licenseType,
                    maxDevices: parseInt(formData.maxDevices),
                    expiresAt: formData.expiresAt ? formData.expiresAt : null,
                }),
            });

            console.log('[Admin] Response status:', res.status);

            let data;
            try {
                data = await res.json();
            } catch (parseErr) {
                throw new Error('Server mengembalikan respons yang tidak valid. Periksa koneksi atau konfigurasi server.');
            }

            console.log('[Admin] Response data:', data);

            if (!res.ok) {
                throw new Error(data.error || `Error ${res.status}: Terjadi kesalahan saat membuat lisensi`);
            }

            if (!data.license || !data.license.key) {
                throw new Error('Respons tidak mengandung kunci lisensi. Periksa konfigurasi database.');
            }

            setResult(data.license);
            console.log('[Admin] License key generated:', data.license.key);

            setFormData(prev => ({
                ...prev,
                schoolName: '',
                schoolEmail: '',
            }));
        } catch (err) {
            console.error('[Admin] Error:', err);
            setError(err.message || 'Terjadi kesalahan yang tidak diketahui.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!result) return;
        navigator.clipboard.writeText(result.key);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const licenseTypeLabel = {
        trial: 'Uji Coba',
        annual: 'Tahunan',
        permanent: 'Permanen',
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px 16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#e2e8f0',
        }}>
            {/* Fixed notification banner — always visible */}
            {(error || result) && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    padding: '12px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    background: error
                        ? 'linear-gradient(90deg, #991b1b, #b91c1c)'
                        : 'linear-gradient(90deg, #166534, #15803d)',
                    color: '#fff',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}>
                    {error ? (
                        <>
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={18} />
                            <span>Lisensi berhasil dibuat: <strong style={{ letterSpacing: '2px', fontFamily: 'monospace' }}>{result.key}</strong></span>
                            <button onClick={copyToClipboard} style={{
                                marginLeft: '12px',
                                padding: '4px 14px',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '6px',
                                background: copied ? '#22c55e' : 'rgba(255,255,255,0.15)',
                                color: '#fff',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}>
                                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                {copied ? 'Tersalin!' : 'Copy'}
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Back link */}
            <div style={{ width: '100%', maxWidth: '960px', marginBottom: '20px', marginTop: (error || result) ? '48px' : '0' }}>
                <a href="/" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#94a3b8',
                    fontSize: '14px',
                    textDecoration: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                }}>
                    <ArrowLeft size={16} />
                    Kembali ke Beranda
                </a>
            </div>

            {/* Header */}
            <div style={{
                width: '100%',
                maxWidth: '960px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '32px',
            }}>
                <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
                    flexShrink: 0,
                }}>
                    <ShieldCheck size={28} color="#fff" />
                </div>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.5px' }}>
                        Generator Lisensi
                    </h1>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '2px 0 0 0' }}>
                        Buat kunci lisensi dari panel admin
                    </p>
                </div>
            </div>

            {/* Main Content: Two column on large screens */}
            <div style={{
                width: '100%',
                maxWidth: '960px',
                display: 'grid',
                gridTemplateColumns: result ? '1fr 1fr' : '1fr',
                gap: '24px',
                alignItems: 'start',
            }}>
                {/* Form Card */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(148, 163, 184, 0.12)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ padding: '28px 28px 20px' }}>
                            {/* Error */}
                            {error && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '10px',
                                    padding: '14px 16px',
                                    borderRadius: '12px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    marginBottom: '20px',
                                }}>
                                    <AlertCircle size={18} color="#f87171" style={{ marginTop: '1px', flexShrink: 0 }} />
                                    <span style={{ fontSize: '13px', color: '#fca5a5', lineHeight: 1.5 }}>{error}</span>
                                </div>
                            )}

                            {/* Admin Secret */}
                            <InputGroup icon={<Lock size={14} color="#f87171" />} label="Admin Secret">
                                <input
                                    type="password"
                                    name="adminSecret"
                                    required
                                    value={formData.adminSecret}
                                    onChange={handleChange}
                                    autoComplete="off"
                                    placeholder="Masukkan password admin"
                                    style={inputStyle}
                                />
                            </InputGroup>

                            {/* School Name */}
                            <InputGroup icon={<Building2 size={14} color="#60a5fa" />} label="Nama Institusi">
                                <input
                                    type="text"
                                    name="schoolName"
                                    required
                                    value={formData.schoolName}
                                    onChange={handleChange}
                                    placeholder="Contoh: SMA Negeri 1 Jakarta"
                                    style={inputStyle}
                                />
                            </InputGroup>

                            {/* Two column row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <InputGroup icon={<Mail size={14} color="#818cf8" />} label="Email Kontak">
                                    <input
                                        type="email"
                                        name="schoolEmail"
                                        value={formData.schoolEmail}
                                        onChange={handleChange}
                                        placeholder="opsional@email.com"
                                        style={inputStyle}
                                    />
                                </InputGroup>

                                <InputGroup icon={<Smartphone size={14} color="#34d399" />} label="Maks. Device">
                                    <input
                                        type="number"
                                        name="maxDevices"
                                        min="1"
                                        required
                                        value={formData.maxDevices}
                                        onChange={handleChange}
                                        style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '16px' }}
                                    />
                                </InputGroup>
                            </div>

                            {/* Two column row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <InputGroup icon={<ShieldCheck size={14} color="#a78bfa" />} label="Tipe Lisensi">
                                    <select
                                        name="licenseType"
                                        value={formData.licenseType}
                                        onChange={handleChange}
                                        style={{ ...inputStyle, cursor: 'pointer' }}
                                    >
                                        <option value="annual">Tahunan (Annual)</option>
                                        <option value="trial">Uji Coba (Trial)</option>
                                        <option value="permanent">Permanen (Lifetime)</option>
                                    </select>
                                </InputGroup>

                                <InputGroup icon={<CalendarDays size={14} color="#fbbf24" />} label="Kadaluarsa">
                                    <input
                                        type="date"
                                        name="expiresAt"
                                        value={formData.expiresAt}
                                        onChange={handleChange}
                                        style={{ ...inputStyle, colorScheme: 'dark' }}
                                    />
                                </InputGroup>
                            </div>
                        </div>

                        {/* Submit button */}
                        <div style={{ padding: '0 28px 28px' }}>
                            <button
                                type="submit"
                                disabled={isLoading}
                                style={{
                                    width: '100%',
                                    padding: '16px 24px',
                                    border: 'none',
                                    borderRadius: '14px',
                                    background: isLoading
                                        ? 'rgba(99, 102, 241, 0.4)'
                                        : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                    color: '#fff',
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    transition: 'all 0.2s',
                                    boxShadow: isLoading ? 'none' : '0 4px 20px rgba(99, 102, 241, 0.3)',
                                }}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <Key size={20} />
                                        Buat Kunci Lisensi
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Result Card — hanya muncul saat ada result */}
                {result && (
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 0 40px rgba(34, 197, 94, 0.08)',
                    }}>
                        {/* Green top bar */}
                        <div style={{
                            height: '3px',
                            background: 'linear-gradient(90deg, #22c55e, #10b981)',
                        }} />

                        <div style={{ padding: '32px 28px', textAlign: 'center' }}>
                            {/* Success icon */}
                            <div style={{
                                width: '72px',
                                height: '72px',
                                borderRadius: '50%',
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '2px solid rgba(34, 197, 94, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                            }}>
                                <CheckCircle2 size={36} color="#22c55e" />
                            </div>

                            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#f8fafc', margin: '0 0 4px' }}>
                                Lisensi Berhasil Dibuat!
                            </h2>
                            <p style={{ fontSize: '13px', color: '#86efac', margin: '0 0 28px' }}>
                                Berikan kode berikut kepada institusi
                            </p>

                            {/* License Key Display */}
                            <div style={{
                                background: '#020617',
                                borderRadius: '16px',
                                padding: '24px 20px',
                                border: '1px solid rgba(34, 197, 94, 0.2)',
                                marginBottom: '16px',
                                userSelect: 'all',
                                cursor: 'text',
                            }}>
                                <p style={{
                                    fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
                                    fontSize: '26px',
                                    fontWeight: 900,
                                    color: '#4ade80',
                                    letterSpacing: '3px',
                                    margin: 0,
                                    textShadow: '0 0 20px rgba(74, 222, 128, 0.3)',
                                    wordBreak: 'break-all',
                                }}>
                                    {result.key}
                                </p>
                            </div>

                            {/* Copy button */}
                            <button
                                onClick={copyToClipboard}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    border: copied ? '1px solid #22c55e' : '1px solid rgba(148, 163, 184, 0.15)',
                                    borderRadius: '12px',
                                    background: copied ? '#22c55e' : 'rgba(255,255,255,0.06)',
                                    color: '#fff',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.25s',
                                }}
                            >
                                {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                                {copied ? 'Tersalin!' : 'Salin Kode Lisensi'}
                            </button>
                        </div>

                        {/* Info rows */}
                        <div style={{
                            borderTop: '1px solid rgba(148, 163, 184, 0.08)',
                            padding: '20px 28px',
                            background: 'rgba(0,0,0,0.15)',
                        }}>
                            <InfoRow label="Institusi" value={result.schoolName} />
                            <InfoRow label="Maks. Device" value={`${result.maxDevices} perangkat`} />
                            <InfoRow label="Tipe" value={licenseTypeLabel[result.type] || result.type} highlight />
                        </div>
                    </div>
                )}
            </div>

            {/* Spin keyframe */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes spin { to { transform: rotate(360deg); } }
                a:hover { background: rgba(148,163,184,0.08) !important; color: #e2e8f0 !important; }
                button:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
                input:focus, select:focus { border-color: rgba(99,102,241,0.5) !important; outline: none; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
                @media (max-width: 700px) {
                    div[style*="gridTemplateColumns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
                }
            `}} />
        </div>
    );
}

/* Reusable InputGroup */
function InputGroup({ icon, label, children }) {
    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#94a3b8',
                marginBottom: '6px',
            }}>
                {icon}
                {label}
            </label>
            {children}
        </div>
    );
}

/* Reusable InfoRow */
function InfoRow({ label, value, highlight }) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            fontSize: '13px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
        }}>
            <span style={{ color: '#94a3b8' }}>{label}</span>
            <span style={{
                fontWeight: 600,
                color: highlight ? '#4ade80' : '#e2e8f0',
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textTransform: highlight ? 'capitalize' : 'none',
            }}>{value}</span>
        </div>
    );
}

/* Shared input style */
const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid rgba(148, 163, 184, 0.12)',
    borderRadius: '10px',
    background: 'rgba(15, 23, 42, 0.6)',
    color: '#e2e8f0',
    fontSize: '14px',
    transition: 'all 0.2s',
    outline: 'none',
    boxSizing: 'border-box',
};
