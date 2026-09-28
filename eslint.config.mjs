import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config(
  { ignores:['dist/**','managed/**','public/zk/**'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions:{ globals:{ console:'readonly', window:'readonly', document:'readonly', fetch:'readonly', crypto:'readonly', URL:'readonly', Uint8Array:'readonly', TextEncoder:'readonly', TextDecoder:'readonly', setTimeout:'readonly', clearTimeout:'readonly', process:'readonly' } } },
);
