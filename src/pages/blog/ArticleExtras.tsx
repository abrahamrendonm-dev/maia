// Bloques del cuerpo del artículo compartidos entre la página pública
// (BlogPostPage.tsx) y la vista previa del editor (BlogPostPreview.tsx), para
// que ambas se vean exactamente igual.

export const PuntosClave = ({ items }: { items: string[] }) => {
  if (items.length === 0) return null;
  return (
    <aside
      aria-label="Puntos clave"
      className="bg-[#FFFDF9] border border-[#E2D9C8] rounded-2xl px-8 py-7 flex flex-col gap-3.5"
    >
      <span className="font-sans text-xs font-bold tracking-widest uppercase text-[#4A6352]">En resumen</span>
      <ul className="m-0 pl-5 flex flex-col gap-2.5 text-lg leading-relaxed">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </aside>
  );
};

export const SenalesAlarma = ({ items }: { items: string[] }) => {
  if (items.length === 0) return null;
  return (
    <div
      role="note"
      className="bg-[#FBF3EC] border border-[#E8CFB9] rounded-2xl px-8 py-7 flex flex-col gap-3.5"
    >
      <span className="font-sans flex items-center gap-2.5 text-[15px] font-bold text-[#7A4A28]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 3 2 20h20L12 3Z" />
          <path d="M12 10v4M12 17h.01" />
        </svg>
        Señales que merecen consulta
      </span>
      <ul className="m-0 pl-5 flex flex-col gap-2 text-lg leading-relaxed">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

export const Referencias = ({ items }: { items: string[] }) => {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="referencias" className="flex flex-col gap-3">
      <h2 id="referencias" className="font-sans m-0 text-xs font-bold tracking-widest uppercase text-[#5C6466]">
        Referencias
      </h2>
      <ol className="m-0 pl-5 flex flex-col gap-1.5 text-base leading-relaxed text-[#4A5254]">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ol>
    </section>
  );
};
