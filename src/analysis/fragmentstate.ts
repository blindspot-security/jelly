import {ConstraintVar, ObjectPropertyVarObj} from "./constraintvars";
import {
    AccessPathToken,
    AllocationSiteToken,
    ArrayToken,
    FunctionToken,
    ObjectToken,
    PackageObjectToken,
    Token
} from "./tokens";
import {DummyModuleInfo, FunctionInfo, ModuleInfo, PackageInfo} from "./infos";
import {
    CallExpression,
    Function,
    Identifier,
    isArrowFunctionExpression,
    isExpression,
    JSXIdentifier,
    NewExpression,
    Node,
    OptionalCallExpression
} from "@babel/types";
import assert from "assert";
import {mapGetSet, locationToStringWithFile, locationToStringWithFileAndEnd, addMapHybridSet} from "../misc/util";
import {AccessPath, CallResultAccessPath, ComponentAccessPath, ModuleAccessPath, PropertyAccessPath} from "./accesspaths";
import {options} from "../options";
import logger from "../misc/logger";
import {NodePath} from "@babel/traverse";
import {GlobalState} from "./globalstate";
import {ConstraintVarProducer} from "./constraintvarproducer";
import Solver from "./solver";

export type ListenerID = bigint;

/**
 * A RepresentativeVar is a constraint variable that is statically guaranteed to be its own representative (see below for exceptions).
 * Using the RepresentativeVar type in place of the plain ConstraintVar type in APIs that require representatives
 * allows us catch bugs (passing non-representative variables to such APIs) at compile time.
 *
 * The actual type declaration for RepresentativeVar uses a concept known as "type branding" in the TypeScript world.
 * See e.g. https://www.mikepalmer.dev/blog/stricter-types-in-typescript-with-brands
 * It is similar to "newtypes" in other statically typed languages.
 * See https://github.com/Microsoft/TypeScript/issues/4895 for a discussion on support for less ad-hoc newtypes in TypeScript.
 * RepresentativeVar is a subtype of ConstraintVar, so it can be used as a regular ConstraintVar when required.
 *
 * RepresentativeVars are obtained through the `getRepresentative` and `isRepresentative` functions on `FragmentState`:
 * ```ts
 * const v: ConstraintVar = ...
 * const rep: RepresentativeVar = f.getRepresentative(v);
 * // or
 * if (f.isRepresentative(v))
 *   // the type of v in this branch is `RepresentativeVar`
 * ```
 * Alternatively they can be acquired by iterating over the data structures in `FragmentState` that contain representatives.
 *
 * Shortcomings:
 * `solver.redirect(v, rep)` invalidates the invariant that `v` is a representative (unless `v === rep`),
 * but we cannot model that in TypeScript's type system. This would require affine types, which TypeScript does not support.
 * Clients of `redirect` must be careful to take this into account.
 *
 * Bugs in the implementation of `solver.redirect` can easily invalidate the invariant for constraint variables
 * that are stored in data structures for representative variables, without us being able to detect that statically.
 *
 * A representative variable in one FragmentState is not guaranteed to be a representative in another.
 * Like the implementation of `solver.redirect`, code that merges variables from different fragment states must
 * handle representative variables carefully!
 * In this case it is possible to use `FragmentState<MergeRepresentativeVar>` for the second fragment state
 * to prevent representative variable mixups.
 */
export type RepresentativeVar = ConstraintVar & { readonly __repr: unique symbol };
export type MergeRepresentativeVar = ConstraintVar & { readonly __repr: unique symbol };

/**
 * Analysis state for a fragment (a module or a package with dependencies, depending on the analysis phase).
 */
export class FragmentState<RVT extends RepresentativeVar | MergeRepresentativeVar = RepresentativeVar> {

    readonly a: GlobalState;

    /**
     * Constraint variable producer.
     */
    readonly varProducer;

    /**
     * The current analysis solution.
     * Singleton sets are represented as plain references, larger sets are represented as ES2015 sets.
     */
    private readonly tokens: Map<RVT, Token | Set<Token>> = new Map;

