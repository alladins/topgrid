// 이 모듈은 vue import 보다 *먼저* 평가되어야 한다(ESM 호이스팅): Vue runtime-dom 이 모듈
// 평가 시점에 global `document` 를 캡처하므로, 그 전에 happy-dom 을 등록해야 한다.
// 테스트 파일에서 vue 보다 앞선 첫 import 로 둔다.
import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register();
