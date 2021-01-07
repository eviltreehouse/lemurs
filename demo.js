const { readFileSync } = require('fs');
const lemurs = require('./index');

var df = lemurs.FromCSV(readFileSync('./test/fixtures/demo.csv'));
console.log(`lemurs: ${df.rowCount()} data frame(s)s loaded ${df.cols.length} columns`);

const StrBool = v => Boolean(Number(v))
const YNBool = v => String(v) === 'Yes'

const sch = {
	'Senior Citizen': StrBool,
	'Partner': YNBool,
	'Dependents': YNBool,
	'Tenure': Number,
	'Paperless Billing': StrBool,
	'Monthly Charges': Number,
	'Total Charges': Number,
};

const audit = {
	'removeIfBlank': ['Gender'],
	'removeIfNaN': ['Tenure'],
};

df.audit(audit);
df.convert(sch);

global['df'] = df;

