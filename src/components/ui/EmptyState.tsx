import type { ReactNode } from "react";

type EmptyStateProps = {
  action?: ReactNode;
  description: string;
  title: string;
};

export function EmptyState({
  action,
  description,
  title
}: EmptyStateProps) {
  return (
    <section className="ui-state">
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </section>
  );
}
