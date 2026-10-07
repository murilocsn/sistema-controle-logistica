type PlaceholderPageProps = {
  title: string;
};

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-signal-600">{title}</p>
        <h1 className="mt-1 text-2xl font-semibold text-graphite-900">{title}</h1>
      </div>

      <div className="rounded border border-graphite-100 bg-white px-4 py-10 text-sm text-graphite-700 shadow-subtle">
        Sem registros.
      </div>
    </section>
  );
}
