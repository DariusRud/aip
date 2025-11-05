import { useRef } from 'react';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  label?: string;
}

export function DateInput({ value, onChange, required, className, label }: DateInputProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    dateInputRef.current?.showPicker();
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={value || 'YYYY-MM-DD'}
          readOnly
          onClick={handleClick}
          placeholder="YYYY-MM-DD"
          className={className || "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"}
        />
        <input
          ref={dateInputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}
