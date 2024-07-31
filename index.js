const urlsArray = ['https://expro.ru/catalog/kabinet-rukovoditelya-vasanta/'];

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import pkg from 'iconv-lite';
import { encode } from 'windows-1251';

const DIRECTORY = 'output';

const { decode } = pkg;

const parse = () => {
	for (const url in urlsArray) {
		axios
			.get(urlsArray[url], { responseType: 'arraybuffer' })
			.then((html) => {
				const content = decode(Buffer.from(html.data), 'win1251');
				const $ = cheerio.load(content);

				const titleFile = $('.product-slider__title.page-title').text();
				console.log('titleFile:', titleFile);

				let result = '';

				$('.products-list').each((indexList, list) => {
					console.log(indexList);

					let rowList = '';

					$(list)
						.children('div')
						.each((indexProduct, product) => {
							if (indexProduct === 0) {
								const titleList = $(product).text();
								console.log(titleList);
								rowList += `${indexList};${titleList};\n`;
							}
						});

					result += rowList;
				});

				writeFile(titleFile, result);
			});
	}
};

const writeFile = async (title, text) => {
	console.log('');
	console.log('[writeFile]:');
	console.log({ title, text });
	console.log('');

	const FILE_NAME = title;
	const textEncoded = encode(text);

	if (!fs.existsSync(DIRECTORY)) fs.mkdirSync(DIRECTORY);

	fs.writeFile(`${DIRECTORY}/${FILE_NAME}.csv`, textEncoded, function (error) {
		if (error) {
			return console.log(error);
		}
		console.log(
			'\x1b[32m%s\x1b[0m',
			`The file \'${FILE_NAME}.csv\' was successfully written`
		);
	});
};

parse();

const func = () => {
	$('#class-table > table > tbody')
		.eq(0)
		.children('tr')
		.each((i, tr) => {
			let _className = '';
			let _css = '';

			$(tr)
				.children('td')
				.each((j, td) => {
					if (j === 0) _className = $(td).text();
					if (j === 1) {
						_css = '\t' + $(td).text().replace('\n', '\n\t');

						_css = $(td)
							.text()
							.split('\n')
							.filter((el) => el?.length > 0)
							.map((el) => '\n\t' + el)
							.join('');
					}
				});

			if (!_className.includes('.')) {
				result += `${i > 0 ? '\n\n' : ''}.${_className} {${_css}\n}`;
			}
		});
};
