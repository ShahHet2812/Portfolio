import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

const schema = { ...defaultSchema, attributes:{...defaultSchema.attributes,a:[...(defaultSchema.attributes?.a||[]),'target','rel'],code:[...(defaultSchema.attributes?.code||[]),'className']} };
const safeUrl = (url:string) => /^(https?:|mailto:|\/)/i.test(url) ? url : '';

export default function SafeMarkdown({children}:{children:string}) {
  return <div className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeSanitize,schema]]}
    urlTransform={safeUrl} components={{a:({href,...props})=><a href={href} {...(/^https?:/i.test(href||'')?{target:'_blank',rel:'noopener noreferrer'}:{})} {...props}/>}}>{children}</ReactMarkdown></div>;
}
