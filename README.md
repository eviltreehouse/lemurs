# Lemurs: Lean Data Frame Management for Node.js

## Abstract

I needed a module that worked like `pandas` does for Python and I didn't like any of the options I could readily find. So hence `lemurs` was born :) Zero production dependencies and focused on being light, intuitive and flexible versus exceptionally performant: if you are working with data sets of 100,000+ rows you might need to be a bit patient!

## Features

* Loading from CSV, TSV, or build-by-hand
* Most mutating operations can be done in-place or as a replication based on needs
* Refinement operations (per-column conversion, removing rows missing data, etc.)
* Recollection
* Sorting (simple and complex), filtering/truncating, classification functionality
* Baseline math operations (sum, averages, etc.)
* Sub-classable to add/change functionality if you find the need
* ...more I'm sure I'm forgetting!

## Example Usage
```js
// 1) Load from CSV/TSV or build by hand with new()
var df = lemurs.FromCSV(fs.readFileSync('./test/fixtures/demo.csv'));
//...
var df = new lemurs(
	[[/* row 1*/], [/* row 2 */], /* ... */], // array of arrays for data
	['id', 'username', 'email', 'account_age'],  // list columns
	'id' // (optionally) identify a "primary column" for row-specific fetching
);
df.add([/* row 3 */], [/* row 4 */], /* ... */);

console.log(`lemurs: ${df.rowCount()} row(s) loaded`);

// 2) Do some baseline data refinement: type conversion and auditing of problematic rows
const audit = {
	'removeIfBlank': ['Gender'],
	'removeIfNaN': ['Tenure'],
};
df.audit(audit);

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
df.convert(sch);

// 3) Simple recall operations
const allIDs = df.get('CustomerID');
const customer = df.fetch('A004-56A1'); // `CustomerID` is defined as the "primary column"

// 4) Sorting/filtering/truncating
df.sort('Total Charges')
df.sort(['Monthly Charges', 'Total Charges']);
const seniors = df.filtered(r => r['SeniorCitizen'] === true);
const top10 = df.sort('Monthly Charges', true).trunced(10);
```

## For More Information
See the `test` directory for more examples on usage, or even give the `index.js` a quick scroll through -- it's only ~600 lines.


## License
MIT: so go nuts ;)
