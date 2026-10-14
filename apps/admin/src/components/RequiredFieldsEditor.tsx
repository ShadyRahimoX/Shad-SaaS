import React from 'react';
import { type RequiredField } from '../lib/products';
import { Plus, Trash2, ArrowUp, ArrowDown, HelpCircle, ListFilter } from 'lucide-react';

interface RequiredFieldsEditorProps {
  value: RequiredField[];
  onChange: (fields: RequiredField[]) => void;
  disabled?: boolean;
}

export const RequiredFieldsEditor: React.FC<RequiredFieldsEditorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const handleAddField = () => {
    const newField: RequiredField = {
      type: 'text',
      label: '',
      name: '',
      placeholder: '',
      required: true,
      options: [],
    };
    onChange([...value, newField]);
  };

  const handleRemoveField = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...value];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    onChange(next);
  };

  const handleMoveDown = (index: number) => {
    if (index >= value.length - 1) return;
    const next = [...value];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    onChange(next);
  };

  const handleFieldChange = (index: number, updates: Partial<RequiredField>) => {
    const next = value.map((field, i) => {
      if (i !== index) return field;
      const updated = { ...field, ...updates };

      // Auto generate technical name from label if name is empty or was identical
      if (updates.label !== undefined && (!field.name || field.name === generateKey(field.label))) {
        updated.name = generateKey(updates.label);
      }
      return updated;
    });
    onChange(next);
  };

  const handleOptionsChange = (index: number, rawText: string) => {
    const options = rawText
      .split('\n')
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);
    handleFieldChange(index, { options });
  };

  const generateKey = (label: string) => {
    return label
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 40);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-primary" />
          <span className="font-black text-foreground text-xs">
            الحقول المطلوبة من العميل عند الشراء
          </span>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">
            {value.length}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAddField}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة حقل</span>
        </button>
      </div>

      {/* Empty State */}
      {value.length === 0 ? (
        <div className="p-4 rounded-2xl border border-dashed border-border bg-muted/20 text-center space-y-1">
          <HelpCircle className="w-6 h-6 text-muted-foreground/40 mx-auto" />
          <p className="text-xs text-muted-foreground font-medium">
            لا توجد حقول — سيتم شراء هذا المنتج بدون إدخال بيانات إضافية من العميل
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {value.map((field, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-card border border-border shadow-xs space-y-3 relative group"
            >
              {/* Field Bar */}
              <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-black font-mono flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <span className="font-bold text-foreground text-xs">
                    {field.label || 'حقل غير مسمى'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(idx)}
                    disabled={disabled || idx === 0}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 cursor-pointer"
                    title="تحريك لأعلى"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(idx)}
                    disabled={disabled || idx === value.length - 1}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 cursor-pointer"
                    title="تحريك لأسفل"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveField(idx)}
                    disabled={disabled}
                    className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 cursor-pointer"
                    title="حذف الحقل"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {/* Field Type */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground block text-[11px]">
                    نوع الإدخال
                  </label>
                  <select
                    value={field.type}
                    onChange={(e) => handleFieldChange(idx, { type: e.target.value as any })}
                    disabled={disabled}
                    className="w-full h-9 px-2.5 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/20"
                  >
                    <option value="text">نص عادي (Text)</option>
                    <option value="number">أرقام (Number)</option>
                    <option value="email">بريد إلكتروني (Email)</option>
                    <option value="tel">رقم هاتف (Tel)</option>
                    <option value="select">قائمة خيارات (Select)</option>
                  </select>
                </div>

                {/* Label (Required) */}
                <div className="space-y-1">
                  <label className="font-bold text-foreground block text-[11px]">
                    التسمية (تظهر للعميل) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={field.label}
                    onChange={(e) => handleFieldChange(idx, { label: e.target.value })}
                    disabled={disabled}
                    placeholder="مثال: رقم الحساب، معرف اللاعب"
                    className="w-full h-9 px-2.5 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/20"
                  />
                </div>

                {/* Technical Name */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground block text-[11px]">
                    الاسم التقني (Key)
                  </label>
                  <input
                    type="text"
                    value={field.name || ''}
                    onChange={(e) => handleFieldChange(idx, { name: e.target.value })}
                    disabled={disabled}
                    placeholder="player_id"
                    dir="ltr"
                    className="w-full h-9 px-2.5 rounded-xl bg-background border border-border text-foreground font-mono focus:outline-hidden focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Row 2: Placeholder & Required Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs items-center">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-muted-foreground block text-[11px]">
                    النص التوضيحي (Placeholder)
                  </label>
                  <input
                    type="text"
                    value={field.placeholder || ''}
                    onChange={(e) => handleFieldChange(idx, { placeholder: e.target.value })}
                    disabled={disabled}
                    placeholder="أدخل المعرف المكون من 10 أرقام..."
                    className="w-full h-9 px-2.5 rounded-xl bg-background border border-border text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/20"
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={field.required !== false}
                      onChange={(e) => handleFieldChange(idx, { required: e.target.checked })}
                      disabled={disabled}
                      className="w-4 h-4 rounded-md text-primary focus:ring-primary/20"
                    />
                    <span className="font-bold text-foreground text-[11px]">حقل إلزامي للشراء</span>
                  </label>
                </div>
              </div>

              {/* Options textarea if type === select */}
              {field.type === 'select' && (
                <div className="space-y-1 pt-1 border-t border-border/40">
                  <label className="font-bold text-foreground block text-[11px]">
                    خيارات القائمة المنسدلة (خيار واحد في كل سطر) <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={(field.options || []).join('\n')}
                    onChange={(e) => handleOptionsChange(idx, e.target.value)}
                    disabled={disabled}
                    placeholder="سيرفر أوروبا&#10;سيرفر أمريكا&#10;سيرفر آسيا"
                    className="w-full p-2.5 rounded-xl bg-background border border-border text-foreground font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequiredFieldsEditor;
