import type { default as jsPDFType } from 'jspdf';

/**
 * jsPDF 인스턴스에 한국어 폰트를 등록한다.
 *
 * @param pdf - jsPDF 인스턴스
 *
 * @remarks
 * **⚠️ STUB 구현 (W1 리스크)**
 *
 * 실 폰트 base64 데이터가 미확보 상태이므로 현재 no-op 로 동작합니다.
 * `fontFamily: 'korean'` 사용 시 Helvetica(기본 폰트)로 fallback되며 한국어 글자가 깨질 수 있습니다.
 *
 * **실 구현 방법 (V1 목표)**:
 * 1. 폰트 라이선스 확인: NotoSansKR (OFL 1.1 — 임베딩 허용) 또는 NanumGothic (OFL 1.1)
 * 2. 폰트 파일을 base64로 변환: `Buffer.from(fs.readFileSync('NotoSansKR.ttf')).toString('base64')`
 * 3. 아래 주석 해제 + base64 문자열 삽입:
 *    ```
 *    const fontBase64 = '<base64-string>';
 *    pdf.addFileToVFS('NotoSansKR.ttf', fontBase64);
 *    pdf.addFont('NotoSansKR.ttf', 'NotoSansKR', 'normal');
 *    pdf.setFont('NotoSansKR');
 *    ```
 *
 * @see https://github.com/parallax/jsPDF#use-of-unicode-characters--utf-8
 */
export async function loadKoreanFont(pdf: jsPDFType): Promise<void> {
  // TODO(V1): 폰트 base64 데이터 확보 후 아래 구현 활성화
  // 폰트 파일 라이선스: NotoSansKR OFL 1.1 또는 NanumGothic OFL 1.1 권장
  // 참고: spec Section 11 W1, Section 12 V1

  // 현재 stub 상태 — pdf 파라미터는 V1 구현 시 사용됨
  void pdf;

  console.warn(
    '[grid-export] exportToPdf: fontFamily: "korean" 옵션은 stub 상태입니다. ' +
      '한국어 글자가 깨질 수 있습니다. ' +
      'loadKoreanFont.ts V1 구현 완료 후 사용하세요. (spec Section 12 V1)',
  );
}
