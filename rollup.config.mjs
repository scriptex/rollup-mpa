import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import babel from '@rollup/plugin-babel';
import eslint from '@rollup/plugin-eslint';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import commonjs from '@rollup/plugin-commonjs';
import stylelint from 'rollup-plugin-stylelint';
import typescript from '@rollup/plugin-typescript';
import browsersync from 'rollup-plugin-browsersync';
import spritesmith from 'rollup-plugin-sprite';

import atImport from 'postcss-import';
import preseEnv from 'postcss-preset-env';
import postcssUrl from 'postcss-url';
import autoprefixer from 'autoprefixer';
import flexbugsFixes from 'postcss-flexbugs-fixes';

const isProd = process.env.NODE_ENV === 'production';
const isTypeScript = fs.existsSync('./src/scripts/index.ts');

const sha256 = data => crypto.createHash('sha256').update(data, 'binary').digest('hex');

export default [
	{
		input: 'src/styles/index.scss',
		output: {
			file: 'dist/app.css',
			format: 'es'
		},
		plugins: [
			// @ts-ignore
			stylelint.default({
				include: ['src/**/*.css', 'src/**/*.scss', 'src/**/*.sass']
			}),
			postcss({
				extract: true,
				plugins: [
					atImport(),
					postcssUrl({
						url(asset) {
							const { pathname } = asset;
							// @ts-ignore
							const abspath = path.resolve(__dirname, pathname.substr(1));
							const basename = path.basename(abspath).replace(/[^.]+/, sha256(path.basename(abspath)));
							const destpath = path.join(__dirname, 'dist');

							if (!fs.existsSync(path.join(destpath, basename))) {
								fs.copyFileSync(abspath, path.join(destpath, basename));
							}

							return path.join('.', basename);
						}
					}),
					preseEnv({ stage: 0 }),
					flexbugsFixes(),
					autoprefixer()
				],
				extensions: ['.css', '.scss', '.sass'],
				minimize: isProd,
				parser: 'postcss-scss',
				syntax: 'postcss-scss'
			}),
			spritesmith({
				src: {
					cwd: './src/images/sprite',
					glob: '**/*.png'
				},
				target: {
					image: './dist/sprite.png',
					css: './src/styles/_sprite.scss'
				},
				cssImageRef: '../sprite.png',
				output: {
					image: './dist/sprite.png'
				}
			})
		]
	},
	{
		input: isTypeScript ? 'src/scripts/index.ts' : 'src/scripts/index.js',
		output: {
			file: 'dist/app.js',
			format: 'iife'
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
			!isTypeScript &&
				eslint({
					exclude: ['src/styles/**', 'dist/**']
				}),
			isTypeScript
				? typescript()
				: babel({
						exclude: 'node_modules/**'
				  }),
			isProd
				? terser()
				: browsersync({
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
