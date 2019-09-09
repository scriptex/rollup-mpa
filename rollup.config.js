import fs from 'fs';

import sass from 'rollup-plugin-sass';
import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import postcss from 'postcss';
import commonjs from 'rollup-plugin-commonjs';
import stylelint from 'rollup-plugin-stylelint';
import { eslint } from 'rollup-plugin-eslint';
import browsersync from 'rollup-plugin-browsersync';

import postcssUrl from 'postcss-url';
import easyImport from 'postcss-easy-import';
import autoprefixer from 'autoprefixer';
import flexbugsFixes from 'postcss-flexbugs-fixes';

const isProd = process.env.NODE_ENV === 'production';

export default {
	input: 'src/js/index.js',
	output: {
		dir: 'dist',
		format: 'iife',
		sourceMap: isProd ? false : 'inline'
	},
	plugins: [
		resolve({
			mainFields: ['jsnext:main', 'module', 'main', 'browser']
		}),
		commonjs(),
		sass({
			output(styles, styleNodes) {
				styleNodes.forEach(({ id, content }) => {
					const scssName = id.substring(id.lastIndexOf('/') + 1, id.length);
					const name = scssName.split('.')[0];
					fs.writeFileSync(`dist/${name}.css`, content);
				});
			},
			processor: css => {
				console.log(
					css,
					postcss({
						from: 'src/scss/index.scss',
						plugins: [easyImport, postcssUrl, flexbugsFixes, autoprefixer]
					})
						.process(css)
						.then(result => result.css)
				);

				return postcss({
					from: 'src/scss/index.scss',
					plugins: [easyImport, postcssUrl, flexbugsFixes, autoprefixer]
				})
					.process(css)
					.then(result => result.css);
			}
		}),
		stylelint({
			include: ['src/**/*.scss'],
			syntax: 'scss'
		}),
		eslint({
			exclude: ['src/scss/**', 'dist/**']
		}),
		babel({
			exclude: 'node_modules/**'
		}),
		replace({
			exclude: 'node_modules/**',
			ENV: JSON.stringify(process.env.NODE_ENV || 'development')
		}),
		isProd && uglify(),
		!isProd &&
			browsersync({
				host: 'localhost',
				watch: true,
				port: 3000,
				notify: false,
				open: true
			})
	],
	external: 'stylelint'
};
