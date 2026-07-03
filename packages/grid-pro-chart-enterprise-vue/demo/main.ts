// 문서사이트용 Vue 3 엔터프라이즈 차트 **라이브 데모** 엔트리.
// esbuild 로 자립 번들(Vue + echarts + EnterpriseChartPanel)하여 apps/docs/static/vue-chart-demo/ 로
// 출력, 문서사이트가 iframe 으로 임베드한다(React 스토리북과 별개 — Vue 는 그 안에 없으므로).
import { createApp, h } from 'vue';
import { setLicenseState } from '@topgrid/grid-license-core';
import { EnterpriseChartPanel } from '@topgrid/grid-pro-chart-enterprise-vue';

// 데모이므로 유효 라이선스로 워터마크 제거(실제 앱은 setLicenseKey 로 발급 키 등록).
setLicenseState({ status: { valid: true }, rawKey: 'site-demo', setAt: 0 });

const data = {
  categories: ['1월', '2월', '3월', '4월', '5월', '6월'],
  series: [
    { name: '서울', values: [120, 200, 150, 180, 170, 210] },
    { name: '부산', values: [90, 130, 110, 160, 140, 175] },
    { name: '대구', values: [60, 95, 80, 120, 110, 130] },
  ],
};

createApp({
  setup() {
    return () =>
      h('div', { style: { fontFamily: 'Pretendard, system-ui, sans-serif', padding: '8px' } }, [
        h(EnterpriseChartPanel, {
          data,
          initialType: 'bar',
          toolbarTypes: ['bar', 'line', 'area', 'stacked-bar', 'radar', 'heatmap', 'pie'],
          enableExport: true,
        }),
      ]);
  },
}).mount('#app');
