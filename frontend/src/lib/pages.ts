export const pages = [
  { path: '/', command: 'home', label: 'Home' },
  { path: '/experience', command: 'experience', label: 'Experience' },
  { path: '/projects', command: 'projects', label: 'Projects' },
  { path: '/lab', command: 'lab', label: 'Lab', section: 'lab' },
  { path: '/journal', command: 'journal', label: 'Journal', section: 'journal' },
  { path: '/contact', command: 'contact', label: 'Contact' },
  { path: '/resume', command: 'resume', label: 'Resume', more: true },
  { path: '/testimonials', command: 'testimonials', label: 'Reviews', more: true },
  { path: '/hackathons', command: 'hackathons', label: 'Hackathons', more: true },
];

export const sectionPages = [
  {path:'/lab/certifications',command:'certifications',label:'Certifications',section:'lab'},
  {path:'/journal/photos',command:'photos',label:'Photos',section:'journal'},
  {path:'/journal/interests',command:'interests',label:'Interests',section:'journal'},
  {path:'/journal/now',command:'now',label:'Now',section:'journal'},
];

export const currentPath = () => window.location.pathname.replace(/\/+$/, '') || '/';

export function pageForCommand(value: string) {
  const name = value.replace(/^~?\//, '').replace(/\/$/, '');
  return [...pages,...sectionPages].find(page => page.command === (name === 'reviews' ? 'testimonials' : name || 'home'));
}
