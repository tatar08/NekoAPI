'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  
  // PIN states (8 digit arrays)
  const [pin, setPin] = useState<string[]>(Array(8).fill(''));
  const [confirmPin, setConfirmPin] = useState<string[]>(Array(8).fill(''));
  const [agree, setAgree] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  // Refs for auto-tabbing focus
  const pinRefs = useRef<HTMLInputElement[]>([]);
  const confirmPinRefs = useRef<HTMLInputElement[]>([]);

  // Validation states for checkmarks
  const isUsernameValid = username.trim().length >= 3 && /^[a-zA-Z0-9_]+$/.test(username.trim());
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  
  const pinStr = pin.join('');
  const confirmPinStr = confirmPin.join('');
  const isPinComplete = pinStr.length >= 6 && pinStr.length <= 8;
  const isConfirmPinValid = confirmPinStr === pinStr && pinStr.length >= 6;

  // Handle PIN typing and jumping
  const handlePinChange = (val: string, index: number, isConfirm: boolean) => {
    // Only accept single numeric characters
    if (val !== '' && !/^\d$/.test(val)) return;

    const currentArray = isConfirm ? confirmPin : pin;
    const currentSet = isConfirm ? setConfirmPin : setPin;
    const currentRefs = isConfirm ? confirmPinRefs : pinRefs;

    const newArray = [...currentArray];
    newArray[index] = val;
    currentSet(newArray);

    // Jump to next index if value is added
    if (val !== '' && index < 7) {
      currentRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number, isConfirm: boolean) => {
    const currentArray = isConfirm ? confirmPin : pin;
    const currentSet = isConfirm ? setConfirmPin : setPin;
    const currentRefs = isConfirm ? confirmPinRefs : pinRefs;

    if (e.key === 'Backspace') {
      if (currentArray[index] === '' && index > 0) {
        // Clear previous input and shift focus left
        const newArray = [...currentArray];
        newArray[index - 1] = '';
        currentSet(newArray);
        currentRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newArray = [...currentArray];
        newArray[index] = '';
        currentSet(newArray);
      }
    }
  };

  // Live strength indicator
  const getPinStrength = () => {
    if (pinStr.length === 0) return { text: '', color: 'text-gray-600', bars: 0 };
    if (pinStr.length < 6) return { text: 'Too short', color: 'text-gray-500', bars: 0 };

    const isSequential = /^(01234567|12345678|23456789|98765432|87654321|76543210)$/.test(pinStr) ||
                         /^(012345|123456|234567|345678|456789|987654|876543|765432|654321|543210)$/.test(pinStr);
    const isRepeating = /^(\d)\1+$/.test(pinStr);

    if (isSequential || isRepeating) {
      return { text: 'Weak PIN', color: 'text-rose-500', bars: 1 };
    }
    return { text: 'Strong PIN', color: 'text-emerald-400', bars: 3 };
  };

  const strength = getPinStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isUsernameValid) {
      setError('Username must be 3-20 characters (letters, numbers, and underscores only)');
      return;
    }

    if (!isEmailValid) {
      setError('Please enter a valid email address');
      return;
    }

    if (!isPinComplete) {
      setError('PIN must be between 6 and 8 digits');
      return;
    }

    if (pinStr !== confirmPinStr) {
      setError('PINs do not match');
      return;
    }

    if (!agree) {
      setError('You must agree to the Terms of Service & Privacy Policy');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          pin: pinStr
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Registered successfully! Redirecting...');
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-[#07080c] relative overflow-y-auto p-6 font-sans select-none">
      {/* Background glowing decorations */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-[160px] top-1/12 left-1/4 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[160px] bottom-1/12 right-1/4 pointer-events-none" />

      {/* Premium Glassmorphic Card */}
      <div className="w-full max-w-[480px] bg-[#0c0d14]/75 backdrop-blur-2xl border border-white/[0.05] px-8 py-7 rounded-3xl shadow-2xl relative z-10 my-8 animate-fade-in">
        
        {/* Hologram User Graphic Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-28 h-28 flex items-center justify-center mb-2">
            
            {/* Spinning Hologram Orbit Rings */}
            <div className="absolute inset-0 rounded-full border border-dashed border-violet-500/20 animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-2 rounded-full border border-violet-400/30 animate-[spin_10s_linear_infinite_reverse]" />
            <div className="absolute inset-4 rounded-full border-2 border-transparent border-t-indigo-500/40 border-b-blue-500/40 animate-[spin_6s_linear_infinite]" />

            {/* Glowing Backdrop Aura */}
            <div className="absolute w-14 h-14 rounded-full bg-violet-500/20 blur-md" />

            {/* Floating Orbit Mail and Lock Icons */}
            <div className="absolute -top-1 -left-1 w-6 h-6 bg-[#0e1017] border border-violet-500/30 rounded-lg flex items-center justify-center text-[10px] text-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.3)] animate-[bounce_3s_ease-in-out_infinite]">
              ✉️
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#0e1017] border border-violet-500/30 rounded-lg flex items-center justify-center text-[10px] text-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.3)] animate-[bounce_3s_ease-in-out_infinite_1.5s]">
              🔒
            </div>

            {/* Main Holographic Cat Icon */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 border border-violet-400/40 flex items-center justify-center text-2xl text-white shadow-[0_0_20px_rgba(139,92,246,0.5)] z-10 animate-[pulse_2s_ease-in-out_infinite]">
              🐱
            </div>
          </div>

          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 tracking-wider">
            Create Account
          </h2>
          <p className="text-gray-500 text-[11px] mt-0.5">Join us and start your journey</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-rose-500/10 bg-rose-950/20 text-rose-400 text-xs font-medium animate-slide-down flex items-start gap-2 select-text leading-normal">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl border border-emerald-500/10 bg-emerald-950/20 text-emerald-400 text-xs font-medium animate-slide-down flex items-start gap-2 select-text leading-normal">
            <span>✅</span>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Username Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Username</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-gray-500 text-xs">👤</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full bg-[#11131c]/60 border border-white/[0.05] focus:border-violet-500/50 hover:border-white/10 text-white pl-9 pr-9 py-2.5 rounded-xl text-xs outline-none transition duration-200 placeholder-gray-600 font-mono"
                required
              />
              {isUsernameValid && (
                <span className="absolute right-3.5 top-3 text-emerald-400 text-[11px] animate-fade-in">✓</span>
              )}
            </div>
            <span className="text-[9px] text-gray-600 mt-0.5">3-20 characters, letters, numbers and _ only</span>
          </div>

          {/* Email Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Email</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-gray-500 text-[10px]">✉️</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full bg-[#11131c]/60 border border-white/[0.05] focus:border-violet-500/50 hover:border-white/10 text-white pl-9 pr-9 py-2.5 rounded-xl text-xs outline-none transition duration-200 placeholder-gray-600 font-mono"
                required
              />
              {isEmailValid && (
                <span className="absolute right-3.5 top-3 text-emerald-400 text-[11px] animate-fade-in">✓</span>
              )}
            </div>
            <span className="text-[9px] text-gray-600 mt-0.5">We&apos;ll never share your email with anyone</span>
          </div>

          {/* PIN Input */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">PIN (6-8 digits)</label>
              {isPinComplete && (
                <span className="text-violet-400 text-[10px] font-bold">🛡️</span>
              )}
            </div>
            
            {/* 8 Box PIN Fields */}
            <div className="grid grid-cols-8 gap-2">
              {Array.from({ length: 8 }).map((_, idx) => (
                <input
                  key={idx}
                  ref={(el) => { if (el) pinRefs.current[idx] = el; }}
                  type="password"
                  maxLength={1}
                  value={pin[idx] || ''}
                  onChange={(e) => handlePinChange(e.target.value, idx, false)}
                  onKeyDown={(e) => handlePinKeyDown(e, idx, false)}
                  className={`w-full aspect-square bg-[#11131c] border rounded-xl text-center font-mono text-sm focus:outline-none transition duration-200 text-white ${
                    pin[idx] 
                      ? 'border-violet-500/60 shadow-[0_0_8px_rgba(139,92,246,0.15)] bg-violet-950/5' 
                      : 'border-white/[0.05] focus:border-violet-500/40 hover:border-white/10'
                  }`}
                />
              ))}
            </div>

            <div className="flex justify-between items-center mt-1 text-[9px] text-gray-600">
              <span>Use 6 to 8 digits for your PIN</span>
              {strength.text && (
                <div className="flex items-center gap-1.5 animate-fade-in">
                  <span className={`font-semibold ${strength.color}`}>{strength.text}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-1 rounded-sm transition-all duration-300 ${
                          i < strength.bars 
                            ? strength.bars === 1 
                              ? 'bg-rose-500' 
                              : 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.4)]'
                            : 'bg-white/10'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Confirm PIN Input */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Confirm PIN</label>
              {isConfirmPinValid && (
                <span className="text-emerald-400 text-[10px] font-bold animate-fade-in">✓</span>
              )}
            </div>

            {/* 8 Box Confirm PIN Fields */}
            <div className="grid grid-cols-8 gap-2">
              {Array.from({ length: 8 }).map((_, idx) => (
                <input
                  key={idx}
                  ref={(el) => { if (el) confirmPinRefs.current[idx] = el; }}
                  type="password"
                  maxLength={1}
                  value={confirmPin[idx] || ''}
                  onChange={(e) => handlePinChange(e.target.value, idx, true)}
                  onKeyDown={(e) => handlePinKeyDown(e, idx, true)}
                  className={`w-full aspect-square bg-[#11131c] border rounded-xl text-center font-mono text-sm focus:outline-none transition duration-200 text-white ${
                    confirmPin[idx] 
                      ? 'border-violet-500/60 shadow-[0_0_8px_rgba(139,92,246,0.15)] bg-violet-950/5' 
                      : 'border-white/[0.05] focus:border-violet-500/40 hover:border-white/10'
                  }`}
                />
              ))}
            </div>
            <span className="text-[9px] text-gray-600 mt-0.5">Re-enter your PIN to confirm</span>
          </div>

          {/* Terms & Privacy checkbox */}
          <label className="flex items-center gap-2.5 mt-2 cursor-pointer text-[11px] text-gray-400 select-none">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="rounded bg-[#11131c] border-white/[0.1] accent-violet-500 w-4 h-4 cursor-pointer"
            />
            <span>
              I agree to the{' '}
              <span className="text-violet-400 hover:text-violet-300 font-semibold underline decoration-violet-500/30">Terms of Service</span>
              {' '}and{' '}
              <span className="text-violet-400 hover:text-violet-300 font-semibold underline decoration-violet-500/30">Privacy Policy</span>
            </span>
          </label>

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 mt-3 cursor-pointer select-none"
          >
            {loading ? (
              <>
                <div className="spinner" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <span className="text-[13px] font-normal">&rarr;</span>
              </>
            )}
          </button>
        </form>

        {/* OR Social login separator */}
        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-white/[0.04]"></div>
          <span className="flex-shrink mx-4 text-gray-600 text-[10px] uppercase font-bold tracking-wider">or</span>
          <div className="flex-grow border-t border-white/[0.04]"></div>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-4 gap-3">
          <button className="bg-white/[0.01] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/10 rounded-xl aspect-square flex items-center justify-center text-base transition active:scale-95 cursor-pointer">
            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24"><path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.478 0-6.3-2.823-6.3-6.3 0-3.477 2.822-6.3 6.3-6.3 1.63 0 3.11.624 4.228 1.636l3.12-3.12C19.345 2.527 16.03 1 12.24 1 5.922 1 1 5.922 1 12s4.922 11 11.24 11c6.586 0 11.24-4.636 11.24-11.24 0-.765-.082-1.336-.2-1.715H12.24z"/></svg>
          </button>
          <button className="bg-white/[0.01] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/10 rounded-xl aspect-square flex items-center justify-center text-base transition active:scale-95 cursor-pointer">
            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.64.74-1.2 1.88-1.05 3 .97.07 2.14-.56 3-1.44z"/></svg>
          </button>
          <button className="bg-white/[0.01] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/10 rounded-xl aspect-square flex items-center justify-center text-base transition active:scale-95 cursor-pointer">
            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 23 23"><rect width="10" height="10" fill="#f25022"/><rect x="11" width="10" height="10" fill="#7fba00"/><rect y="11" width="10" height="10" fill="#00a4ef"/><rect x="11" y="11" width="10" height="10" fill="#ffb900"/></svg>
          </button>
          <button className="bg-white/[0.01] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/10 rounded-xl aspect-square flex items-center justify-center text-base transition active:scale-95 cursor-pointer">
            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
          </button>
        </div>

        {/* Footer Navigation */}
        <p className="text-center text-xs text-gray-500 mt-6 select-none">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold underline decoration-violet-500/30 transition">
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
}
