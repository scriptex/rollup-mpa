import js from '@eslint/js';

export default [
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				ENV: 'readonly',
				...js.environments.browser.globals,
				...js.environments.node.globals
			}
		}
	}
];
