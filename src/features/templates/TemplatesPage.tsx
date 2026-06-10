import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { getTemplates } from "./template-api";

export function TemplatesPage() {
  const navigate = useNavigate();
  const templates = useQuery({
    queryFn: getTemplates,
    queryKey: ["templates"]
  });

  return (
    <section className="library-page">
      <header className="library-header">
        <div>
          <h1>Starter Templates</h1>
          <p>Proven prompt frameworks ready to adapt to your work.</p>
        </div>
      </header>

      {templates.isLoading ? (
        <div className="prompt-skeleton-grid template-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="prompt-skeleton" key={index} />
          ))}
        </div>
      ) : templates.isError ? (
        <div className="library-empty-preview">
          <h2>Templates are unavailable right now.</h2>
          <Button onClick={() => templates.refetch()}>Try again</Button>
        </div>
      ) : (
        <div className="prompt-grid template-grid">
          {templates.data?.map((template) => (
            <article className="template-card" key={template.id}>
              <div className="template-card__icon">
                <FileText size={20} />
              </div>
              <span>{template.category}</span>
              <h2>{template.title}</h2>
              <p>{template.description}</p>
              <button
                onClick={() =>
                  navigate("/prompts/new", { state: { template } })
                }
                type="button"
              >
                Use template <ArrowRight size={16} />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
