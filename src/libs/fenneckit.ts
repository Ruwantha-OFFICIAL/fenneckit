/*==================================
* Copyright 2026 lasith ruwantha amrwansha
* Written by 2026/09/17
* Author: ruwantha amrwansha
* Library: FennecKit 🦊
*===================================*/
import { readdir,unlink } from "fs/promises";
import { execSync } from "child_process";
import chalk from "chalk";

async function LabsFile(path: string): Promise<string[]> {
    const labs: string[] = [];
    try {
        const files = await readdir(path, { withFileTypes: true });
        for (const file of files) {
            if (file.name.endsWith(".labs.js")) {
                labs.push(file.name);
            }
            else if (file.isDirectory()) {
                if (file.name === "node_modules" || file.name.startsWith("."))
                    continue;
                let x: string[] = await LabsFile(`${path}/${file.name}`);
                x = x.map((e: string) => `${file.name}/${e}`);
                labs.push(...x);
            }
        }
        return labs;
    }
    catch (error: unknown) {
        throw new Error("Can't find Labs File", { cause: error });
    }
}

function Runner(path: string): boolean {
    try {
        console.log(chalk.cyan(`\n🔬 Running: ${path}`));
        execSync(`node ${path}`, { 
            stdio: "inherit",
            timeout: 60000
        });
        console.log(chalk.green(`✅ Finished: ${path}\n`));
        return true;
    }
    catch (error: unknown) {
        const errMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(`\n❌ Failed: ${path}`));
        console.error(chalk.red(`   Error: ${errMessage}\n`));
        return false; 
    }
}

async function fenneckit(): Promise<void> {
    const args = process.argv.slice(2);
    if (args.includes("--help") || args.includes("-h")) {
        console.log(`
FennecKit 🦊

Usage:
  npx fenneckit                  Run all *.labs.js files
  npx fenneckit <file.labs.js>  Run single file
  npx fenneckit --help          Show help
  npx fenneckit --version       Show version
`);
        return;
    }
    if (args.includes("--version") || args.includes("-v")) {
        console.log("FennecKit 🦊 v1.0.4");
        return;
    }

    const singleFile = args.find(a => !a.startsWith("-"));
    if (singleFile) {
        Runner(singleFile);
        return;
    }

    const path = process.cwd();
    const labs = await LabsFile(path);
    
    if (labs.length === 0) {
        console.log(chalk.yellow("\n⚠️  No .labs.js files found.\n"));
        return;
    }

    console.log(chalk.blue(`\n📊 Found ${labs.length} lab file(s)\n`));

    let passed = 0;
    let failed = 0;

    for (const file of labs) {
        const success = Runner(file);
        if (success) passed++;
        else failed++;
    }
    console.log(chalk.blue(`\n${'='.repeat(50)}`));
    console.log(chalk.blue(`📋 Test Summary:`));
    console.log(chalk.green(`   ✅ Passed: ${passed}`));
    if (failed > 0) console.log(chalk.red(`   ❌ Failed: ${failed}`));
    console.log(chalk.blue(`${'='.repeat(50)}\n`));
}

function banner(): void {
    const neon = chalk.hex("#1F51FF");
    console.log(neon(`
8888888888                                           888    d8P  d8b 888
888                                                  888   d8P   Y8P 888
888                                                  888  d8P        888
8888888  .d88b.  88888b.  88888b.   .d88b.   .d8888b 888d88K     888 888888
888     d8P  Y8b 888 "88b 888 "88b d8P  Y8b d88P"    8888888b    888 888
888     88888888 888  888 888  888 88888888 888      888  Y88b   888 888
888     Y8b.     888  888 888  888 Y8b.     Y8b.    888   Y88b  888 Y8b.
888      "Y8888  888  888 888  888  "Y8888   "Y8888P 888    Y88b 888  "Y888
`));
}

async function deleteOldReport():Promise<void>{
  try {
    await unlink("./fenneckit.md");
  } catch {
    
  }
}

console.log("\n");
banner();
deleteOldReport();
fenneckit();
