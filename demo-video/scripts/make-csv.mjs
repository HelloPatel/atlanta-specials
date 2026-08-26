// Generates a realistic guest spreadsheet (CSV) used by the "import" demo scene.
//   node demo-video/scripts/make-csv.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, "fixtures");
mkdirSync(OUT, { recursive: true });

const firstBride = ["Priya", "Anjali", "Kavya", "Meera", "Riya", "Sneha", "Divya", "Pooja", "Nisha", "Aditi", "Ishita", "Tara", "Sana", "Neha", "Simran"];
const firstGroom = ["Arjun", "Rohan", "Vikram", "Aditya", "Karan", "Rahul", "Dev", "Sameer", "Nikhil", "Varun", "Kabir", "Yash", "Aryan", "Manish", "Raj"];
const families = ["Sharma", "Patel", "Iyer", "Reddy", "Kapoor", "Nair", "Gupta", "Mehta", "Rao", "Chopra", "Malhotra", "Verma", "Desai", "Bose", "Joshi"];
const relations = ["Cousin", "Uncle", "Aunt", "Family Friend", "College Friend", "Colleague", "Neighbor", "Nephew", "Niece", "Grandparent"];

const rows = [["Full Name", "Email", "Family", "Side", "Relation"]];
let n = 0;
for (const family of families) {
  const side = Math.random() > 0.5 ? "Bride" : "Groom";
  const pool = side === "Bride" ? firstBride : firstGroom;
  const count = 8 + Math.floor(Math.random() * 4); // 8-11 per family
  for (let i = 0; i < count; i++) {
    const first = pool[(i + n) % pool.length];
    const name = `${first} ${family}`;
    const email = `${first}.${family}${i}`.toLowerCase() + "@example.com";
    rows.push([name, email, `${family} Family`, side, relations[(i + n) % relations.length]]);
    n++;
  }
}

const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
const path = join(OUT, "import-guests.csv");
writeFileSync(path, csv, "utf8");
console.log(`\u2713 wrote ${path} (${rows.length - 1} guests)`);
