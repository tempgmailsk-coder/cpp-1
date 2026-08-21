import { readFileSync, mkdirSync, createWriteStream } from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const data = JSON.parse(
  readFileSync(path.join(process.cwd(), "scripts", "constitution-data.json"), "utf8")
);

mkdirSync(path.join(process.cwd(), "public"), { recursive: true });
const out = path.join(process.cwd(), "public", "cpp-constitution.pdf");
const doc = new PDFDocument({ size: "A4", margins: { top: 56, bottom: 56, left: 56, right: 56 } });
const stream = doc.pipe(createWriteStream(out));

const BLACK = "#0a0a0a";
const GRAY = "#525252";
const LIGHT = "#a3a3a3";

// Cover
doc.fontSize(11).fillColor(LIGHT).text("COMMON PEOPLE'S PARTY (CPP)", { align: "center" });
doc.moveDown(2);
doc.fontSize(24).fillColor(BLACK).text(data.title, { align: "center", lineGap: 6 });
doc.moveDown(0.5);
doc.fontSize(12).fillColor(GRAY).text(data.version, { align: "center" });
doc.moveDown(1);
doc.fontSize(11).fillColor(GRAY).text(data.tagline, { align: "center" });
doc.moveDown(2);
doc.fontSize(10).fillColor(GRAY).text(
  "This document is the comprehensive operational and governance framework of the Common People's Party.",
  { align: "center", lineGap: 4 }
);
doc.addPage();

// Table of contents
doc.fontSize(16).fillColor(BLACK).text("Contents", { align: "center" });
doc.moveDown(1);
for (const chapter of data.chapters) {
  doc.fontSize(11).fillColor(BLACK).text(`Chapter ${chapter.no} — ${chapter.title}`, { lineGap: 2 });
  doc.fontSize(9).fillColor(GRAY).text(
    chapter.articles.map((a) => `Article ${a.no}: ${a.title}`).join("  •  "),
    { lineGap: 3 }
  );
  doc.moveDown(0.6);
}
doc.addPage();

// Articles
for (const chapter of data.chapters) {
  doc.fontSize(9).fillColor(LIGHT).text(`CHAPTER ${chapter.no}`, { characterSpacing: 2 });
  doc.moveDown(0.3);
  doc.fontSize(16).fillColor(BLACK).text(chapter.title);
  doc.moveDown(0.5);
  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor(BLACK)
    .lineWidth(1)
    .stroke();
  doc.moveDown(0.8);

  for (const article of chapter.articles) {
    if (doc.y > doc.page.height - 140) doc.addPage();
    doc.fontSize(11).fillColor(BLACK).text(`Article ${article.no} — ${article.title}`, { lineGap: 2 });
    doc.fontSize(10).fillColor(GRAY).text(article.content, { lineGap: 4, align: "justify" });
    doc.moveDown(0.8);
  }
  doc.addPage();
}

// Back page
doc.fontSize(9).fillColor(LIGHT).text("Common People's Party", { align: "center" });
doc.fontSize(9).fillColor(LIGHT).text("Defined Responsibility • Limited Power • Continuous Public Accountability", { align: "center" });

doc.end();
stream.on("finish", () => console.log("PDF written to", out));
