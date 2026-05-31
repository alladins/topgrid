import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/en/',
    component: ComponentCreator('/en/', '661'),
    routes: [
      {
        path: '/en/',
        component: ComponentCreator('/en/', '4e0'),
        routes: [
          {
            path: '/en/',
            component: ComponentCreator('/en/', '08f'),
            routes: [
              {
                path: '/en/architecture',
                component: ComponentCreator('/en/architecture', 'b91'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/en/getting-started',
                component: ComponentCreator('/en/getting-started', '16e'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/en/migration/dataTable-migration',
                component: ComponentCreator('/en/migration/dataTable-migration', '16e'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/en/migration/deprecated-aliases',
                component: ComponentCreator('/en/migration/deprecated-aliases', 'd40'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/en/migration/incremental-strategy',
                component: ComponentCreator('/en/migration/incremental-strategy', 'da1'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/en/migration/live-demos',
                component: ComponentCreator('/en/migration/live-demos', '489'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/en/migration/variant-table',
                component: ComponentCreator('/en/migration/variant-table', '85a'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/en/',
                component: ComponentCreator('/en/', '119'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
