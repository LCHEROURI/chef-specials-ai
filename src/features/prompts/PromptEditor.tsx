import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Star } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { LoadingState } from "../../components/ui/LoadingState";
import { useToast } from "../../components/ui/toast-context";
import { getPrompt, savePrompt } from "./prompt-api";
import { promptKeys } from "./prompt-keys";
import {
  defaultPromptValues,
  promptSchema,
  type PromptFormValues
} from "./prompt-schema";

const categories = [
  "Business",
  "Marketing",
  "Sales",
  "Hospitality",
  "Restaurants",
  "Coding",
  "Lovable",
  "Codex",
  "OpenAI Agents",
  "Vibe Coding",
  "Content Creation",
  "Social Media",
  "Research",
  "Customer Service",
  "Automation",
  "Productivity",
  "Custom"
];

const platforms = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "Grok",
  "Codex",
  "Lovable",
  "Cursor",
  "Bolt",
  "Replit",
  "Freebuff AI",
  "Custom"
];

export function PromptEditor() {
  const { promptId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const isEditing = Boolean(promptId);
  const promptQuery = useQuery({
    enabled: isEditing,
    queryFn: () => getPrompt(promptId!),
    queryKey: promptKeys.detail(promptId ?? "")
  });
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<PromptFormValues>({
    defaultValues: defaultPromptValues,
    resolver: zodResolver(promptSchema)
  });
  const favorite = useWatch({ control, name: "favorite" });
  const rating = useWatch({ control, name: "rating" });

  useEffect(() => {
    if (!promptQuery.data) return;
    reset({
      ...defaultPromptValues,
      aiPlatform: promptQuery.data.ai_platform,
      category: promptQuery.data.category,
      description: promptQuery.data.description,
      favorite: promptQuery.data.favorite,
      promptText: promptQuery.data.prompt_text,
      rating: promptQuery.data.rating,
      status: promptQuery.data.status,
      title: promptQuery.data.title
    });
  }, [promptQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (values: PromptFormValues) =>
      savePrompt(promptId ?? null, values),
    onSuccess: async (prompt) => {
      await queryClient.invalidateQueries({ queryKey: promptKeys.all });
      notify(isEditing ? "Prompt updated" : "Prompt saved");
      navigate(`/prompts/${prompt.id}`);
    }
  });

  if (promptQuery.isLoading) {
    return <LoadingState label="Loading prompt..." />;
  }

  if (promptQuery.isError) {
    return (
      <section className="editor-page">
        <p className="form-error">We could not load this prompt.</p>
        <Link to="/">Return to library</Link>
      </section>
    );
  }

  return (
    <section className="editor-page">
      <header className="page-titlebar">
        <div>
          <Link className="back-link" to={promptId ? `/prompts/${promptId}` : "/"}>
            <ArrowLeft aria-hidden="true" size={17} /> Back
          </Link>
          <h1>{isEditing ? "Edit prompt" : "Create a prompt"}</h1>
          <p>
            {isEditing
              ? "Saving changed prompt content automatically creates a version."
              : "Build a reusable prompt for your AI toolkit."}
          </p>
        </div>
      </header>

      <form
        className="prompt-editor"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="prompt-editor__main">
          <Input
            error={errors.title?.message}
            label="Title"
            placeholder="Example: Restaurant menu analysis"
            {...register("title")}
          />

          <label className="ui-field">
            <span className="ui-field__label">Description</span>
            <textarea
              className="ui-input prompt-description"
              placeholder="What does this prompt help you accomplish?"
              {...register("description")}
            />
            {errors.description ? (
              <span className="ui-field__error">
                {errors.description.message}
              </span>
            ) : null}
          </label>

          <label className="ui-field">
            <span className="ui-field__label">Prompt content</span>
            <textarea
              className="ui-input prompt-content"
              placeholder="Write or paste your prompt here..."
              {...register("promptText")}
            />
            {errors.promptText ? (
              <span className="ui-field__error">
                {errors.promptText.message}
              </span>
            ) : (
              <span className="ui-field__hint">
                Variables such as {"{{business_name}}"} make prompts easier to
                reuse.
              </span>
            )}
          </label>

          {isEditing ? (
            <Input
              label="Change notes"
              placeholder="What changed in this version?"
              {...register("changeNotes")}
            />
          ) : null}
        </div>

        <aside className="prompt-editor__sidebar">
          <div className="editor-card">
            <h2>Organization</h2>
            <label className="ui-field">
              <span className="ui-field__label">Category</span>
              <select className="ui-input" {...register("category")}>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="ui-field">
              <span className="ui-field__label">AI platform</span>
              <select className="ui-input" {...register("aiPlatform")}>
                {platforms.map((platform) => (
                  <option key={platform}>{platform}</option>
                ))}
              </select>
            </label>
            <label className="ui-field">
              <span className="ui-field__label">Rating</span>
              <select
                className="ui-input"
                value={rating ?? ""}
                onChange={(event) =>
                  setValue(
                    "rating",
                    event.target.value ? Number(event.target.value) : null
                  )
                }
              >
                <option value="">Not rated</option>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} / 5
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            aria-pressed={favorite}
            className={`favorite-toggle ${favorite ? "is-active" : ""}`}
            onClick={() => setValue("favorite", !favorite)}
            type="button"
          >
            <Star aria-hidden="true" fill={favorite ? "currentColor" : "none"} />
            {favorite ? "Saved as favorite" : "Add to favorites"}
          </button>

          {mutation.isError ? (
            <p className="form-error">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "We could not save this prompt."}
            </p>
          ) : null}

          <div className="editor-actions">
            <Button loading={mutation.isPending} type="submit">
              <Save aria-hidden="true" size={17} />
              {isEditing ? "Save changes" : "Save prompt"}
            </Button>
            <Button onClick={() => navigate(-1)} variant="secondary">
              Cancel
            </Button>
          </div>
        </aside>
      </form>
    </section>
  );
}
