import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getPublicShare } from "@/lib/templates.functions";
import { ArrowRight, Sparkles } from "lucide-react";

const shareQuery = (slug: string) => queryOptions({
  queryKey: ["public-share", slug],
  queryFn: () => getPublicShare({ data: { slug } }),
});

export const Route = createFileRoute("/p/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(shareQuery(params.slug)),
  head: ({ loaderData }) => {
    const s = loaderData as Awaited<ReturnType<typeof getPublicShare>> | undefined;
    if (!s) return { meta: [{ title: "Shared project — AI Edit Studio" }] };
    const project = (s as { projects?: { name?: string } }).projects;
    const title = s.og_title || project?.name || "Shared edit";
    const desc = s.og_description || "A project shared from AI Edit Studio.";
    return {
      meta: [
        { title: `${title} — AI Edit Studio` },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        ...(s.og_image ? [{ property: "og:image", content: s.og_image }] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: SharePage,
  errorComponent: ({ error }) => <div className="p-10 text-sm text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-10">Share not found.</div>,
});

function SharePage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(shareQuery(slug));
  if (!data) throw notFound();
  const project = (data as { projects: { name: string; prompt: string | null; videos: { duration_sec: number | null } | null } }).projects;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-primary-gradient shadow-glow" />
          <span className="font-display text-sm font-semibold">AI Edit Studio</span>
        </Link>
        <Link to="/auth" className="text-xs text-muted-foreground hover:text-foreground">Sign in</Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-border bg-surface p-8 shadow-card">
          <div className="text-xs uppercase tracking-widest text-primary">Shared project</div>
          <h1 className="mt-2 font-display text-4xl font-semibold">{data.og_title || project.name}</h1>
          {data.og_description && <p className="mt-3 text-muted-foreground">{data.og_description}</p>}
          {project.prompt && <p className="mt-6 whitespace-pre-wrap rounded-xl bg-elevated/40 p-4 text-sm">{project.prompt}</p>}
          {data.allow_remix && (
            <Link to="/auth" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary-gradient px-5 py-3 text-sm font-medium text-primary-foreground shadow-glow">
              <Sparkles className="h-4 w-4" /> Remix this <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
