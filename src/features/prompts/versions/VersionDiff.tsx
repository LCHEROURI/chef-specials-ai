import { buildVersionDiff } from "./version-diff";

export function VersionDiff({
  currentText,
  previousText
}: {
  currentText: string;
  previousText: string;
}) {
  const changes = buildVersionDiff(previousText, currentText);

  return (
    <div className="version-diff" aria-label="Version changes">
      {changes.map((change, index) => (
        <span
          className={
            change.added
              ? "version-diff__added"
              : change.removed
                ? "version-diff__removed"
                : undefined
          }
          key={`${index}-${change.value}`}
        >
          {change.value}
        </span>
      ))}
    </div>
  );
}
