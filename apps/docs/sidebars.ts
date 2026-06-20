import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    'getting-started',
    'charting',
    'nextjs-ssr',
    'architecture',
    'comparison',
    {
      type: 'category',
      label: '마이그레이션',
      items: [
        'migration/variant-table',
        'migration/dataTable-migration',
        'migration/deprecated-aliases',
        'migration/incremental-strategy',
        'migration/live-demos',
      ],
    },
  ],
};

export default sidebars;
