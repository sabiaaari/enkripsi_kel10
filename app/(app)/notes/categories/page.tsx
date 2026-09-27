import PageHeader from "@/components/PageHeader";
import NoteCard from "@/components/NoteCard";
import { notes, categoryMeta, colorMap } from "@/lib/data";

export default function CategoriesPage() {
  const categories = Object.keys(categoryMeta) as (keyof typeof categoryMeta)[];

  return (
    <div>
      <PageHeader title="Categories" subtitle="Notes, sorted into the piles they belong to" />
      <div className="flex flex-col gap-9">
        {categories.map((cat) => {
          const items = notes.filter((n) => n.category === cat);
          const meta = categoryMeta[cat];
          const c = colorMap[meta.color];
          return (
            <section key={cat}>
              <div className="flex items-center gap-2.5 mb-1">
                <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                <h2 className="font-display text-lg text-moya-text">{cat}</h2>
                <span className="text-xs text-moya-muted">· {items.length}</span>
              </div>
              <p className="text-sm text-moya-muted mb-3">{meta.description}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {items.map((n) => (
                  <NoteCard key={n.id} note={n} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