    /**
     * The set of constraint variables (including those with tokens, subset edges, or listeners, but excluding those that are redirected).
     */
    readonly vars: Set<RVT> = new Set;

    /**
     * Indirection introduced by cycle elimination.
     */
    readonly redirections: Map<ConstraintVar, ConstraintVar> = new Map;

    /**
     * Number of tokens for the currently analyzed fragment. (For statistics only.)
     */
    numberOfTokens: number = 0;

    numberOfSubsetEdges: number = 0;

    readonly subsetEdges: Map<RVT, Set<RVT>> = new Map;

    readonly reverseSubsetEdges: Map<RVT, Set<RVT>> = new Map; // (used by solver.redirect)

    /**
     * Inheritance relation. For each token, the map provides the tokens it may inherit from directly.
     */
    inherits: Map<Token, Set<Token>> = new Map;

    reverseInherits: Map<Token, Set<Token>> = new Map;

    readonly arrayEntries: Map<ArrayToken, Set<string>> = new Map;

    objectProperties: Map<ObjectPropertyVarObj, Set<string>> = new Map;

    readonly tokenListeners: Map<RVT, Map<ListenerID, (t: Token) => void>> = new Map;

    readonly pairListeners1: Map<RVT, Map<ListenerID, [ConstraintVar, (t1: AllocationSiteToken, t2: FunctionToken | AccessPathToken) => void]>> = new Map;

    readonly pairListeners2: Map<RVT, Map<ListenerID, [ConstraintVar, (t1: AllocationSiteToken, t2: FunctionToken | AccessPathToken) => void]>> = new Map;

    readonly listenersProcessed: Map<ListenerID, Set<Token>> = new Map;

    readonly pairListenersProcessed: Map<ListenerID, Map<AllocationSiteToken, Set<FunctionToken | AccessPathToken>>> = new Map;

    readonly packageNeighborListeners: Map<PackageInfo, Map<Node, (neighbor: PackageInfo) => void>> = new Map;

    ancestorListeners: Map<Token, Map<Node, (descendant: Token) => void>> = new Map;

    readonly ancestorListenersProcessed: Map<Node, Set<Token>> = new Map;

    readonly arrayEntriesListeners: Map<ArrayToken, Map<ListenerID, (prop: string) => void>> = new Map;

    objectPropertiesListeners: Map<ObjectPropertyVarObj, Map<ListenerID, (prop: string) => void>> = new Map;

    readonly packageNeighbors: Map<PackageInfo, Set<PackageInfo>> = new Map;

    readonly postponedListenerCalls: Array<[(t: Token) => void, Token] | [(t1: AllocationSiteToken, t2: FunctionToken | AccessPathToken) => void, [AllocationSiteToken, FunctionToken | AccessPathToken]] | [(neighbor: PackageInfo) => void, PackageInfo] | [(prop: string) => void, string]> = [];

    /**
     * Map that provides for each function/module the set of modules being required.
     */
    readonly requireGraph: Map<FunctionInfo | ModuleInfo, Set<ModuleInfo>> = new Map;

    /**
     * Map that provides for each function/module the set of functions that may be called.
     */
    readonly functionToFunction: Map<FunctionInfo | ModuleInfo, Set<FunctionInfo>> = new Map;

    /**
     * Map that provides for each call site location the set of functions that may be called. (For output only.)
     */
    readonly callToFunction: Map<Node, Set<FunctionInfo>> = new Map; // TODO: redundant? see callToFunctionOrModule

    /**
     * Map from call/require/import node to functions/modules that may be called/imported.
     */
    readonly callToFunctionOrModule: Map<Node, Set<FunctionInfo | ModuleInfo | DummyModuleInfo>> = new Map;

    readonly callToContainingFunction: Map<Node, ModuleInfo | FunctionInfo> = new Map;

    /**
     * Map from require/import call to the set of modules being required. (For output only.)
     */
    readonly callToModule: Map<Node, Set<ModuleInfo | DummyModuleInfo>> = new Map; // TODO: redundant? see callToFunctionOrModule

