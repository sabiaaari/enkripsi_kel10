export default function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-7">
      <h1 className="font-display text-3xl text-moya-text">{title}</h1>
      {subtitle && <p className="text-moya-muted mt-1.5 text-[15px]">{subtitle}</p>}
    </div>
  );
}
