import type { ReactNode } from 'react';

// Render mínimo del JSON que produce el editor Tiptap (jsonb en blog_posts.content).
// Cubre los nodos/marcas más comunes de un post de blog; si el editor real agrega
// nodos custom (embeds, etc.) esto se extiende cuando haga falta.

interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  text?: string;
  marks?: TiptapMark[];
  content?: TiptapNode[];
}

function renderText(node: TiptapNode, key: number): ReactNode {
  let el: ReactNode = node.text ?? '';

  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case 'bold':
        el = <strong>{el}</strong>;
        break;
      case 'italic':
        el = <em>{el}</em>;
        break;
      case 'strike':
        el = <s>{el}</s>;
        break;
      case 'code':
        el = <code className="bg-black/5 px-1 rounded">{el}</code>;
        break;
      case 'link':
        el = (
          <a
            href={typeof mark.attrs?.href === 'string' ? mark.attrs.href : '#'}
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            {el}
          </a>
        );
        break;
    }
  }

  return <span key={key}>{el}</span>;
}

function renderChildren(nodes: TiptapNode[] | undefined): ReactNode[] {
  return (nodes ?? []).map((node, i) => renderNode(node, i));
}

function renderNode(node: TiptapNode, key: number): ReactNode {
  switch (node.type) {
    case 'paragraph':
      return (
        <p key={key} className="mb-6 leading-relaxed">
          {renderChildren(node.content)}
        </p>
      );
    case 'heading': {
      const level = typeof node.attrs?.level === 'number' ? node.attrs.level : 2;
      const className = 'mt-10 mb-4 font-semibold';
      const children = renderChildren(node.content);
      switch (level) {
        case 1:
          return <h2 key={key} className={`text-3xl ${className}`}>{children}</h2>;
        case 3:
          return <h4 key={key} className={`text-xl ${className}`}>{children}</h4>;
        default:
          return <h3 key={key} className={`text-2xl ${className}`}>{children}</h3>;
      }
    }
    case 'bulletList':
      return (
        <ul key={key} className="list-disc pl-6 mb-6 space-y-2">
          {renderChildren(node.content)}
        </ul>
      );
    case 'orderedList':
      return (
        <ol key={key} className="list-decimal pl-6 mb-6 space-y-2">
          {renderChildren(node.content)}
        </ol>
      );
    case 'listItem':
      return <li key={key}>{renderChildren(node.content)}</li>;
    case 'blockquote':
      return (
        <blockquote key={key} className="border-l-2 border-current/30 pl-4 italic mb-6">
          {renderChildren(node.content)}
        </blockquote>
      );
    case 'image':
      return (
        <img
          key={key}
          src={typeof node.attrs?.src === 'string' ? node.attrs.src : ''}
          alt={typeof node.attrs?.alt === 'string' ? node.attrs.alt : ''}
          className="w-full mb-6 rounded"
        />
      );
    case 'hardBreak':
      return <br key={key} />;
    case 'text':
      return renderText(node, key);
    default:
      return node.content ? <span key={key}>{renderChildren(node.content)}</span> : null;
  }
}

export function renderTiptapContent(content: unknown): ReactNode {
  const doc = content as TiptapNode | null;
  if (!doc || !Array.isArray(doc.content)) return null;
  return renderChildren(doc.content);
}
