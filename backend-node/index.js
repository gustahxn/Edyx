const express = require("express");
const puppeteer = require("puppeteer");
const HTMLtoDOCX = require("html-to-docx");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.post("/export/pdf", async (req, res) => {
  try {
    const { content, margins } = req.body;
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    const html = `
      <html>
        <head>
          <style>
            @page { 
              size: A4; 
              margin: ${margins.t}cm ${margins.r}cm ${margins.b}cm ${margins.l}cm; 
            }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 12pt; 
              line-height: 1.5; 
              color: #1a1a1a;
              margin: 0;
            }
            p { margin: 0; padding: 0; min-height: 1em; }
            ul, ol { padding-left: 1.5rem; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ format: "A4", printBackground: true });

    await browser.close();
    res.contentType("application/pdf");
    res.send(pdf);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/export/docx", async (req, res) => {
  try {
    const { content, margins } = req.body;

    const fileBuffer = await HTMLtoDOCX(content, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
      margins: {
        top: margins.t * 567,
        right: margins.r * 567,
        bottom: margins.b * 567,
        left: margins.l * 567,
      },
    });

    res.contentType(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.send(fileBuffer);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(8080, () => {
  console.log("Backend Edyx rodando na porta 8080");
});
