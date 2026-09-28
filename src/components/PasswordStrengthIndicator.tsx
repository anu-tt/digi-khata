import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  confirmPassword?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  confirmPassword,
}) => {
  if (!password) return null;

  // Strength calculation
  let strength = 0; // 1: Weak, 2: Medium, 3: Strong
  if (password.length >= 4) strength = 1;
  if (password.length >= 6 && /[0-9]/.test(password)) strength = 2;
  if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) strength = 3;

  const getStrengthText = () => {
    switch (strength) {
      case 1:
        return { text: 'Kamzor (Weak)', color: 'bg-rose-500', textColor: 'text-rose-600', width: 'w-1/3' };
      case 2:
        return { text: 'Theek (Medium)', color: 'bg-amber-500', textColor: 'text-amber-600', width: 'w-2/3' };
      case 3:
        return { text: 'Mazboot (Strong)', color: 'bg-emerald-600', textColor: 'text-emerald-700', width: 'w-full' };
      default:
        return { text: 'Bohat Kamzor', color: 'bg-slate-300', textColor: 'text-slate-400', width: 'w-1/6' };
    }
  };

  const info = getStrengthText();

  const isMatched = confirmPassword !== undefined && confirmPassword !== '' && confirmPassword === password;
  const isMismatched = confirmPassword !== undefined && confirmPassword !== '' && confirmPassword !== password;

  return (
    <div className="space-y-1.5 mt-1.5">
      {/* Animated Strength Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${info.color} ${info.width}`}
          />
        </div>
        <span className={`text-[10px] font-bold ${info.textColor}`}>{info.text}</span>
      </div>

      {/* Match / Mismatch status when confirming password */}
      {confirmPassword !== undefined && confirmPassword !== '' && (
        <div className="flex items-center gap-1 text-[11px] font-semibold">
          {isMatched ? (
            <span className="text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Password Match Ho Gaya
            </span>
          ) : isMismatched ? (
            <span className="text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Password Match Nahi Ho Raha
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
};
