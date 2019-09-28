import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import commonjs from 'rollup-plugin-commonjs';
import stylelint from 'rollup-plugin-stylelint';
import { uglify } from 'rollup-plugin-uglify';
import { eslint } from 'rollup-plugin-eslint';
import browsersync from 'rollup-plugin-browsersync';

import postcssUrl from 'postcss-url';
import easyImport from 'postcss-easy-import';
import autoprefixer from 'autoprefixer';
import flexbugsFixes from 'postcss-flexbugs-fixes';

const isProd = process.env.NODE_ENV === 'production';

export default [
	{
		input: 'src/scss/index.scss',
		output: {
			file: 'dist/app.css',
			format: 'es'
		},
		plugins: [
			stylelint({
				include: ['src/**/*.css'],
				syntax: 'scss'
			}),
			postcss({
				extract: true,
				plugins: [easyImport(), postcssUrl({ url: 'rebase' }), flexbugsFixes(), autoprefixer()],
				extensions: ['.css', '.scss', '.sass'],
				minimize: isProd,
				parser: 'postcss-scss',
				syntax: 'postcss-scss'
			})
		]
	},
	{
		input: 'src/js/index.js',
		output: {
			file: 'dist/app.js',
			format: 'iife',
			sourceMap: isProd ? false : 'inline'
		},
		plugins: [
			resolve({
				mainFields: ['jsnext:main', 'module', 'main', 'browser']
			}),
			commonjs(),
			replace({
				exclude: 'node_modules/**',
				ENV: JSON.stringify(process.env.NODE_ENV || 'development')
			}),
			eslint({
				exclude: ['src/scss/**', 'dist/**']
			}),
			babel({
				exclude: 'node_modules/**'
			}),

			isProd && uglify(),
			!isProd &&
				browsersync({
					host: 'localhost',
					port: 3000,
					open: 'external',
					files: ['**/*.php', '**/*.html', './dist/app.css', './dist/app.js'],
					ghostMode: {
						clicks: false,
						scroll: true,
						forms: {
							submit: true,
							inputs: true,
							toggles: true
						}
					},
					snippetOptions: {
						rule: {
							match: /<\/body>/i,
							fn: (snippet, match) => `${snippet}${match}`
						}
					},
					proxy: 'localhost'
				})
		],
		external: 'stylelint'
	}
];