    /**
     * Total number of function->function call graph edges. (For statistics only.)
     */
    numberOfFunctionToFunctionEdges: number = 0;

    /**
     * Total number of call->function call graph edges. (For statistics only.)
     */
    numberOfCallToFunctionEdges: number = 0;

    /**
     * Functions that use 'arguments'.
     */
    readonly functionsWithArguments: Set<Function> = new Set;

    /**
     * Functions that use 'this'.
     */
    readonly functionsWithThis: Set<Function> = new Set;

    /**
     * Source code locations that correspond to the start of artificial functions in dyn.ts.
     * Such functions are ignored during soundness testing.
     */
    readonly artificialFunctions: Array<[ModuleInfo, Node]> = [];

    /**
     * Source locations of all calls (including accessor calls).
     */
    readonly callLocations: Set<Node> = new Set;

    /**
     * Source locations of calls to/from known native functions.
     */
    readonly nativeCallLocations: Set<Node> = new Set;

    /**
     * Source locations of calls to external functions.
     */
    readonly externalCallLocations: Set<Node> = new Set;

    /**
     * Calls with unused result.
     * Used by PatternMatcher.
     */
    readonly callsWithUnusedResult: Set<Node> = new Set;

    /**
     * Calls where the result may be used as a promise.
     * Used by PatternMatcher.
     */
    readonly callsWithResultMaybeUsedAsPromise: Set<Node> = new Set;

    /**
     * Constraint variables that represent function parameters.
     */
    readonly functionParameters: Map<Function, Set<ConstraintVar>> = new Map;

    /**
     * Expressions that are invoked at calls.
     * Used by PatternMatcher.
     */
    readonly invokedExpressions: Set<Node> = new Set;

    /**
     * Constraint variables that represent expressions whose values may escape to other modules.
     * Includes arguments to functions from other modules.
     */
    readonly maybeEscapingFromModule: Set<ConstraintVar> = new Set;

    /**
     * Object tokens that have been widened.
     */
    readonly widened: Set<ObjectToken> = new Set;

    /**
     * Constraint variables whose values may escape to external code.
     * The corresponding nodes are where the escaping occurs.
     */
    readonly maybeEscapingToExternal: Map<ConstraintVar, Set<Node>> = new Map;

    /**
     * Unhandled dynamic property write operations.
     */
    readonly unhandledDynamicPropertyWrites: Map<Node, {src: ConstraintVar, source: string | undefined}> = new Map;

    /**
     * Unhandled dynamic property read operations.
     */
    readonly unhandledDynamicPropertyReads: Set<Node> = new Set;

    /**
     * Error messages.
     */
    errors: Map<Node | undefined, string | Set<string>> = new Map;

    /**
     * Warning messages (excluding those about unsupported features).
     */
    warnings: Map<Node | undefined, string | Set<string>> = new Map;

    /**
     * Warning messages about unsupported features.
     */
    warningsUnsupported: Map<Node, string | Set<string>> = new Map;

    /**
     * 'require' expressions and import/export declarations/expressions where ModuleAccessPaths are created.
     * Used by PatternMatcher.
     */
    readonly moduleAccessPaths: Map<ModuleAccessPath, Set<Node>> = new Map;

    /**
     * Property read expressions where PropertyAccessPaths are created.
     * ap |-> prop |-> n |-> {bp, sub} means that ap appears at the base sub-expression of the property read expression n with
     * property prop, bp is the access path for n, and sub is the constraint variable of the sub-expression.
     * Used by PatternMatcher.
     */
    readonly propertyReadAccessPaths: Map<AccessPath, Map<string, Map<Node, {bp: PropertyAccessPath, sub: ConstraintVar}>>> = new Map;

    /**
     * Property write expressions where PropertyAccessPaths are created.
     * ap |-> prop |-> n |-> {bp, sub} means that ap appears at the base sub-expression of the property write expression n with
     * property prop, bp is the access path for n, and sub is the constraint variable of the sub-expression.
     * Used by PatternMatcher.
     */
    readonly propertyWriteAccessPaths: Map<AccessPath, Map<string, Map<Node, {bp: PropertyAccessPath, sub: ConstraintVar}>>> = new Map;

