import axios from 'axios';
import * as cheerio from 'cheerio';
import { error } from 'console';
import * as fs from 'fs';
import pkg from 'iconv-lite';
import { encode } from 'windows-1251';

const DIRECTORY = 'output';
const { decode } = pkg;
const urlsArray = [
	// 1ю Кабинет руководителя Vestar
	// 'https://expro.ru/catalog/kabinet-rukovoditelya-vestar/?SECTION_ID=505',
	// 'https://expro.ru/catalog/kabinet-rukovoditelya-vestar/?SECTION_ID=506',
	// 2. Кабинет руководителя Торстон
	// 'https://expro.ru/catalog/kabinet-rukovoditelya-torston/?SECTION_ID=373',
	// 'https://expro.ru/catalog/kabinet-rukovoditelya-torston/?SECTION_ID=486',
	// 3. Кабинет руководителя Vasanta
	// 'https://expro.ru/catalog/kabinet-rukovoditelya-vasanta/?SECTION_ID=145',
	// 'https://expro.ru/catalog/kabinet-rukovoditelya-vasanta/?SECTION_ID=146',
	// 'https://expro.ru/catalog/kabinet-rukovoditelya-vasanta/?SECTION_ID=725',
	// 4. Кабинет руководителя Festus Хромикс белый
	// 'https://expro.ru/catalog/kabinet-rukovoditelya-festus-khromiks-belyy/?SECTION_ID=766',
	// 'https://expro.ru/catalog/kabinet-rukovoditelya-festus-khromiks-belyy/?SECTION_ID=767',
	// 'https://expro.ru/catalog/kabinet-rukovoditelya-festus-khromiks-belyy/?SECTION_ID=768',
	// 5. Кабинет руководителя Festus Орех Пацифик Табак
	// 'https://expro.ru/catalog/kabinet-rukovoditelya-festus/?SECTION_ID=686',
	// 'https://expro.ru/catalog/kabinet-rukovoditelya-festus/?SECTION_ID=687',
	// 'https://expro.ru/catalog/kabinet-rukovoditelya-festus/?SECTION_ID=688',
	// 6. Кабинет руководителя Festus Древесина Графит
	// 'https://expro.ru/catalog/kabinet-rukovoditelya-festus-drevesina-grafit/?SECTION_ID=689',
	// 'https://expro.ru/catalog/kabinet-rukovoditelya-festus-drevesina-grafit/?SECTION_ID=690',
	// 'https://expro.ru/catalog/kabinet-rukovoditelya-festus-drevesina-grafit/?SECTION_ID=691',
	// 7. Серия Solution
	// 'https://expro.ru/catalog/seriya-solution/?SECTION_ID=520',
	// 'https://expro.ru/catalog/seriya-solution/?SECTION_ID=521',
	// 'https://expro.ru/catalog/seriya-solution/?SECTION_ID=492',
	// 'https://expro.ru/catalog/seriya-solution/?SECTION_ID=493',
	// 8. Серия Инновация
	// 'https://expro.ru/catalog/seriya-innovatsiya/?SECTION_ID=115',
	// 'https://expro.ru/catalog/seriya-innovatsiya/?SECTION_ID=579',
	// 9. Серия Саньяна
	// 'https://expro.ru/catalog/seriya-sanyana/?SECTION_ID=148',
	// 'https://expro.ru/catalog/seriya-sanyana/?SECTION_ID=149',
	// 10. Серия Vasanta
	// 'https://expro.ru/catalog/seriya-vasanta/?SECTION_ID=118',
	// 'https://expro.ru/catalog/seriya-vasanta/?SECTION_ID=111',
	// 'https://expro.ru/catalog/seriya-vasanta/?SECTION_ID=724',
	// 11. Серия LEMO
	// 'https://expro.ru/catalog/seriya-lemo/?SECTION_ID=788',
	// 'https://expro.ru/catalog/seriya-lemo/?SECTION_ID=789',
	// 'https://expro.ru/catalog/seriya-lemo/?SECTION_ID=848',
	// 'https://expro.ru/catalog/seriya-lemo/?SECTION_ID=871',
	// 'https://expro.ru/catalog/seriya-lemo/?SECTION_ID=790',
	// 'https://expro.ru/catalog/seriya-lemo/?SECTION_ID=791',
	// 'https://expro.ru/catalog/seriya-lemo/?SECTION_ID=792',
	// 'https://expro.ru/catalog/seriya-lemo/?SECTION_ID=849',
];

const parse = () => {
	for (const url in urlsArray) {
		axios
			.get(urlsArray[url], { responseType: 'arraybuffer' })
			.then((html) => {
				const content = decode(Buffer.from(html.data), 'win1251');
				const $ = cheerio.load(content);

				const titleFile = $('.product-slider__title.page-title')
					.text()
					.replaceAll('/', '_');

				console.log('[FILE]:', titleFile);

				let result = '';

				$('.products-list').each((indexList, list) => {
					let row = '';

					const section = $(list).find('.section_name').text().trim();

					$(list)
						.find('.products-list__item')
						.each((indexItem, item) => {
							const imgUrl =
								'https://expro.ru' +
								$(item)
									.eq(0)
									.find('.product__photo')
									.find('.product__link')
									.find('.products-list__img')
									.attr('src');

							const arr = imgUrl.split('.');
							const fileExt = arr[arr?.length - 1];

							downloadImage(
								imgUrl,
								titleFile,
								`${indexList}_${indexItem}.${fileExt}`
							);

							const name = $(item)
								.eq(0)
								.find('.product__info')
								.find('.product__name')
								.text()
								.trim();

							const params = $(item)
								.eq(0)
								.find('.product__info')
								.find('.product__params')
								.text()
								.trim();

							const article = $(item)
								.eq(0)
								.find('.product__info')
								.find('.product__article')
								.prop('textContent')
								.replaceAll('\n', ' ')
								.replaceAll('\t', '')
								.trim();

							const price = $(item)
								.eq(0)
								.find('.product__info')
								.find('.product__price')
								.prop('textContent')
								.replace('\n', ' ')
								.replaceAll('\t', '')
								.replaceAll('\n', ' ')
								.replaceAll('₽', ' ')
								.trim();

							row += `${indexList}_${indexItem};${section};${name};${params};${article};${price};\n`;
						});

					result += row;
				});

				writeFile(titleFile, result);
			});
	}
};

const writeFile = async (fileName, text) => {
	const textEncoded = encode(text);

	if (!fs.existsSync(DIRECTORY)) fs.mkdirSync(DIRECTORY);

	fs.writeFile(`${DIRECTORY}/${fileName}.csv`, textEncoded, function (error) {
		if (error) {
			return console.log(error);
		}
		console.log(
			'\x1b[32m%s\x1b[0m',
			`The file \'${fileName}.csv\' was successfully written`
		);
	});
};

const downloadImage = (url, folder, fileName) => {
	if (!fs.existsSync(`${DIRECTORY}/${folder}`)) {
		fs.mkdirSync(`${DIRECTORY}/${folder}`);
	}

	if (fs.existsSync(`${DIRECTORY}/${folder}/${fileName}`)) {
		return;
	}

	axios({ url, responseType: 'stream' })
		.then((response) => {
			new Promise((resolve, reject) => {
				response.data
					.pipe(fs.createWriteStream(`${DIRECTORY}/${folder}/${fileName}`))
					.on('finish', () => resolve())
					.on('error', (e) => reject(e));
			});
		})
		.catch((error) => {
			console.log('--------------------------------------');
			console.log(fileName, url);
			console.log('');
			console.log(error?.message);
		});
};

parse();
