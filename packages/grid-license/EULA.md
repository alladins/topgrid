# End User License Agreement (EULA) — @topgrid/grid-license

This End User License Agreement ("Agreement") governs your use of the @topgrid/grid-license package.

## 1. License Grant

Subject to the terms of this Agreement and a valid license key issued by Topvel Inc., you are granted a non-exclusive, non-transferable license to use @topgrid/grid-license in your applications.

## 2. Permitted Use

You may use this software to build internal or commercial applications, provided that a valid license key is activated via `setLicenseKey()` from `@topgrid/grid-license`.

## 3. Restrictions

You may not:
- Redistribute or sublicense this package without written permission from Topvel Inc.
- Remove or alter license verification logic or watermark display.
- Use this package without a valid license key in production environments.

## 4. License Validation

This package provides the core license validation runtime. It validates your license key cryptographically using the Web Crypto API. Invalid or expired keys result in a watermark being displayed in consuming Pro packages.

For license inquiries, contact: license@topvel.io
