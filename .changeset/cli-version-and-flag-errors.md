---
"create-cartwright": patch
---
`create-cartwright --version` (and `-v`) now prints `create-cartwright <version>` and exits 0; before, the CLI did not know the flag. A flag it does not know, a flag missing its value, or a stray argument to a subcommand now prints one line, such as `Unknown option '--bogus'. Run create-cartwright --help to see the options.`, and exits 2, where it used to print "Unexpected error:" with a Node stack trace and exit 1. This covers `design install`, `vertical install` and `doctor` as well as the scaffolder.
