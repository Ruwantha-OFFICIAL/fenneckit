/*==================================
* Copyright 2026 lasith ruwantha amrwansha
* Written by 2026/09/17
* Author: ruwantha amrwansha
* Library: FennecKit 🦊
*===================================*/

import chalk from "chalk"

// Development-time message utility
class messages {
  static error = (msg: string): never => {
    return this.brakOf(msg);
  }
  
  static brakOf(msg: string): never {
    console.log(chalk.bgRed.black("[error]:"), msg);
    process.exit(0);
  }

  static succes(msg: string): void {
    console.log(chalk.bgGreen.black("[success]:"), msg);
  }

  static log(msg: string): void {
    console.log(chalk.bgWhite.black("[logs]:"), msg);
  }

  static worring(msg: string): void {
    console.log(chalk.bgYellow.black("[worring]:"), msg);
  }
}

interface TestContext {
  succes: (msg: string) => void;
  err: (msg: string) => never;
  log: (msg: string) => void;
  worrn: (msg: string) => void;
}

/*
* Single-level testing toolkit for quick development-time utility checks
*/
export async function testing<T>(fn: (t: TestContext) => T | Promise<T>): Promise<T | void> {
  const context: TestContext = {
    succes: (msg) => messages.succes(msg),
    err: (msg) => messages.error(msg),
    log: (msg) => messages.log(msg),
    worrn: (msg) => messages.worring(msg)
  };

  try {
    const result = await fn(context);
    return result;
  } catch (error) {
    console.error(chalk.bgRed.black("[exception]:"), error);
  }
}
