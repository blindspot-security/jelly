import {runTest} from "../../src/testing/runtest";

describe("tests/micro", () => {

    runTest("tests/micro", "classes.js", {
        soundness: "tests/micro/classes.json",
        functionInfos: 39,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 34,
        oneCalleeCalls: 32,
        funFound: 30,
        funTotal: 30,
        callFound: 36,
        callTotal: 36,
        reachableFound: 25,
        reachableTotal: 35,
    });

    runTest("tests/micro", "accessors.js", {
        soundness: "tests/micro/accessors.json",
        functionInfos: 3,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 3,
        oneCalleeCalls: 3,
        funFound: 1,
        funTotal: 1,
        callFound: 1,
        callTotal: 1,
        reachableFound: 4,
        reachableTotal: 4,
    });

    runTest("tests/micro", "accessors2.js", {
        functionInfos: 4,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 4,
        oneCalleeCalls: 4,
    });

    runTest("tests/micro", "defineProperty.js", {
        soundness: "tests/micro/defineProperty.json",
        functionInfos: 10,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 12,
        oneCalleeCalls: 15,
        funFound: 6,
        funTotal: 6,
        callFound: 9,
        callTotal: 9,
        reachableFound: 11,
        reachableTotal: 11,
    });

    runTest("tests/micro", "create.js", {
        soundness: "tests/micro/create.json",
        functionInfos: 2,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 2,
        oneCalleeCalls: 2,
        funFound: 2,
        funTotal: 2,
        callFound: 2,
        callTotal: 2,
        reachableFound: 3,
        reachableTotal: 3,
    });

    runTest("tests/micro", "eval.js", {
        soundness: "tests/micro/eval.json",
        functionInfos: 3,
        moduleInfos: 2,
        numberOfFunctionToFunctionEdges: 0,
        oneCalleeCalls: 0,
        funFound: 0,
        funTotal: 0,
        callFound: 0,
        callTotal: 0,
        reachableFound: 2,
        reachableTotal: 3,
    });

    runTest("tests/micro", "client1.js", {
        soundness: "tests/micro/client1.json",
        functionInfos: 3,
        moduleInfos: 2,
        numberOfFunctionToFunctionEdges: 3,
        oneCalleeCalls: 3,
        funFound: 3,
        funTotal: 3,
        callFound: 3,
        callTotal: 3,
        reachableFound: 5,
        reachableTotal: 5,
    });

    runTest("tests/micro", "client1b.js", {
        options: {ignoreDependencies: true},
        patterns: ["tests/micro/patterns.json"],
        functionInfos: 1,
        moduleInfos: 1,
        matches: {total: 6},
    });

    runTest("tests/micro", "client2.js", {
        soundness: "tests/micro/client2.json",
        functionInfos: 3,
        moduleInfos: 2,
        numberOfFunctionToFunctionEdges: 2,
        oneCalleeCalls: 2,
        funFound: 2,
        funTotal: 2,
        callFound: 2,
        callTotal: 2,
        reachableFound: 4,
        reachableTotal: 4,
    });

    runTest("tests/micro", "client3.js", {
        soundness: "tests/micro/client3.json",
        functionInfos: 1,
        moduleInfos: 2,
        numberOfFunctionToFunctionEdges: 1,
        oneCalleeCalls: 1,
        funFound: 1,
        funTotal: 1,
        callFound: 1,
        callTotal: 1,
        reachableFound: 3,
        reachableTotal: 3,
    });

    runTest("tests/micro", "client4.js", {
        soundness: "tests/micro/client4.json",
        functionInfos: 4,
        moduleInfos: 3,
        numberOfFunctionToFunctionEdges: 3,
        oneCalleeCalls: 4,
        funFound: 3,
        funTotal: 3,
        callFound: 4,
        callTotal: 4,
        reachableFound: 6,
        reachableTotal: 6,
    });

    runTest("tests/micro", "client5.js", {
        soundness: "tests/micro/client5.json",
        functionInfos: 3,
        moduleInfos: 3,
        numberOfFunctionToFunctionEdges: 3,
        oneCalleeCalls: 2,
        funFound: 3,
        funTotal: 3,
        callFound: 4,
        callTotal: 4,
        reachableFound: 6,
        reachableTotal: 6,
    });

    runTest("tests/micro", "client6.js", {
        soundness: "tests/micro/client6.json",
        functionInfos: 0,
        moduleInfos: 2,
        numberOfFunctionToFunctionEdges: 0,
        oneCalleeCalls: 0,
        funFound: 0,
        funTotal: 0,
        callFound: 0,
        callTotal: 0,
        reachableFound: 2,
        reachableTotal: 2,
    });

    runTest("tests/micro", "client8.js", {
        options: {ignoreDependencies: true},
        patterns: ["tests/micro/patterns8.json"],
        functionInfos: 0,
        moduleInfos: 1,
        matches: {total: 1},
    });

    runTest("tests/micro", "client9.js", {
        soundness: "tests/micro/client9.json",
        functionInfos: 4,
        moduleInfos: 2,
        numberOfFunctionToFunctionEdges: 4,
        oneCalleeCalls: 4,
        funFound: 2,
        funTotal: 2,
        callFound: 2,
        callTotal: 2,
        reachableFound: 6,
        reachableTotal: 6,
    });

    describe.each([
        ["ignoreDependencies", true],
        ["excludePackages", ["library"]],
        ["includePackages", ["micro"]],
    ] as const)("%s=%p", (opt, value: any) => {
        runTest("tests/micro", "client9.js", {
            options: {[opt]: value},
            soundness: "tests/micro/client9.json",
            functionInfos: 3,
            moduleInfos: 2,
            funFound: 0,
            callFound: 0,
            reachableFound: 4,
        });
    });

    runTest("tests/micro", "arrays.js", {
        soundness: "tests/micro/arrays.json",
        functionInfos: 4,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 4,
        oneCalleeCalls: 1,
        funFound: 3,
        funTotal: 3,
        callFound: 3,
        callTotal: 3,
        reachableFound: 4,
        reachableTotal: 4,
    });

    runTest("tests/micro", "arrays2.js", {
        soundness: "tests/micro/arrays2.json",
        functionInfos: 6,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 6,
        oneCalleeCalls: 4,
        funFound: 5,
        funTotal: 5,
        callFound: 6,
        callTotal: 6,
        reachableFound: 7,
        reachableTotal: 7,
    });

    runTest("tests/micro", "arrays3.js", {
        soundness: "tests/micro/arrays3.json",
        functionInfos: 6,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 6,
        oneCalleeCalls: 6,
    });

    runTest("tests/micro", "iterators.js", {
        soundness: "tests/micro/iterators.json",
        functionInfos: 25,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 41,
        oneCalleeCalls: 13,
        funFound: 22,
        funTotal: 22,
        callFound: 43,
        callTotal: 43,
        reachableFound: 23,
        reachableTotal: 23,
    });

    runTest("tests/micro", "more1.js", {
        soundness: "tests/micro/more1.json",
        functionInfos: 19,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 15,
        oneCalleeCalls: 2,
        funFound: 14,
        funTotal: 20,
        callFound: 20,
        callTotal: 29,
        reachableFound: 16,
        reachableTotal: 20,
    });

    runTest("tests/micro", "generators.js", {
        soundness: "tests/micro/generators.json",
        functionInfos: 23,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 26,
        oneCalleeCalls: 14,
        funFound: 24,
        funTotal: 24,
        callFound: 24,
        callTotal: 24,
        reachableFound: 24,
        reachableTotal: 25,
    });

    runTest("tests/micro", "arguments.js", {
        soundness: "tests/micro/arguments.json",
        functionInfos: 7,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 7,
        oneCalleeCalls: 6,
        funFound: 7,
        funTotal: 8,
        callFound: 6,
        callTotal: 8,
        reachableFound: 8,
        reachableTotal: 8,
    });

    runTest("tests/micro", "destructuring.js", {
        soundness: "tests/micro/destructuring.json",
        functionInfos: 11,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 10,
        oneCalleeCalls: 11,
        funFound: 7,
        funTotal: 9,
        callFound: 10,
        callTotal: 12,
        reachableFound: 9,
        reachableTotal: 11,
    });

    runTest("tests/micro", "ts.ts", {
        options: {ignoreDependencies: true},
        patterns: ["tests/micro/ts-patterns.json"],
        matches: {total: 1},
    });

    runTest("tests/micro/globals", ["sample/app.js", "lib1/lib.js"], {
        functionInfos: 2,
        moduleInfos: 2,
        numberOfFunctionToFunctionEdges: 2,
        oneCalleeCalls: 2,
    });

    runTest("tests/micro", "oneshot.js", {
        soundness: "tests/micro/oneshot.json",
        functionInfos: 2,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 1,
        oneCalleeCalls: 1,
        funFound: 1,
        funTotal: 1,
        callFound: 1,
        callTotal: 1,
        reachableFound: 2,
        reachableTotal: 2,
    });

    runTest("tests/micro", "low.ts", {
        options: {ignoreDependencies: true},
        patterns: ["tests/micro/lowpatterns.json"],
        functionInfos: 0,
        moduleInfos: 1,
        matches: {total: 3, low: 1},
    });

    runTest("tests/micro", "bind.js", {
        soundness: "tests/micro/bind.json",
        funFound: 1,
        funTotal: 1,
        callFound: 2,
        callTotal: 2,
        reachableFound: 2,
        reachableTotal: 2,
    });

    runTest("tests/micro", "call.js", {
        soundness: "tests/micro/call.json",
        funFound: 1,
        funTotal: 1,
        callFound: 1,
        callTotal: 1,
        reachableFound: 2,
        reachableTotal: 2,
    });

    runTest("tests/micro", "fun.js", {
        soundness: "tests/micro/fun.json",
        functionInfos: 16,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 23,
        oneCalleeCalls: 11,
        funFound: 18,
        funTotal: 18,
        callFound: 19,
        callTotal: 19,
        reachableFound: 17,
        reachableTotal: 17,
    });

    runTest("tests/micro", "obj.js", {
        soundness: "tests/micro/obj.json",
        functionInfos: 1,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 1,
        oneCalleeCalls: 1,
        funFound: 1,
        funTotal: 1,
        callFound: 1,
        callTotal: 1,
        reachableFound: 2,
        reachableTotal: 2,
    });

    runTest("tests/micro", "obj2.js", {
        soundness: "tests/micro/obj2.json",
        functionInfos: 2,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 2,
        oneCalleeCalls: 5,
        funFound: 2,
        funTotal: 2,
        callFound: 5,
        callTotal: 5,
        reachableFound: 3,
        reachableTotal: 3,
    });

    runTest("tests/micro", "mix.js", {
        soundness: "tests/micro/mix.json",
        functionInfos: 3,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 3,
        oneCalleeCalls: 3,
        funFound: 3,
        funTotal: 3,
        callFound: 3,
        callTotal: 3,
        reachableFound: 4,
        reachableTotal: 4,
    });

    runTest("tests/micro", "templateliterals.js", {
        soundness: "tests/micro/templateliterals.json",
        functionInfos: 5,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 5,
        oneCalleeCalls: 5,
        funFound: 4,
        funTotal: 4,
        callFound: 3,
        callTotal: 4,
        reachableFound: 5,
        reachableTotal: 5,
    });

    runTest("tests/micro", "rest.js", {
        soundness: "tests/micro/rest.json",
        functionInfos: 21,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 21,
        oneCalleeCalls: 18,
        funFound: 18,
        funTotal: 20,
        callFound: 22,
        callTotal: 24,
        reachableFound: 19,
        reachableTotal: 20,
    });

    runTest("tests/micro", "rest2.js", {
        soundness: "tests/micro/rest2.json",
        functionInfos: 2,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 2,
        oneCalleeCalls: 2,
        funFound: 2,
        funTotal: 2,
        callFound: 2,
        callTotal: 2,
        reachableFound: 3,
        reachableTotal: 3,
    });

    runTest("tests/micro", "rxjs1.js", {
        options: {ignoreUnresolved: true},
        patterns: ["tests/micro/rxjs.json"],
        functionInfos: 1,
        moduleInfos: 2,
        matches: {total: 1},
    });

    runTest("tests/micro", "import1.mjs", {
        soundness: "tests/micro/import1.json",
        functionInfos: 5,
        moduleInfos: 3,
        numberOfFunctionToFunctionEdges: 5,
        oneCalleeCalls: 5,
        funFound: 5,
        funTotal: 5,
        callFound: 5,
        callTotal: 5,
        reachableFound: 8,
        reachableTotal: 8,
    });

    runTest("tests/micro", "import3.mjs", {
        functionInfos: 2,
        moduleInfos: 4,
        numberOfFunctionToFunctionEdges: 2,
        oneCalleeCalls: 2,
    });

    runTest("tests/micro", "import7.mjs", {
        options: {ignoreDependencies: true},
        patterns: ["tests/micro/patterns7.json"],
        functionInfos: 0,
        moduleInfos: 2,
        matches: {total: 2},
    });

    runTest("tests/micro", "import9.mjs", {
        functionInfos: 2,
        moduleInfos: 2,
        numberOfFunctionToFunctionEdges: 2,
        oneCalleeCalls: 2,
    });

    runTest("tests/micro", "import10.mjs", {
        functionInfos: 1,
        moduleInfos: 3,
        numberOfFunctionToFunctionEdges: 1,
        oneCalleeCalls: 1,
    });

    runTest("tests/micro", "import11.mjs", {
        options: {ignoreDependencies: true},
        patterns: ["tests/micro/patterns11.json"],
        functionInfos: 0,
        moduleInfos: 1,
        matches: {total: 2},
    });

    runTest("tests/micro", "import12.mjs", {
        soundness: "tests/micro/import12.json",
        funFound: 1,
        funTotal: 1,
        callFound: 1,
        callTotal: 1,
        reachableFound: 2,
        reachableTotal: 2,
    });

    runTest("tests/micro", "dyn-import.mjs", {
        soundness: "tests/micro/dyn-import.json",
        funTotal: 2,
        funFound: 2,
        callTotal: 2,
        callFound: 2,
        reachableFound: 4,
        reachableTotal: 4,
    });

    runTest("tests/micro/import-default", "a.ts", {
        functionInfos: 1,
        moduleInfos: 2,
        numberOfFunctionToFunctionEdges: 1,
        oneCalleeCalls: 1,
    });

    runTest("tests/micro", "this.js", {
        functionInfos: 5,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 4,
        oneCalleeCalls: 4,
    });


    runTest("tests/micro", "prototypes.js", {
        functionInfos: 2,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 1,
        oneCalleeCalls: 1,
    });

    runTest("tests/micro", "prototypes2.js", {
        soundness: "tests/micro/prototypes2.json",
        functionInfos: 1,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 1,
        oneCalleeCalls: 1,
        reachableFound: 2,
        reachableTotal: 3,
    });

    runTest("tests/micro", "match1.js", {
        options: {ignoreDependencies: true},
        patterns: ["tests/micro/match1-patterns.json"],
        matches: {total: 1},
    });

    runTest("tests/micro", "match2.js", {
        options: {ignoreDependencies: true},
        patterns: ["tests/micro/match2-patterns.json"],
        matches: {total: 1},
    });

    runTest("tests/micro", "match3.js",  {
        options: {ignoreDependencies: true},
        patterns: ["tests/micro/match3-patterns.json"],
        matches: {total: 1},
    });

    runTest("tests/micro", "match4.js",  {
        options: {ignoreDependencies: true},
        patterns: ["tests/micro/match4-patterns.json"],
        matches: {total: 1},
    });

    runTest("tests/micro", "match5.js",  {
        options: {ignoreDependencies: true},
        patterns: ["tests/micro/match5-patterns.json"],
        matches: {total: 4},
    });

    runTest("tests/micro", "match6.js",  {
        options: {ignoreDependencies: true},
        patterns: ["tests/micro/match6-patterns.json"],
        matches: {total: 1},
    });

    runTest("tests/micro", "match7.js",  {
        options: {ignoreDependencies: true},
        patterns: ["tests/micro/match7-patterns.json"],
        matches: {total: 4, low: 0},
    });

    runTest("tests/micro", "match8.ts",  {
        options: {ignoreDependencies: true},
        patterns: ["tests/micro/match8-patterns.json"],
        matches: {total: 1, low: 0},
    });

    runTest("tests/micro", "match9.ts",  {
        options: {ignoreDependencies: true},
        patterns: ["tests/micro/match9-patterns.json"],
        matches: {total: 1, low: 0},
    });

    runTest("tests/micro", "match10.ts",  {
        options: {ignoreDependencies: true},
        patterns: ["tests/micro/match10-patterns.json"],
        matches: {total: 1, low: 1},
    });

    runTest("tests/micro", "match11.ts",  {
        options: {ignoreDependencies: true},
        patterns: ["tests/micro/match11-patterns.json"],
        matches: {total: 2, low: 1}, // TODO: high confidence match with filter is maybe?
    });

    runTest("tests/micro", "match12.ts",  {
        options: {ignoreDependencies: true},
        patterns: ["tests/micro/match12-patterns.json"],
        matches: {total: 1, low: 0}, // FIXME: bad source location due to Babel transformation
    });

    describe.each([false, true])("callgraphNative=%p", (callgraphNative: boolean) => {
        runTest("tests/micro", "promises.js", {
            options: {callgraphNative},
            soundness: "tests/micro/promises.json",
            functionInfos: 40,
            moduleInfos: 1,
            numberOfFunctionToFunctionEdges: callgraphNative? 54 : 25,
            oneCalleeCalls: callgraphNative? 23 : 14,
            funFound: 24,
            funTotal: 28,
            callFound: 24,
            callTotal: 28,
            reachableFound: callgraphNative? 32 : 1,
            reachableTotal: 33,
        });
    });

    runTest("tests/micro", "promiseall.js", {
        options: {callgraphNative: false},
        soundness: "tests/micro/promiseall.json",
        functionInfos: 3,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 1,
        oneCalleeCalls: 1,
        funFound: 1,
        funTotal: 1,
        callFound: 1,
        callTotal: 1,
        reachableFound: 1,
        reachableTotal: 4,
    });

    runTest("tests/micro", "asyncawait.js", {
        options: {callgraphNative: false},
        soundness: "tests/micro/asyncawait.json",
        functionInfos: 19,
        moduleInfos: 1,
        numberOfFunctionToFunctionEdges: 19,
        oneCalleeCalls: 10,
        funFound: 14,
        funTotal: 14,
        callFound: 14,
        callTotal: 15,
        reachableFound: 11,
        reachableTotal: 20,
    });

    runTest("tests/micro", "jsx.js", {
        options: {ignoreUnresolved: true},
        apiUsageAccessPathPatternsAtNodes: 6,
    });

    runTest("tests/micro", "escape.js",  {
        options: {
            ignoreDependencies: true,
            externalMatches: true,
        },
        patterns: ["tests/micro/escape-patterns.json"],
        matches: {total: 16, low: 16},
    });

    runTest("tests/micro", "externmap.js",  {
        options: {
            ignoreDependencies: true,
            externalMatches: true,
        },
        patterns: ["tests/micro/externmap-patterns.json"],
        matches: {total: 1, low: 1},
    });

    runTest("tests/micro/peerdep", "peerdep.js",  {
        options: {
            ignoreDependencies: true,
            externalMatches: true,
        },
        patterns: ["tests/micro/peerdep/peerdep-patterns.json"],
        matches: {total: 0, low: 0}, // TODO: should report 1 match
    });

    runTest("tests/micro", "call-expressions.js", {
        soundness: "tests/micro/call-expressions.json",
        funFound: 10,
        funTotal: 10,
        callFound: 35,
        callTotal: 35,
        reachableFound: 11,
        reachableTotal: 11,
    });

    runTest("tests/micro", "default-parameter.js", {
        soundness: "tests/micro/default-parameter.json",
        functionInfos: 3,
        // TODO: make static and dynamic analysis agree on source function in fun2fun edges in default parameter initialization
        // in dynamic analysis the source is the caller of the function with a default parameter
        // difficult to change due to order of observed events in dynamic analysis
        // in static analysis the source is the function with a default parameter
        // impossible to change without context sensitivity
        funFound: 2,
        funTotal: 3,
        callFound: 3,
        callTotal: 3,
        reachableFound: 4,
        reachableTotal: 4,
    });

    runTest("tests/micro", "throw.js", {
        soundness: "tests/micro/throw.json",
        functionInfos: 2,
        funFound: 2,
        funTotal: 2,
        callFound: 2,
        callTotal: 2,
        reachableFound: 3,
        reachableTotal: 3,
    });

    runTest("tests/micro", "undecl1.js", {
        numberOfFunctionToFunctionEdges: 1,
    });

    runTest("tests/micro", "for-in.js", {
        soundness: "tests/micro/for-in.json",
        moduleInfos: 1,
        functionInfos: 2,
        funFound: 0,
        funTotal: 2,
        callFound: 0,
        callTotal: 2,
        reachableFound: 1,
        reachableTotal: 3,
    });

    runTest("tests/micro", "require-extensions.js", {
        soundness: "tests/micro/require-extensions.json",
        moduleInfos: 2,
        functionInfos: 3,
        reachableFound: 3,
        reachableTotal: 3,
    });

    describe("packagejson", () =>
        runTest("tests/micro/packagejson", "index.js", {
            vulnerabilities: [{
                osv: {
                    cvss: {
                        score: 1,
                        vectorString: null,
                    },
                    cwe: ["1"],
                    dependency: "terser",
                    name: "terser",
                    range: "<2.0.0",
                    severity: "high",
                    source: 1,
                    title: "title",
                    url: "url",
                },
                patterns: ["<terser>.minify"],
            }],
            vulnerabilitiesMatches: 1,
        }));

    describe("twoversions", () =>
        runTest("tests/micro/twoversions", "index.js", {
            vulnerabilities: [{
                osv: {
                    cvss: {
                        score: 1,
                        vectorString: null,
                    },
                    cwe: ["1"],
                    dependency: "ansi-regex",
                    name: "ansi-regex",
                    range: ">=3.0.0",
                    severity: "high",
                    source: 1,
                    title: "title",
                    url: "url",
                },
                patterns: ["<ansi-regex>"],
            }],
            vulnerabilitiesMatches: 1,
        }));
});
