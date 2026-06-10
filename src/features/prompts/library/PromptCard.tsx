import { Check, Copy, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { LibraryPrompt } from "./library-api";

type PromptCardProps = {
  compact?: boolean;
  onCopy: (prompt: LibraryPrompt) => Promise<void>;
  onFavorite: (prompt: LibraryPrompt) => void;
  prompt: LibraryPrompt;
};

export function PromptCard({
  compact = false,
  onCopy,
  onFavorite,
  prompt
}: PromptCardProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await onCopy(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <article className={compact ? "prompt-row" : "prompt-card"}>
      <Link className="prompt-card__body" to={`/prompts/${prompt.id}`}>
        <div className="prompt-card__eyebrow">
          <span>{prompt.category}</span>
          <span>{prompt.ai_platform}</span>
        </div>
        <h2>{prompt.title}</h2>
        <p>{prompt.description || prompt.prompt_text}</p>
        <div className="prompt-card__meta">
          <span>{prompt.rating ? `${prompt.rating}/5` : "Unrated"}</span>
          <span>
            Updated {new Date(prompt.updated_at).toLocaleDateString()}
          </span>
        </div>
      </Link>
      <div className="prompt-card__actions">
        <button
          aria-label={copied ? "Prompt copied" : `Copy ${prompt.title}`}
          onClick={copy}
          type="button"
        >
          {copied ? <Check size={17} /> : <Copy size={17} />}
        </button>
        <button
          aria-label={
            prompt.favorite
              ? `Remove ${prompt.title} from favorites`
              : `Add ${prompt.title} to favorites`
          }
          className={prompt.favorite ? "is-favorite" : ""}
          onClick={() => onFavorite(prompt)}
          type="button"
        >
          <Star fill={prompt.favorite ? "currentColor" : "none"} size={18} />
        </button>
      </div>
    </article>
  );
}