    /**
     * Expressions and associated CallResultAccessPaths where CallResultAccessPaths are created.
     * ap |-> n |-> {bp, sub} means that ap appears at the function sub-expression of the call expression n,
     * bp is the access path for n, and sub is the constraint variable of the sub-expression.
     * Used by PatternMatcher.
     */
    readonly callResultAccessPaths: Map<AccessPath, Map<Node, {bp: CallResultAccessPath, sub: ConstraintVar}>> = new Map;

    /**
     * Expressions and associated ComponentAccessPaths where ComponentAccessPaths are created.
     * ap |-> n |-> {bp, sub} means that ap appears at the function sub-expression of the component creation expression n,
     * bp is the access path for n, and sub is the constraint variable of the sub-expression.
     * Used by PatternMatcher.
     */
    readonly componentAccessPaths: Map<AccessPath, Map<Node, {bp: ComponentAccessPath, sub: ConstraintVar}>> = new Map;

    /**
     * Map from identifier declarations at imports to uses.
     * Used by PatternMatcher.
     */
    readonly importDeclRefs: Map<Identifier, Array<Identifier | JSXIdentifier>> = new Map;

    /**
     * Property reads that may have empty result.
     */
    maybeEmptyPropertyReads: Array<{result: ConstraintVar, base: ConstraintVar, pck: PackageObjectToken, prop: string | undefined}> = [];

    /**
     * Dynamic property writes.
     */
    dynamicPropertyWrites: Set<ConstraintVar> = new Set;

    constructor(s: Solver) {
        this.a = s.globalState;
        this.varProducer = new ConstraintVarProducer(s, this);
    }

    /**
     * Adds an edge in the call graph (both function->function and call->function).
     */
    registerCallEdge(call: Node, from: FunctionInfo | ModuleInfo, to: FunctionInfo,
                     {native, accessor, external}: {native?: boolean, accessor?: boolean, external?: boolean} = {}) {
        if ((!accessor || options.callgraphImplicit) &&
            (!native || options.callgraphNative) &&
            (!external || options.callgraphExternal)) {
            // register function->function
            let fs = mapGetSet(this.functionToFunction, from);
            if (!fs.has(to))
                this.numberOfFunctionToFunctionEdges++;
            fs.add(to);
            // register call->function
            let cs = mapGetSet(this.callToFunction, call);
            if (!cs.has(to)) {
                this.numberOfCallToFunctionEdges++;
                if (logger.isVerboseEnabled())
                    logger.verbose(`Adding call edge from call ${locationToStringWithFileAndEnd(call.loc)}, function ${from} -> ${to}`);
            }
            cs.add(to);
        }
        // register call->function/module
        mapGetSet(this.callToFunctionOrModule, call).add(to);
        this.callToContainingFunction.set(call, from);
    }

    /**
     * Registers a call location.
     */
    registerCall(n: Node, m: ModuleInfo, {native, external, accessor}: {native?: boolean, external?: boolean, accessor?: boolean} = {}) {
        if (accessor && !options.callgraphImplicit)
            return;
        if (!this.callLocations.has(n) ||
            (native && !this.nativeCallLocations.has(n)) ||
            (external && !this.externalCallLocations.has(n))) {
            if (logger.isDebugEnabled())
                logger.debug(`Adding ${native ? "native " : external ? "external " : accessor ? "accessor " : ""}call ${locationToStringWithFileAndEnd(n.loc!)}`);
            this.callLocations.add(n);
            if (native)
                this.nativeCallLocations.add(n);
            else if (external)
                this.externalCallLocations.add(n);
        }
    }

    /**
     * Registers a require/import call.
     */
    registerRequireCall(node: Node, from:  ModuleInfo | FunctionInfo, m: ModuleInfo | DummyModuleInfo) {
        if (options.callgraphRequire)
            mapGetSet(this.callToModule, node).add(m);
        mapGetSet(this.callToFunctionOrModule, node).add(m);
        this.callToContainingFunction.set(node, from);
    }

