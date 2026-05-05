import { Fragment } from "react";

type Props = {
  text: string;
  className?: string;
};

export default function MarkdownText({ text, className }: Props) {
  const blocks = text.split(/\n{2,}/);

  return (
    <div className={className}>
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (trimmed === "") return null;

        if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
          return (
            <hr
              key={i}
              style={{
                border: 0,
                height: 1,
                background: "var(--color-linen)",
                margin: "14px 0",
              }}
            />
          );
        }

        return (
          <p
            key={i}
            style={{
              margin: i === 0 ? 0 : "10px 0 0",
              whiteSpace: "pre-wrap",
            }}
          >
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>,
      );
    }
    if (match[1]) {
      parts.push(
        <strong key={key++} style={{ fontWeight: 600, color: "inherit" }}>
          {match[1]}
        </strong>,
      );
    } else if (match[2] || match[3]) {
      parts.push(
        <em key={key++} style={{ fontStyle: "italic" }}>
          {match[2] ?? match[3]}
        </em>,
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }

  return parts;
}
