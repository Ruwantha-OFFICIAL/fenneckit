import { access, writeFile } from "fs/promises";
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

export async function report(data: string): Promise<void> {
  const repotPath = path.join(process.cwd(), "fenneckit.md")

  try {
    await access(repotPath)
    await writeFile(repotPath, data, { flag: 'a' });
  } catch {
    await writeFile(repotPath, headOfRepotPath + data)
  }
}
