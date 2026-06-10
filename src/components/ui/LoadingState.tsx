type LoadingStateProps = {
  label?: string;
};

export function LoadingState({
  label = "Loading your prompt library"
}: LoadingStateProps) {
  return (
    <div className="ui-state" role="status">
      <span className="ui-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