    /**
     * Registers an edge from a function/module to a module being required.
     */
    registerRequireEdge(from: FunctionInfo | ModuleInfo, to: ModuleInfo) {
        mapGetSet(this.requireGraph, from).add(to);
    }

    /**
     * Registers a call node whose result is unused.
     */
    registerCallWithUnusedResult(n: CallExpression | OptionalCallExpression | NewExpression) {
        this.callsWithUnusedResult.add(n);
    }

    /**
     * Registers a call node whose result may be used as a promise.
     */
    registerCallWithResultMaybeUsedAsPromise(n: CallExpression | OptionalCallExpression | NewExpression) {
        this.callsWithResultMaybeUsedAsPromise.add(n);
    }

    /**
     * Registers a constraint variable that represents a function parameter (identifiers only, excluding patterns).
     */
    registerFunctionParameter(v: ConstraintVar, fun: Function) {
        mapGetSet(this.functionParameters, fun).add(v);
    }

    /**
     * Registers that values of the expression represented by the given constraint variable may escape to other modules.
     */
    registerEscapingFromModule(v: ConstraintVar | undefined) {
        if (v)
            this.maybeEscapingFromModule.add(v);
    }

    /**
     * Registers a call to another module.
     */
    registerEscapingFromModuleArguments(args: CallExpression["arguments"], path: NodePath<CallExpression | OptionalCallExpression | NewExpression>) {
        for (const arg of args)
            if (isExpression(arg)) // TODO: handle non-Expression arguments?
                this.registerEscapingFromModule(this.varProducer.expVar(arg, path));
    }

    /**
     * Registers a constraint variable whose values may escape to external code.
     * Ignored if options.externalMatches is disabled.
     */
    registerEscapingToExternal(v: ConstraintVar | undefined, n: Node) {
        if (v && options.externalMatches) {
            if (logger.isDebugEnabled())
                logger.debug(`Values of ${v} escape to non-analyzed code at ${locationToStringWithFileAndEnd(n.loc)}`);
            mapGetSet(this.maybeEscapingToExternal, v).add(n);
        }
    }

    /**
     * Registers an expression that is invoked at a call.
     */
    registerInvokedExpression(n: Node) {
        this.invokedExpressions.add(n);
    }

    /**
     * Registers a function that may be ignored in output from dyn.ts.
     */
    registerArtificialFunction(m: ModuleInfo, n: Node) {
        this.artificialFunctions.push([m, n]);
    }

    /**
     * Registers an unhandled dynamic property write operation.
     */
    registerUnhandledDynamicPropertyWrite(node: Node, src: ConstraintVar, source: string | undefined) {
        this.unhandledDynamicPropertyWrites.set(node, {src, source});
    }

    /**
     * Registers an unhandled dynamic property read operation.
     */
    registerUnhandledDynamicPropertyRead(node: Node) {
        this.unhandledDynamicPropertyReads.add(node);
    }

    private makeMsg(msg: string, node?: Node): string {
        return `${msg}${node ? ` at ${locationToStringWithFile(node.loc)}` : ""}`;
    }

    /**
     * Emits an error message.
     * Avoids duplicates.
     */
    error(msg: string, node?: Node) {
        if (addMapHybridSet(node, msg, this.errors))
            logger.error(`Error: ${this.makeMsg(msg, node)}`);
    }

    /**
     * Emits a warning message. (See also warnUnsupported.)
     * Avoids duplicates.
     */
    warn(msg: string, node?: Node) {
        if (addMapHybridSet(node, msg, this.warnings))
            logger.warn(`Warning: ${this.makeMsg(msg, node)}`);
    }

    /**
     * Emits a warning message about an unsupported language feature or library function.
     * Avoids duplicates.
     */
    warnUnsupported(node: Node, msg: string = node.type) {
        if (addMapHybridSet(node, msg, this.warningsUnsupported) && options.warningsUnsupported)
            logger.warn(`Warning: ${this.makeMsg(msg, node)}`);
    }

