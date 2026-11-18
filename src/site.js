// Everything you may want to rename lives here.
export const SITE = {
  name: 'Pimbo Studio',
  github: 'https://github.com/Pimboto/claude-skills',
  profile: 'https://github.com/Pimboto',
  portfolio: 'https://pimbo.dev',
};

export const repoLink = (path) => (path ? `${SITE.github}/tree/main/skills/${path}` : SITE.github);
export const downloadLink = (id) => `downloads/${id}.zip`;
