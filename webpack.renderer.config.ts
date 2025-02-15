import type { Configuration } from 'webpack';
import * as path from 'path';
import { DefinePlugin } from 'webpack';
import dotenv from 'dotenv';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

// Load environment variables
dotenv.config();

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins: [
    new DefinePlugin({
      'process.env.ENABLE_ANALYTICS_TEST': JSON.stringify(process.env.ENABLE_ANALYTICS_TEST),
      'process.env.POSTHOG_API_KEY': JSON.stringify(process.env.POSTHOG_API_KEY),
    }),
    ...plugins,
  ],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
};
