import { Plus, X } from 'lucide-react';

interface StringListFieldProps {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
}

export const StringListField = ({ label, placeholder, values, onChange }: StringListFieldProps) => {
  const updateAt = (index: number, value: string) => {
    const next = [...values];
    next[index] = value;
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const add = () => onChange([...values, '']);

  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wide text-[#8B5E3C] mb-1">{label}</label>
      <div className="space-y-2">
        {values.map((value, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => updateAt(i, e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 rounded-xl border border-[#7A9482]/30 bg-white text-sm"
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label="Quitar línea"
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-[#8B5E3C] hover:bg-[#7A9482]/10"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#4A6352]"
        >
          <Plus size={16} />
          Agregar línea
        </button>
      </div>
    </div>
  );
};
