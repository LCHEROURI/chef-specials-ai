import { Grid2X2, List, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";

export function LibraryPlaceholder() {
  const navigate = useNavigate();

  return (
    <section className="library-page">
      <header className="library-header">
        <div>
          <h1>Prompt Library</h1>
          <p>Your best AI prompts, organized and ready to use.</p>
        </div>
        <div className="library-header__actions">
          <label className="library-search">
            <Search aria-hidden="true" size={19} />
            <span className="sr-only">Search prompts</span>
            <input placeholder="Search prompts..." type="search" />
          </label>
          <Button onClick={() => navigate("/prompts/new")}>
            New prompt <Plus aria-hidden="true" size={18} />
          </Button>
        </div>
      </header>

      <div className="library-toolbar">
        <div className="library-filters">
          <button type="button">Category</button>
          <button type="button">Platform</button>
          <button type="button">Rating</button>
          <button type="button">Favorites</button>
        </div>
        <div className="view-switcher" aria-label="Library view">
          <button aria-label="Grid view" className="is-active" type="button">
            <Grid2X2 aria-hidden="true" size={18} />
          </button>
          <button aria-label="List view" type="button">
            <List aria-hidden="true" size={19} />
          </button>
        </div>
      </div>

      <div className="library-empty-preview">
        <div>
          <h2>Your prompt library starts here.</h2>
          <p>
            Create your first prompt or begin from a professionally designed
            template.
          </p>
        </div>
        <Button onClick={() => navigate("/prompts/new")}>
          Create first prompt
        </Button>
      </div>
    </section>
  );
}
