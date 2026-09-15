import { Archive } from "@phosphor-icons/react/dist/ssr";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <Archive size={24} />
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}
