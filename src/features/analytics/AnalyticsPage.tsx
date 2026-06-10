import { useQuery } from "@tanstack/react-query";
import { BarChart3, Copy, Star, WandSparkles } from "lucide-react";
import { getAnalytics } from "./analytics-api";

export function AnalyticsPage() {
  const analytics = useQuery({
    queryFn: getAnalytics,
    queryKey: ["analytics"]
  });

  if (!analytics.data) {
    return (
      <section className="library-page">
        <div className="prompt-skeleton" aria-label="Loading analytics" />
      </section>
    );
  }

  const data = analytics.data;
  const maxCategory = Math.max(1, ...data.categories.map((item) => item[1]));

  return (
    <section className="library-page">
      <header className="library-header">
        <div>
          <h1>Analytics</h1>
          <p>See which prompts and tools create the most value.</p>
        </div>
      </header>
      <div className="metric-grid">
        <article><WandSparkles /><strong>{data.total}</strong><span>Total prompts</span></article>
        <article><Star /><strong>{data.favorites}</strong><span>Favorites</span></article>
        <article><Copy /><strong>{data.totalUses}</strong><span>Total uses</span></article>
        <article><BarChart3 /><strong>{data.categories.length}</strong><span>Categories</span></article>
      </div>
      <div className="analytics-grid">
        <section className="analytics-card">
          <h2>Category distribution</h2>
          <div className="bar-list">
            {data.categories.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span><strong>{value}</strong>
                <i style={{ width: `${(value / maxCategory) * 100}%` }} />
              </div>
            ))}
          </div>
        </section>
        <section className="analytics-card">
          <h2>Most used prompts</h2>
          <ol className="ranking-list">
            {data.mostUsed.map((item) => (
              <li key={item.prompt_id}><span>{item.title}</span><strong>{item.use_count} uses</strong></li>
            ))}
          </ol>
        </section>
        <section className="analytics-card">
          <h2>Platform usage</h2>
          <ol className="ranking-list">
            {data.platforms.map(([label, value]) => (
              <li key={label}><span>{label}</span><strong>{value}</strong></li>
            ))}
          </ol>
        </section>
        <section className="analytics-card">
          <h2>Highest rated</h2>
          <ol className="ranking-list">
            {data.highestRated.map((prompt) => (
              <li key={prompt.id}><span>{prompt.title}</span><strong>{prompt.rating}/5</strong></li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  );
}
