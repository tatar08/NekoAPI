'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState<string[]>(Array(8).fill(''));
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const pinRefs = useRef<HTMLInputElement[]>([]);

  const pinStr = pin.join('');
  const isPinComplete = pinStr.length >= 6 && pinStr.length <= 8;

  // Handle PIN typing and jumping
  const handlePinChange = (val: string, index: number) => {
    if (val !== '' && !/^\d$/.test(val)) return;

    const newPin = [...pin];
    newPin[index] = val;
    setPin(newPin);

    // Jump to next index if value is added
    if (val !== '' && index < 7) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (pin[index] === '' && index > 0) {
        // Clear previous input and shift focus left
        const newPin = [...pin];
        newPin[index - 1] = '';
        setPin(newPin);
        pinRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newPin = [...pin];
        newPin[index] = '';
        setPin(newPin);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    if (!isPinComplete) {
      setError('PIN must be between 6 and 8 digits');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          pin: pinStr
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFingerprintLogin = () => {
    alert('Biometric login is not configured for this device/environment.');
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-[#07080c] relative overflow-hidden p-6 font-sans select-none">
      {/* Background glowing decorations */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-[160px] top-1/12 left-1/4 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[160px] bottom-1/12 right-1/4 pointer-events-none" />

      {/* Premium Glassmorphic Card */}
      <div className="w-full max-w-[400px] bg-[#0c0d14]/75 backdrop-blur-2xl border border-white/[0.05] p-8 rounded-3xl shadow-2xl relative z-10 animate-fade-in">
        
        {/* Hologram Padlock Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-28 h-28 flex items-center justify-center mb-2">
            
            {/* Spinning Hologram Orbit Rings */}
            <div className="absolute inset-0 rounded-full border border-dashed border-violet-500/20 animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-2 rounded-full border border-violet-400/30 animate-[spin_10s_linear_infinite_reverse]" />
            <div className="absolute inset-4 rounded-full border-2 border-transparent border-t-indigo-500/40 border-b-blue-500/40 animate-[spin_6s_linear_infinite]" />

            {/* Glowing Backdrop Aura */}
            <div className="absolute w-14 h-14 rounded-full bg-violet-500/20 blur-md" />

            {/* Floating Orbit Checkmark Badge */}
            <div className="absolute top-4 right-1 w-6 h-6 bg-[#0e1017] border border-violet-500/30 rounded-full flex items-center justify-center text-[10px] text-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.3)] animate-[bounce_3s_ease-in-out_infinite]">
              🛡️
            </div>

            {/* Main Holographic Cat Icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 border border-violet-400/40 flex items-center justify-center text-2xl text-white shadow-[0_0_20px_rgba(139,92,246,0.5)] z-10 animate-[pulse_2s_ease-in-out_infinite]">
              🐱
            </div>
          </div>

          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 tracking-wider animate-pulse-glow">
            Welcome Back
          </h2>
          <p className="text-gray-500 text-[11px] mt-0.5">Please sign in to continue</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-rose-500/10 bg-rose-950/20 text-rose-400 text-xs font-medium animate-slide-down flex items-start gap-2 select-text leading-normal">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Username Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">User Name</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-gray-500 text-xs">👤</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your user name"
                className="w-full bg-[#11131c]/60 border border-white/[0.05] focus:border-violet-500/50 hover:border-white/10 text-white pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none transition duration-200 placeholder-gray-600 font-mono"
                required
              />
            </div>
          </div>

          {/* PIN Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">PIN (6-8 digits)</label>
            
            {/* 8 Box PIN Fields */}
            <div className="grid grid-cols-8 gap-2">
              {Array.from({ length: 8 }).map((_, idx) => (
                <input
                  key={idx}
                  ref={(el) => { if (el) pinRefs.current[idx] = el; }}
                  type="password"
                  maxLength={1}
                  value={pin[idx] || ''}
                  onChange={(e) => handlePinChange(e.target.value, idx)}
                  onKeyDown={(e) => handlePinKeyDown(e, idx)}
                  className={`w-full aspect-square bg-[#11131c] border rounded-xl text-center font-mono text-sm focus:outline-none transition duration-200 text-white ${
                    pin[idx] 
                      ? 'border-violet-500/60 shadow-[0_0_8px_rgba(139,92,246,0.15)] bg-violet-950/5' 
                      : 'border-white/[0.05] focus:border-violet-500/40 hover:border-white/10'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 mt-2 cursor-pointer select-none"
          >
            {loading ? (
              <>
                <div className="spinner" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <span className="text-[13px] font-normal">&rarr;</span>
              </>
            )}
          </button>
        </form>

        {/* OR Fingerprint option separator */}
        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-white/[0.04]"></div>
          <span className="flex-shrink mx-4 text-gray-600 text-[10px] uppercase font-bold tracking-wider">or</span>
          <div className="flex-grow border-t border-white/[0.04]"></div>
        </div>

        {/* Fingerprint Button */}
        <div className="flex flex-col items-center gap-2.5">
          <button
            onClick={handleFingerprintLogin}
            className="w-12 h-12 rounded-full border border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 text-violet-400 hover:text-violet-300 flex items-center justify-center text-xl transition active:scale-95 shadow-[0_0_12px_rgba(139,92,246,0.1)] hover:shadow-[0_0_18px_rgba(139,92,246,0.2)] cursor-pointer"
          >
            👆
          </button>
          <span className="text-[10px] text-gray-500 font-semibold cursor-pointer hover:text-gray-400 transition" onClick={handleFingerprintLogin}>
            Sign in with Fingerprint
          </span>
        </div>

        {/* Footer Navigation */}
        <p className="text-center text-xs text-gray-500 mt-6 select-none border-t border-white/[0.04] pt-4">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-violet-400 hover:text-violet-300 font-semibold underline decoration-violet-500/30 transition">
            Sign Up
          </Link>
        </p>

      </div>

      {/* Security badge footer */}
      <div className="absolute bottom-5 flex items-center gap-1.5 text-gray-600 text-[9px] uppercase font-bold tracking-widest pointer-events-none select-none">
        <span>🛡️</span>
        <span>Your security. Our priority.</span>
      </div>
    </div>
  );
}
