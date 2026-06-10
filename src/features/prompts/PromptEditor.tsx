import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Star } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  Link,
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { LoadingState } from "../../components/ui/LoadingState";
import { useToast } from "../../components/ui/toast-context";
import { getEntitlements } from "../billing/entitlement-api";
import type { PromptTemplate } from "../templates/template-api";
import { getPrompt, savePrompt } from "./prompt-api";
import {
  getPromptOrganization,
  syncPromptOrganization
} from "./organization-api";
import { OrganizationPicker } from "./OrganizationPicker";
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
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const isEditing = Boolean(promptId);
  const template = (
    location.state as { template?: PromptTemplate } | null
  )?.template;
  const entitlements = useQuery({
    enabled: !isEditing,
    queryFn: getEntitlements,
    queryKey: ["entitlements"]
  });
  const promptQuery = useQuery({
    enabled: isEditing,
    queryFn: () => getPrompt(promptId!),
    queryKey: promptKeys.detail(promptId ?? "")
  });
  const organizationQuery = useQuery({
    enabled: isEditing,
    queryFn: () => getPromptOrganization(promptId!),
    queryKey: [...promptKeys.detail(promptId ?? ""), "organization"]
  });
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue
  } = useForm<PromptFormValues>({
    defaultValues: defaultPromptValues,
    resolver: zodResolver(promptSchema)
  });
  const favorite = useWatch({ control, name: "favorite" });
  const folderIds = useWatch({ control, name: "folderIds" });
  const rating = useWatch({ control, name: "rating" });
  const tagIds = useWatch({ control, name: "tagIds" });

  useEffect(() => {
    if (!promptQuery.data) return;
    reset({
      ...defaultPromptValues,
      aiPlatform: promptQuery.data.ai_platform,
      category: promptQuery.data.category,
      description: promptQuery.data.description,
      favorite: promptQuery.data.favorite,
      folderIds: organizationQuery.data?.folderIds ?? [],
      promptText: promptQuery.data.prompt_text,
      rating: promptQuery.data.rating,
      status: promptQuery.data.status,
      tagIds: organizationQuery.data?.tagIds ?? [],
      title: promptQuery.data.title
    });
  }, [organizationQuery.data, promptQuery.data, reset]);

  useEffect(() => {
    if (isEditing || !template) return;
    reset({
      ...defaultPromptValues,
      aiPlatform: template.ai_platform,
      category: template.category,
      description: template.description,
      promptText: template.prompt_text,
      title: template.title
    });
  }, [isEditing, reset, template]);

  const mutation = useMutation({
    mutationFn: async (values: PromptFormValues) => {
      const prompt = await savePrompt(promptId ?? null, values);
      await syncPromptOrganization(prompt.id, values.folderIds, values.tagIds);
      return prompt;
    },
    onSuccess: async (prompt) => {
      await queryClient.invalidateQueries({ queryKey: promptKeys.all });
      await queryClient.invalidateQueries({ queryKey: ["entitlements"] });
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

  if (!isEditing && entitlements.data && !entitlements.data.allowed) {
    return (
      <section className="editor-page">
        <div className="limit-card">
          <span>Free plan limit</span>
          <h1>Your 25 prompts are working hard.</h1>
          <p>
            Archive or delete a prompt to make room, or upgrade when Pro billing
            becomes available.
          </p>
          <Button onClick={() => navigate("/")} variant="secondary">
            Return to library
          </Button>
        </div>
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
            <OrganizationPicker
              folderIds={folderIds}
              onFoldersChange={(ids) => setValue("folderIds", ids)}
              onTagsChange={(ids) => setValue("tagIds", ids)}
              tagIds={tagIds}
            />
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