    /**
     * Reports warnings about unhandled dynamic property write operations with nonempty token sets.
     * The source code and the tokens are included in the output if loglevel is verbose or higher.
     */
    reportNonemptyUnhandledDynamicPropertyWrites() {
        for (const [node, {src, source}] of this.unhandledDynamicPropertyWrites.entries()) {
            const [size, ts] = this.getTokensSize(this.getRepresentative(src));
            if (size > 0) {
                let funs = 0;
                for (const t of ts)
                    if (t instanceof FunctionToken)
                        funs++;
                this.warnUnsupported(node, `Nonempty dynamic property write (${funs} function${funs === 1 ? "" : "s"})`);
                if (logger.isVerboseEnabled() && source !== undefined) {
                    logger.warn(source);
                    for (const t of ts)
                        logger.warn(`  ${t}`);
                }
            }
        }
    }

    /**
     * Reports warnings about unhandled dynamic property read operations.
     */
    reportNonemptyUnhandledDynamicPropertyReads() {
        for (const node of this.unhandledDynamicPropertyReads)
            this.warnUnsupported(node, "Dynamic property read");
    }

    /**
     * Registers that the current function uses 'arguments'.
     */
    registerArguments(path: NodePath): Function | undefined {
        const f = this.getEnclosingFunction(path);
        if (f) {
            this.functionsWithArguments.add(f);
            if (logger.isDebugEnabled())
                logger.debug(`Function uses 'arguments': ${locationToStringWithFile(f.loc)}`);
        }
        return f;
    }

    /**
     * Registers that the current function uses 'this'.
     */
    registerThis(path: NodePath): Function | undefined {
        const f = this.getEnclosingFunction(path);
        if (f) {
            this.functionsWithThis.add(f);
            if (logger.isDebugEnabled())
                logger.debug(`Function uses 'this': ${locationToStringWithFile(f.loc)}`);
        }
        return f;
    }

    /**
     * Returns the enclosing (non-arrow) function, or undefined if no such function.
     */
    getEnclosingFunction(path: NodePath): Function | undefined {
        let p: NodePath | NodePath<Function> | null | undefined = path, f: Function | undefined;
        do {
            f = (p = p?.getFunctionParent())?.node;
        } while (f && isArrowFunctionExpression(f));
        return f;
    }

    /**
     * Returns the representative of the given constraint variable.
     * Also shortcuts redirections that involve multiple steps.
     */
    getRepresentative(v: ConstraintVar): RVT {
        let w = v;
        const ws = [];
        while (true) {
            const w2 = this.redirections.get(w);
            if (!w2)
                break;
            assert(ws.length < 100);
            ws.push(w);
            w = w2;
        }
        for (let i = 0; i + 1 < ws.length; i++) {
            assert(ws[i] !== w);
            this.redirections.set(ws[i], w);
        }
        return w as RVT;
    }

    /**
     * Returns whether the given constraint variable is a representative.
     */
    isRepresentative(v: ConstraintVar): v is RVT {
        return !this.redirections.has(v);
    }


    /**
     * Returns the tokens in the solution for the given constraint variable
     * (or empty if v is undefined).
     */
    getTokens(v: RVT | undefined): Iterable<Token> {
        if (v) {
            const ts = this.tokens.get(v);
            if (ts) {
                if (ts instanceof Token)
                    return [ts];
                return ts;
            }
        }
        return [];
    }

    /**
     * Returns the number of tokens in the solution for the given constraint variable, and the tokens.
     */
    getTokensSize(v: RVT | undefined): [number, Iterable<Token>] {
        if (v) {
            const ts = this.tokens.get(v);
            if (ts) {
                if (ts instanceof Token)
                    return [1, [ts]];
                return [ts.size, ts];
            }
        }
        return [0, []];
    }

    /**
     * Returns all constraint variables with their tokens and number of tokens.
     */
    *getAllVarsAndTokens(): Iterable<[RVT, Set<Token> | Array<Token>, number]> {
        for (const [v, ts] of this.tokens)
            if (ts instanceof Token)
                yield [v, [ts], 1];
            else
                yield [v, ts, ts.size];
    }

