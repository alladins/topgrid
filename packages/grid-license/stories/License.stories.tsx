import type { Meta, StoryObj } from '@storybook/react';
import { Watermark } from '../src/Watermark.js';
import { setLicenseState } from '../src/state.js';
import { checkLicense } from '../src/checkLicense.js';

const meta: Meta<typeof Watermark> = {
  title: 'grid-license/Watermark',
  component: Watermark,
};
export default meta;
type Story = StoryObj<typeof Watermark>;

export const Unlicensed: Story = {
  beforeEach() {
    /* state null → getLicenseState → {valid:false} */
  },
  render: () => {
    const result = checkLicense();
    return <Watermark required={result.watermarkRequired} />;
  },
};

export const Licensed: Story = {
  beforeEach() {
    setLicenseState({
      status: { valid: true, expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000) },
      rawKey: 'mock-key',
      setAt: Date.now(),
    });
  },
  render: () => {
    const result = checkLicense();
    return <Watermark required={result.watermarkRequired} />;
  },
};

export const SoonExpiring: Story = {
  beforeEach() {
    setLicenseState({
      status: { valid: true, expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000) },
      rawKey: 'mock-key',
      setAt: Date.now(),
    });
  },
  render: () => {
    const result = checkLicense();
    return <Watermark required={result.watermarkRequired} />;
  },
};
