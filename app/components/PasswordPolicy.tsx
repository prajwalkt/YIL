import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordPolicyProps {
  password?: string;
  dark?: boolean;
}

export default function PasswordPolicy({ password = '', dark = false }: PasswordPolicyProps) {
  const rules = [
    { label: 'Minimum 8 characters', met: password.length >= 8 },
    { label: 'At least one uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'At least one lowercase letter', met: /[a-z]/.test(password) },
    { label: 'At least one number', met: /[0-9]/.test(password) },
    { label: 'At least one special character', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];

  const allMet = rules.every(r => r.met);
  const isEmpty = password.length === 0;

  if (isEmpty) {
    return (
      <div className={`mt-2 p-3 border rounded-xl ${dark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
        <p className={`text-xs font-semibold mb-2 ${dark ? 'text-white/80' : 'text-slate-600'}`}>Password must contain:</p>
        <ul className="space-y-1">
          {rules.map((rule, idx) => (
            <li key={idx} className={`flex items-center text-xs ${dark ? 'text-white/50' : 'text-slate-500'}`}>
              <span className={`w-4 h-4 mr-2 flex items-center justify-center rounded-full ${dark ? 'bg-white/10 text-white/30' : 'bg-slate-200 text-slate-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${dark ? 'bg-white/30' : 'bg-slate-400'}`}></div>
              </span>
              {rule.label}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={`mt-2 p-3 border rounded-xl ${allMet ? (dark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200') : (dark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}`}>
      <p className={`text-xs font-semibold mb-2 ${allMet ? (dark ? 'text-green-400' : 'text-green-700') : (dark ? 'text-white/80' : 'text-slate-600')}`}>
        {allMet ? 'Password meets all requirements' : 'Password must contain:'}
      </p>
      <ul className="space-y-1">
        {rules.map((rule, idx) => (
          <li key={idx} className={`flex items-center text-xs ${rule.met ? 'text-green-600' : 'text-red-500'}`}>
            {rule.met ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <X className="w-4 h-4 mr-2" />
            )}
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
