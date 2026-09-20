/*==================================
* Copyright 2026 lasith ruwantha amrwansha
* Written by 2026/09/17
* Author: ruwantha amrwansha
* Library: FennecKit 🦊
* Version: 1.1.0-beta (with clearStore feature)
*===================================*/

import { access, writeFile } from "fs/promises"
import path from "path"

interface LabContext {
  out: () => void;
  ret: () => void;
  flatErr: (msg: string) => void;
  err: (msg: string) => void;
  done: (msg: string) => void;
  log: (msg: string) => void;
  warning: (msg: string) => void;
  setStore: (key: string, value: any) => void;
  getStore: (key: string) => any;
  clearStore: (key?: string) => void;
  setTemp: (key: string, value: any) => void;
  getTemp: (key: string) => any;
  test: <T>(testName: string, testFn: () => T | Promise<T>) => Promise<T>;
}

const d = new Date();
const nowDate = d.toISOString().split('T')[0].replaceAll('-', '/')

const Store = new Map<string, any>();

const headOfRepotPath = `
# FennecKit 🦊 Report

**🚀 Version:** 1.1.0-beta
**⏰ Date:** ${nowDate}
**✨ Features:** Zero Config • Sequential Labs • Inter-Lab Data Sharing • Store Management

---\n\n
`;

async function writeRepot(data: string): Promise<void> {
  const repotPath = path.join(process.cwd(), "fenneckit.md")

  try {
    await access(repotPath)
    await writeFile(repotPath, data, { flag: 'a' });
  } catch {
    await writeFile(repotPath, headOfRepotPath + data)
  }
}

export async function newLabs(
  name: string,
  fn: (kit: LabContext) => void | Promise<void>,
  retCount = 0
): Promise<void> {
  let logs = `## ${name} 🌏\n\n\`\`\`\n`;
  let currentTest = "";
  const temp = new Map<string, any>();

  const Context: LabContext = {
    out: () => {
      throw new Error("__Lab_Out__");
    },

    ret: () => {
      if (retCount < 3) {
        throw new Error("__Restart__");
      } else {
        Context.err("Restart limit exceeded (max 3 attempts)");
      }
    },

    flatErr: (msg) => {
      logs += `[🔴] ${currentTest}: ${msg}\n`;
      console.log(`  ❌ [Failed] ${currentTest} -> ${msg}`);
    },

    err: (msg) => {
      logs += `[🔴] ${currentTest}: ${msg}\n`;
      console.log(`  🛑 [Error] ${currentTest} -> ${msg}`);
      Context.out();
    },

    done: (msg) => {
      logs += `[🟢] ${currentTest}: ${msg}\n`;
      console.log(`  ✅ [Done] ${currentTest} -> ${msg}`);
    },

    log: (msg) => {
      logs += `[⚪] ${currentTest}: ${msg}\n`;
      console.log(`  📝 [Info] ${currentTest} -> ${msg}`);
    },

    warning: (msg) => {
      logs += `[🟡] ${currentTest}: ${msg}\n`;
      console.log(`  ⚠️ [Warning] ${currentTest} -> ${msg}`);
    },

    setStore: (key, value) => {
      logs += `[⚙️] [STORE] set "${key}"\n`;
      Store.set(key, value);
    },

    getStore: (key) => {
      logs += `[⚙️] [STORE] get "${key}"\n`;
      return Store.get(key);
    },

    clearStore: (key?: string) => {
      if (key) {
        logs += `[⚙️] [STORE] cleared key "${key}"\n`;
        console.log(`  🧹 [Store] Cleared: "${key}"`);
        Store.delete(key);
      } else {
        logs += `[⚙️] [STORE] cleared all data\n`;
        console.log(`  🧹 [Store] Cleared all Store data`);
        Store.clear();
      }
    },

    setTemp: (key, value) => {
      logs += `[⏱️] [TEMP] set "${key}"\n`;
      temp.set(key, value);
    },

    getTemp: (key) => {
      logs += `[⏱️] [TEMP] get "${key}"\n`;
      return temp.get(key);
    },

    test: async (testName, testFn) => {
      currentTest = testName;
      try {
        return await testFn();
      } catch (e: any) {
        console.log(`  🐛 [Bug Exception] in "${testName}":`, e.message || e);
        throw e;
      }
    }
  };

  console.log(`\n🔬 [Lab Initiated]: ${name}`);

  try {
    await fn(Context);
  } catch (err: any) {
    if (err.message === "__Lab_Out__") {
      logs += "```\n";
      temp.clear();
      return await writeRepot(logs);
    } else if (err.message === "__Restart__") {
      return newLabs(name, fn, retCount + 1);
    }
    console.log(`❌ [Lab Failed]: ${name}\n`);
    await writeRepot(logs + "```\n");
    temp.clear();
    return;
  }

  logs += "```\n";
  console.log(`✅ [Lab Success]: ${name} completed successfully.\n`);
  temp.clear();
  await writeRepot(logs);
}


// Global Store hadels
export function clearStore(key?: string): void {
  if (key) {
    Store.delete(key);
    console.log(`🧹 [Global] Cleared store key: "${key}"`);
  } else {
    Store.clear();
    console.log(`🧹 [Global] Cleared all Store data`);
  }
}

export function getStoreState(): Map<string, any> {
  return new Map(Store);
}

process.on('exit', () => {
  console.log("[⛔] All Labs stopped");
  Store.clear();
});
