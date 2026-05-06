import { CopyButton } from "@/components/CopyButton";

type MessageCardProps = {
  title: string;
  body: string;
};

export function MessageCard({ title, body }: MessageCardProps) {
  return (
    <section className="card space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        <CopyButton text={body} />
      </div>
      <pre className="whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-50">{body}</pre>
    </section>
  );
}