    /**
     * Returns the number of tokens and a 'has' function for the given constraint variable.
     */
    getSizeAndHas(v: RVT | undefined): [number, (t: Token) => boolean] {
        if (v) {
            const ts = this.tokens.get(v);
            if (ts) {
                if (ts instanceof Token)
                    return [1, (t: Token) => ts === t];
                return [ts.size, (t: Token) => ts.has(t)];
            }
        }
        return [0, (_t: Token) => false];
    }

    /**
     * Returns the number of constraint variables with tokens.
     */
    getNumberOfVarsWithTokens() {
        return this.tokens.size;
    }

    /**
     * Returns the maximum number of tokens of all constraint variables.
     */
    getLargestTokenSetSize(): number {
        let c = 0;
        for (const v of this.tokens.values()) {
            const s = v instanceof Token ? 1 : v.size;
            if (s > c)
                c = s;
        }
        return c;
    }

    /**
     * Returns the maximum number of outgoing subset edges of all constraint variables.
     */
    getLargestSubsetEdgeOutDegree(): number {
        let c = 0;
        for (const vs of this.subsetEdges.values())
            if (vs.size > c)
                c = vs.size;
        return c;
    }

    /**
     * Checks whether the given variable has tokens.
     */
    hasVar(v: RVT) {
        return this.tokens.has(v);
    }

    /**
     * Removes all tokens from the given variable.
     */
    deleteVar(v: RVT) {
        this.tokens.delete(v);
    }

    /**
     * Replaces tokens for a constraint variable.
     */
    replaceTokens(v: RVT, ts: Set<Token>, old: number) {
        this.tokens.set(v, ts.size === 1 ? ts.values().next().value : ts);
        this.numberOfTokens += ts.size - old;
    }

    /**
     * Adds the given token to the solution for the given constraint variable.
     * @return true if not already there, false if already there
     */
    addToken(t: Token, v: RVT): boolean {
        const ts = this.tokens.get(v);
        if (!ts)
            this.tokens.set(v, t);
        else if (ts instanceof Token) {
            if (ts === t)
                return false;
            this.tokens.set(v, new Set([ts, t]));
        } else {
            if (ts.has(t))
                return false;
            ts.add(t);
        }
        this.numberOfTokens++;
        return true;
    }

    /**
     * Adds the given tokens to the solution for the given constraint variable.
     * It is assumed that the given set does not contain any duplicates.
     * @return the tokens that have been added, excluding those already there
     */
    addTokens(ts: Iterable<Token>, v: RVT): Array<Token> {
        const added: Array<Token> = [];
        let vs = this.tokens.get(v);
        for (const t of ts) {
            let add = false;
            if (!vs) {
                vs = t;
                this.tokens.set(v, vs);
                add = true;
            } else if (vs instanceof Token) {
                if (vs !== t) {
                    vs = new Set([vs, t]);
                    this.tokens.set(v, vs);
                    add = true;
                }
            } else if (!vs.has(t)) {
                vs.add(t);
                add = true;
            }
            if (add)
                added.push(t);
        }
        this.numberOfTokens += added.length;
        return added;
    }

    /**
     * Returns the tokens the given token inherits from (reflexively and transitively).
     */
    getAncestors(t: Token): Set<Token> {
        const res = new Set<Token>();
        res.add(t);
        const w = [t];
        while (w.length !== 0) {
            const s = this.inherits.get(w.shift()!);
            if (s)
                for (const p of s)
                    if (!res.has(p)) {
                        res.add(p);
                        w.push(p);
                    }
        }
        return res;
    }

    /**
     * Returns the tokens that inherit from the given token (reflexively and transitively).
     */
    getDescendants(t: Token): Set<Token> {
        const res = new Set<Token>();
        res.add(t);
        const w = [t];
        while (w.length !== 0) {
            const s = this.reverseInherits.get(w.shift()!);
            if (s)
                for (const p of s)
                    if (!res.has(p)) {
                        res.add(p);
                        w.push(p);
                    }
        }
        return res;
    }
}
