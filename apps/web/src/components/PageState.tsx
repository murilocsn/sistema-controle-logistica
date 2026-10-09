type MessageProps = {
  title: string;
  description?: string;
};

export function LoadingState({ title = "Carregando..." }: Partial<MessageProps>) {
  return (
    <div className="rounded border border-graphite-100 bg-white px-4 py-8 text-sm text-graphite-700 shadow-subtle">
      {title}
    </div>
  );
}

export function EmptyState({ title, description }: MessageProps) {
  return (
    <div className="rounded border border-graphite-100 bg-white px-4 py-8 text-sm text-graphite-700 shadow-subtle">
      <p className="font-medium text-graphite-900">{title}</p>
      {description ? <p className="mt-1">{description}</p> : null}
    </div>
  );
}

export function ErrorState({ title, description }: MessageProps) {
  return (
    <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <p className="font-medium">{title}</p>
      {description ? <p className="mt-1">{description}</p> : null}
    </div>
  );
}
