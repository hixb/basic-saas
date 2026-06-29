import { defineConfig } from 'vectify'

export default defineConfig({
  framework: 'react',
  configDir: '.',
  input: './public/icons',
  output: './components/icons',
  typescript: true,
  optimize: true,
  prefix: '',
  suffix: '',
  generateOptions: {
    index: true,
    types: true,
    preview: false,
  },
  format: 'eslint',
  watch: {
    enabled: false,
    ignore: ['**/node_modules/**', '**/.git/**'],
    debounce: 300,
  },
})
