import {Function, Node} from "@babel/types";
import {Location, locationToStringWithFileAndEnd} from "../misc/util";
import assert from "assert";
import {ModuleInfo, PackageInfo} from "./infos";
import {AccessPath} from "./accesspaths";
import {NativeFunctionAnalyzer} from "../natives/nativebuilder";

/**
 * Abstract value for constraint variables.
 */
export abstract class Token {

    abstract toString(): string
}

/**
 * Token that represents function objects.
 */
export class FunctionToken extends Token {

    constructor(
        readonly fun: Function,
        readonly moduleInfo: ModuleInfo
    ) {
        super();
    }

    toString() {
        return `Function[${locationToStringWithFileAndEnd(this.fun.loc, true)}]`;
    }
}

/**
 * Object kinds, used by AllocationSiteToken and PackageObjectToken.
 *
 * Iterator represents an abstraction of Iterator, Iterable, IterableIterator, IteratorResult, Generator and AsyncGenerator
 * (thus conflating the different kinds of objects).
 * It has a property 'value' holding the iterator values and a method 'next' that returns the abstract object itself.
 *
 * PromiseResolve and PromiseReject represent the resolve and reject function arguments of promise executors,
 * using the same allocation site as the promise they belong to.
 */
export type ObjectKind = "Object" | "Array" | "Class" | "Map" | "Set" | "WeakMap" | "WeakSet" | "WeakRef" | "Iterator" | "RegExp" | "Date" | "Promise" | "PromiseResolve" | "PromiseReject";

/**
 * Token that represents objects with a specific allocation site.
 */
export class AllocationSiteToken extends Token {

    constructor(
        readonly kind: ObjectKind,
        readonly allocSite: Node
    ) {
        super();
        assert(this instanceof ArrayToken || kind !== "Array", "AllocationSiteTokens of kind Array must be created using ArrayToken");
        assert(this instanceof ObjectToken || kind !== "Object", "AllocationSiteTokens of kind Object must be created using ObjectToken");
        assert(this instanceof ClassToken || kind !== "Class", "AllocationSiteTokens of kind Class must be created using ClassToken");
    }

    toString() {
        return `${this.kind}[${locationToStringWithFileAndEnd(this.allocSite.loc, true)}]`;
    }
}

/**
 * Token that represents ordinary objects with a specific allocation site.
 */
export class ObjectToken extends AllocationSiteToken {

    constructor(allocSite: Node) {
        super("Object", allocSite);
    }

    getPackageInfo() {
        const loc = this.allocSite.loc as Location;
        assert(loc && loc.module);
        return loc.module.packageInfo;
    }
}

/**
 * Token that represents arrays with a specific allocation site.
 */
export class ArrayToken extends AllocationSiteToken {

    constructor(allocSite: Node) {
        super("Array", allocSite);
    }
}

/**
 * Token that represents classes with a specific allocation site.
 */
export class ClassToken extends AllocationSiteToken {

    constructor(allocSite: Node) {
        super("Class", allocSite);
    }
}

/**
 * Token that represents a native object.
 */
export class NativeObjectToken extends Token {

    constructor(
        readonly name: string,
        readonly moduleInfo?: ModuleInfo,
        readonly invoke?: NativeFunctionAnalyzer,
        readonly constr: boolean = false
    ) {
        super();
    }

    toString() {
        return `%${this.name}${this.moduleInfo ? `[${this.moduleInfo}]` : ""}`;
    }
}

/**
 * Token that represents unknown values belonging to a specific package.
 */
export class PackageObjectToken extends Token {

    constructor(
        readonly packageInfo: PackageInfo,
        readonly kind: ObjectKind = "Object"
    ) {
        super();
    }

    toString() {
        return `*${this.kind === "Object" ? "" : `(${this.kind})`}[${this.packageInfo}]`;
    }
}

/**
 * Token that describes values that come from non-analyzed code (either libraries or clients).
 * In vulnerability pattern matching mode, access path tokens are used for values from tracked modules.
 */
export class AccessPathToken extends Token {

    constructor(readonly ap: AccessPath) {
        super();
    }

    toString(): string {
        return `@${this.ap}`;
    }
}
