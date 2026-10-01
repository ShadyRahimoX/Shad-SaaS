import React from 'react';

interface RequiredFieldsFormProps {
  fields: any[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  playerId?: string;
  onPlayerIdChange?: (pid: string) => void;
  className?: string;
}

export const RequiredFieldsForm: React.FC<RequiredFieldsFormProps> = ({
  fields = [],
  values = {},
  onChange,
  playerId = '',
  onPlayerIdChange,
  className = '',
}) => {
  const handleFieldChange = (key: string, val: string) => {
    onChange({
      ...values,
      [key]: val,
    });
  };

  return (
    <div className={`space-y-4 p-4 rounded-2xl bg-muted/30 border border-border/70 ${className}`} dir="rtl">
      {/* 1. Player/Account Identifier field */}
      {onPlayerIdChange && (
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-foreground">
            معرف الحساب / Player ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={playerId}
            onChange={(e) => onPlayerIdChange(e.target.value)}
            placeholder="أدخل معرّف الحساب، رقم اللاعب، أو رقم الهاتف"
            className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
      )}

      {/* 2. Specific custom requiredFields for this product */}
      {fields.map((field, idx) => {
        const fieldKey = field.label || field.name || `field_${idx}`;
        const fieldVal = values[fieldKey] || '';
        const fieldType = (field.type || 'text').toLowerCase();

        return (
          <div key={idx} className="space-y-1.5">
            <label className="block text-xs font-bold text-foreground">
              {field.label || `حقل مطلوب ${idx + 1}`} <span className="text-red-500">*</span>
            </label>

            {fieldType === 'select' && Array.isArray(field.options) ? (
              <select
                required
                value={fieldVal}
                onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="">اختر خياراً...</option>
                {field.options.map((opt: any, oIdx: number) => (
                  <option key={oIdx} value={typeof opt === 'string' ? opt : opt.value}>
                    {typeof opt === 'string' ? opt : opt.label || opt.value}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={
                  fieldType === 'email'
                    ? 'email'
                    : fieldType === 'tel' || fieldType === 'phone'
                    ? 'tel'
                    : fieldType === 'number'
                    ? 'number'
                    : 'text'
                }
                required
                value={fieldVal}
                onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                placeholder={field.placeholder || `أدخل ${field.label || 'المعلومة المطلوبة'}`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
