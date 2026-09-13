import { useEffect, useRef, useState } from 'react';
import { pages, pageForCommand } from '../lib/pages';
import { personal } from '../content/personal';

const commands = ['help','whoami','about',...pages.map(page => page.command),'ls','pwd','clear','cd','open'];
export default function InteractiveTerminal() {
  const [input,setInput] = useState('');
  const [lines,setLines] = useState([{ command: '', output: 'Welcome to my corner of the internet. Type help, or try a command below.' }]);
  const [history,setHistory] = useState<string[]>([]);
  const [cursor,setCursor] = useState(0);
  const output = useRef<HTMLDivElement>(null);
  useEffect(() => { if (output.current) output.current.scrollTop = output.current.scrollHeight; },[lines]);
  async function run(raw: string) {
    const command = raw.trim();
    if (!command) return;
    setInput(''); setHistory(prev => [...prev,command]); setCursor(history.length+1);
    if (command === 'clear') { setLines([]); return; }
    let result = '';
    const [cmd,...args] = command.toLowerCase().split(/\s+/);
    try {
      if (cmd === 'help') result = `${commands.join(' · ')}\nEnter a page name to open it: projects, experience, reviews…\nOr use cd projects / open experience. ↑/↓ history · Tab completes commands.\nwhoami and cat about.txt show information here.`;
      else if (cmd === 'whoami') result = 'Het Shah\nJunior Network and Security Engineer at Ray Secure Innovations Private Limited\nAhmedabad, Gujarat';
      else if (cmd === 'about' || (cmd === 'cat' && args[0] === 'about.txt')) result = personal.bio;
      else if (cmd === 'pwd') result = '/home/het';
      else if (cmd === 'ls') result = `about.txt  ${pages.map(page => `${page.command}/`).join('  ')}`;
      else if (cmd === 'cd' || cmd === 'open' || pageForCommand(cmd)) {
        const destination = cmd === 'cd' || cmd === 'open' ? args[0] || 'home' : cmd;
        const page = pageForCommand(destination);
        if (!page) result = `No such page: ${destination}. Try ls.`;
        else { window.location.assign(page.path); return; }
      } else result = `Command not found: ${cmd}. Type help to see what you can explore.`;
    } catch { result = 'Could not load that right now. Please try again.'; }
    setLines(prev => [...prev.slice(-49),{ command,output: result }]);
  }
  return <div className="interactive-shell">
    <div className="shell-output" ref={output} role="log" aria-live="polite" aria-label="Terminal output">{lines.map((line,i) => <div key={i}>{line.command && <div className="t-green">guest@het:~$ {line.command}</div>}<p>{line.output}</p></div>)}</div>
    <form onSubmit={e => { e.preventDefault(); void run(input); }} className="shell-prompt"><label htmlFor="shell-input" className="t-green">guest@het:~$</label><input id="shell-input" aria-label="Enter a command" autoComplete="off" spellCheck={false} maxLength={200} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {
      if (e.key === 'Tab') { e.preventDefault(); const prefix = /^(cd|open)\s+/.exec(input)?.[0] || ''; const matches=(prefix ? pages.map(p => p.command) : commands).filter(c => c.startsWith(input.slice(prefix.length))); if(matches.length===1) setInput(prefix + matches[0]); }
      if(e.key==='ArrowUp' || e.key==='ArrowDown') { e.preventDefault(); const next=Math.max(0,Math.min(history.length,cursor+(e.key==='ArrowUp'?-1:1))); setCursor(next);setInput(history[next] || ''); }
    }} /><button className="btn-term btn-term--sm">Run</button></form>
    <div className="d-flex flex-wrap gap-2 mt-3">{['help','whoami','projects','experience','contact'].map(cmd => <button className="btn-term btn-term--sm" key={cmd} onClick={() => void run(cmd)}>{cmd}</button>)}</div>
  </div>;
}
