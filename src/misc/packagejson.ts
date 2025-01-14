import {FilePath} from "./util";
import {dirname, relative, resolve, sep} from "path";
import {existsSync, readFileSync} from "fs";
import logger from "./logger";
import {options} from "../options";

/**
 * Information about a package.json file.
 */
export interface PackageJsonInfo {

    /**
     * Package key generated from its name and version, or "<unknown>" if package.json file is not found.
     */
    packagekey: string;

    /**
     * Package name, "<main>" if package.json file is not found, or "<anonymous>" if the main field is missing.
     */
    name: string;

    /**
     * Package version, undefined if not available.
     */
    version: string | undefined;

    /**
     * Normalized main file, undefined if not set or file is absent.
     */
    main: string | undefined;

    /**
     * Directory containing the package.json file, or current working directory if the file is not found.
     */
    dir: string;
}

/**
 * Finds the enclosing package.json file if present.
 */
export function findPackageJson(file: FilePath): {packageJson: FilePath, dir: FilePath} | undefined {
    let dir = file;
    while (true) {
        if (doesDirContainPackageJsonForNpmPackage(dir))
            return {packageJson: resolve(dir, "package.json"), dir};
        const d = dirname(dir);
        if (d === dir || (options.basedir && !d.startsWith(dirname(options.basedir))))
            return undefined;
        dir = d;
    }
}

/**
 * Checks whether dir has a package.json file and if dir is inside node_modules, it also checks
 * that the name of the package.json file matches the directory name relative to node_modules.
 * If dir is not inside node_modules, it is assumed that the package.json file is correct.
 */
function doesDirContainPackageJsonForNpmPackage(dir: FilePath): boolean {
    const packageJson = resolve(dir, "package.json");
    if (!existsSync(packageJson))
        return false;
    // if package exists, check if it is the correct one, i.e., that the name matches the directory name relative to node_modules
    const nodeModulesDirString = `node_modules${sep}`;
    const lastIndexOfNodeModules = dir.lastIndexOf(nodeModulesDirString);
    if (lastIndexOfNodeModules === -1)
        return true;
    const lastNodeModulesPath = dir.substring(0, lastIndexOfNodeModules + nodeModulesDirString.length);
    const expectedNameOfPackage = relative(lastNodeModulesPath, dir);
    return parsePackageJson(packageJson).name === expectedNameOfPackage;
}

function parsePackageJson(packageJson: FilePath) {
    return JSON.parse(readFileSync(packageJson, {encoding: "utf8"}));
}

/**
 * Extracts PackageJsonInfo for the package containing the given file.
 */
export function getPackageJsonInfo(tofile: FilePath): PackageJsonInfo {
    let packagekey, name, version, main, dir;
    const p = findPackageJson(tofile); // TODO: add command-line option to skip search for package.json for entry files?
    let f;
    if (p) {
        try {
            f = parsePackageJson(p.packageJson);
        } catch {
            logger.warn(`Unable to parse ${p.packageJson}`);
        }
    }
    if (p && f) {
        dir = p.dir;
        if (!f.name)
            logger.verbose(`Package name missing in ${p.packageJson}`);
        name = f.name || "<anonymous>";
        if (!f.version)
            logger.verbose(`Package version missing in ${p.packageJson}`);
        version = f.version;
        packagekey = `${name}@${version ?? "?"}`
        if (f.main) {
            try {
                // normalize main file path
                main = relative(dir, require.resolve("./".includes(f.main[0]) ? f.main : "./" + f.main, {paths: [dir]}));
            } catch {
                logger.verbose(`Unable to locate package main file '${f.main}' at ${dir}`);
                main = undefined;
            }
        }
    } else {
        name = "<main>";
        packagekey = "<unknown>";
        dir = process.cwd();
    }
    return {packagekey, name, version, main, dir}
}
