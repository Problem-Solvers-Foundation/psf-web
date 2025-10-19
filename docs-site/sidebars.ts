import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: ['installation', 'configuration'],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: ['deployment', 'security', 'environment-variables'],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: ['architecture', 'tech-stack'],
    },
  ],
};

export default sidebars;
