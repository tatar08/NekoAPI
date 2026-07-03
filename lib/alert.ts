import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export const nekoConfirm = async (title: string, text: string, confirmButtonText = 'Confirm', cancelButtonText = 'Cancel') => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'question',
    iconColor: '#8b5cf6', // Violet color
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    background: '#0c0d14',
    color: '#e2e8f0',
    customClass: {
      popup: 'border border-white/[0.06] rounded-2xl shadow-2xl backdrop-blur-2xl font-sans',
      title: 'text-base font-bold text-white pt-4',
      htmlContainer: 'text-xs text-gray-400 mt-2',
      confirmButton: 'px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer transition active:scale-95 shadow-[0_0_12px_rgba(139,92,246,0.3)]',
      cancelButton: 'px-4 py-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-gray-300 text-xs font-bold rounded-xl cursor-pointer transition active:scale-95 ml-3',
    },
    buttonsStyling: false,
  });
  return result.isConfirmed;
};

export const nekoAlert = async (title: string, text: string, icon: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  let iconColor = '#3b82f6'; // blue
  if (icon === 'success') iconColor = '#10b981'; // emerald
  if (icon === 'error') iconColor = '#f43f5e'; // rose
  if (icon === 'warning') iconColor = '#fbbf24'; // amber

  await Swal.fire({
    title,
    text,
    icon,
    iconColor,
    confirmButtonText: 'Dismiss',
    background: '#0c0d14',
    color: '#e2e8f0',
    customClass: {
      popup: 'border border-white/[0.06] rounded-2xl shadow-2xl backdrop-blur-2xl font-sans',
      title: 'text-base font-bold text-white pt-4',
      htmlContainer: 'text-xs text-gray-400 mt-2',
      confirmButton: 'px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer transition active:scale-95 shadow-[0_0_12px_rgba(139,92,246,0.3)]',
    },
    buttonsStyling: false,
  });
};
