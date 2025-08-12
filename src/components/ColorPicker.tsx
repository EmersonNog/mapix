// src/components/ColorPicker.tsx
import { useMemo, useState } from "react";

type Props = {
  palette: number[]; // valores salvos no app
  value: number;
  onChange: (c: number) => void;
  disabled?: boolean;
  swatchColors?: string[]; // aparência (hex)
  initialCount?: number; // default 10
};

export default function ColorPicker({
  palette,
  value,
  onChange,
  disabled,
  swatchColors,
  initialCount = 10,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const total = palette.length;
  const visible = expanded ? total : Math.min(initialCount, total);

  const names = useMemo(
    () =>
      [
        "Branco",
        "Preto",
        "Vermelho",
        "Laranja",
        "Amarelo",
        "Verde",
        "Ciano",
        "Azul",
        "Roxo",
        "Rosa",
        "Lima",
        "Rosa claro",
        "Petróleo",
        "Lilás",
        "Marrom",
        "Amarelo claro",
        "Vinho",
        "Menta",
        "Oliva",
        "Pêssego",
        "Marinho",
        "Cinza",
      ].slice(0, total),
    [total]
  );

  return (
    <div className={`picker ${disabled ? "disabled" : ""}`}>
      <span className="picker__label">Cor:</span>

      <div className="palette" role="toolbar" aria-label="Selecionar cor">
        {palette.slice(0, visible).map((c, i) => {
          const hex = swatchColors?.[i];
          const selected = value === c;
          return (
            <button
              key={`${c}-${i}`}
              type="button"
              className={`swatch ${selected ? "is-selected" : ""}`}
              aria-pressed={selected}
              aria-label={names[i] ?? `Cor ${i + 1}`}
              title={names[i] ?? hex ?? `Cor ${i + 1}`}
              onClick={() => !disabled && onChange(c)}
              disabled={disabled}
            >
              <span className="swatch__inner" style={{ background: hex }} />
              {selected && (
                <svg
                  className="swatch__check"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M20.3 5.7a1 1 0 0 1 0 1.4l-10 10a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.4L9 14.59 18.9 4.7a1 1 0 0 1 1.4 1z" />
                </svg>
              )}
            </button>
          );
        })}

        {total > initialCount && (
          <button
            type="button"
            className="palette__more"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Menos cores" : "Mais cores"}
          </button>
        )}
      </div>
    </div>
  );
}
