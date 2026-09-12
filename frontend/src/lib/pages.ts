export const pages = [
  { path: '/', command: 'home', label: 'Home' },
  { path: '/interests', command: 'interests', label: 'Interests' },
  { path: '/photos', command: 'photos', label: 'Photos' },
  { path: '/blog', command: 'blog', label: 'Notes' },
  { path: '/experience', command: 'experience', label: 'Experience' },
  { path: '/projects', command: 'projects', label: 'Projects' },
  { path: '/resume', command: 'resume', label: 'Resume' },
  { path: '/testimonials', command: 'testimonials', label: 'Reviews' },
  { path: '/hackathons', command: 'hackathons', label: 'Hackathons' },
  { path: '/contact', command: 'contact', label: 'Contact' },
];

export const currentPath = () => window.location.pathname.replace(/\/+$/, '') || '/';

export function pageForCommand(value: string) {
  const name = value.replace(/^~?\//, '').replace(/\/$/, '');
  return pages.find(page => page.command === (name === 'reviews' ? 'testimonials' : name === 'notes' ? 'blog' : name || 'home'));
}
