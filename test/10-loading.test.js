'use strict';
const assert = require('assert');
const LemursDataSet = require('../index');
const { readFileSync } = require('fs');
const { resolve } = require('path');

const csvRaw = readFileSync(resolve(__dirname, 'fixtures', 'simple-headers.csv'), 'utf8');
const noHeadersCsvRaw = readFileSync(resolve(__dirname, 'fixtures', 'simple-noheaders.csv'), 'utf8');
const tsvRaw = readFileSync(resolve(__dirname, 'fixtures', 'simple-headers.tsv'), 'utf8');

describe('Data loading', () => {
	it('CSV OK', () => {
		const df = LemursDataSet.FromCSV(csvRaw, 'Name');
		assert(df && typeof df === 'object');
		assert(df.cols.length === 3);
		assert(df.rowCount() === 4);
		assert.deepStrictEqual(df.fetch('Alice'), ['Alice', '32', 'IT']);
	});

	it('Manual Headers OK', () => {
		const df = LemursDataSet.FromCSV(noHeadersCsvRaw, 'Name', ['Name', 'Age', 'Department']);
		assert(df && typeof df === 'object');
		assert(df.cols.length === 3);
		assert(df.rowCount() === 4);
		assert.deepStrictEqual(df.fetch('Alice'), ['Alice', '32', 'IT']);
		assert.deepStrictEqual(df.get('Department'), ['IT', 'Finance', 'Executive', 'Sales']);
	});

	it('TSV OK', () => {
		const df = LemursDataSet.FromTSV(tsvRaw, 'Name');
		assert(df && typeof df === 'object');
		assert(df.cols.length === 3);
		assert(df.rowCount() === 4);
		assert.deepStrictEqual(df.fetch('Alice'), ['Alice', '32', 'IT']);
		assert.deepStrictEqual(df.get('Department'), ['IT', 'Finance', 'Executive', 'Sales']);
	});
})