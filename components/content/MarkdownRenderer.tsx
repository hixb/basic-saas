import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="space-y-6 text-[17px] leading-8 text-[#39342e]">
      <ReactMarkdown
        components={{
          a: ({ children, ...props }) => (
            <a className="font-semibold text-[#b8462f] underline-offset-4 hover:underline" rel="noreferrer" target="_blank" {...props}>
              {children}
            </a>
          ),
          img: ({ alt, ...props }) => (
            <img alt={alt ?? ''} className="mx-auto max-h-[520px] w-auto max-w-full rounded-lg object-contain" {...props} />
          ),
          video: ({ children, ...props }) => (
            <video className="w-full rounded-lg bg-black" controls {...props}>
              {children}
            </video>
          ),
          h1: ({ children }) => <h2 className="font-serif text-4xl leading-tight text-[#28231d]">{children}</h2>,
          h2: ({ children }) => <h2 className="font-serif text-3xl leading-tight text-[#28231d]">{children}</h2>,
          h3: ({ children }) => <h3 className="font-serif text-2xl leading-tight text-[#28231d]">{children}</h3>,
          li: ({ children }) => <li className="ml-5 list-disc pl-1">{children}</li>,
          p: ({ children }) => <p className="max-w-3xl">{children}</p>,
          table: ({ children }) => <div className="overflow-x-auto"><table className="min-w-full border-collapse text-sm">{children}</table></div>,
          td: ({ children }) => <td className="border border-[#28231d]/10 px-3 py-2">{children}</td>,
          th: ({ children }) => <th className="border border-[#28231d]/10 bg-[#f4efe7] px-3 py-2 text-left">{children}</th>,
        }}
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
