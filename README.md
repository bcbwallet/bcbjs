bcbjs
=========

(Work in progress) BCB wallet implementation and utilities in JavaScript (and TypeScript).


**Features:**

- Keep your private keys in your client, **safe** and sound
- Import and export **JSON wallets** (Geth, Parity and crowdsale)
- Import and export BIP 39 **mnemonic phrases** (12 word backup phrases) and **HD Wallets** (English, French, Italian, Japanese, Korean, Simplified Chinese, Spanish, Traditional Chinese)
 **Tiny** (~84kb compressed; 270kb uncompressed)
 Fully **TypeScript** ready, with definition files and full TypeScript source
- **MIT License** (including ALL dependencies); completely open source to do with as you please


Hacking and Contributing
------------------------

The JavaScript code is now generated from TypeScript, so make sure you modify the
TypeScript and compile it, rather than modifying the JavaScript directly. To start
auto-compiling the TypeScript code, you may use:

```
/home/bcbjs> npm run auto-build
```

A very important part of bcbjs is its exhaustive test cases, so before making any
bug fix, please add a test case that fails prior to the fix, and succeeds after the
fix. All regression tests must pass.

Pull requests are always welcome, but please keep a few points in mind:

- Compatibility-breaking changes will not be accepted; they may be considered for the next major version
- Security is important; adding dependencies require fairly convincing arguments
- The library aims to be lean, so keep an eye on the `dist/bcbjs.min.js` file size before and after your changes
- Add test cases for both expected and unexpected input
- Any new features need to be supported by us (issues, documentation, testing), so anything that is overly complicated or specific may not be accepted

In general, **please start an issue before beginning a pull request**, so we can have a public discussion. :)


License
-------

Completely MIT Licensed. Including ALL dependencies.
