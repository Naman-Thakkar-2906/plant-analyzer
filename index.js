// Required Modules

require("dotenv").config();
const express = require("express");
const multer = require("multer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: "uploads/" });

const PORT = process.env.PORT || 4000;

// Initalize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/analyze", upload.single("image"), async (req, res) => {
  function formatResult(text) {
    const sections = {
      species: "",
      health: "",
      care: "",
      characteristics: "",
    };

    const parts = text.split(
      /Species Identification:|Plant Health:|Care Recommendations:|Characteristics:/,
    );

    sections.species = parts[1]?.trim();
    sections.health = parts[2]?.trim();
    sections.care = parts[3]?.trim();
    sections.characteristics = parts[4]?.trim();

    return sections;
  }

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const imgPath = req.file.path;
    const imgData = await fsPromises.readFile(imgPath, { encoding: "base64" });

    let result;
    let usedModel = "Gemini 2.5 Flash";

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      result = await model.generateContent([
        `Analyze this plant image and respond ONLY in this exact format:

             Species Identification:
             <content>

             Plant Health:
             <content>

             Care Recommendations:
             <content>

             Characteristics:
             <content>

             Do not add extra text or formatting.`,
        {
          inlineData: {
            mimeType: req.file.mimetype,
            data: imgData,
          },
        },
      ]);
    } catch (apiError) {
      console.warn(
        "Gemini 2.5 Flash failed or busy, falling back to Gemini 2.5 Flash:",
        apiError.message,
      );
      usedModel = "Gemini 2.5 Flash";
      const modelFallback = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });
      result = await modelFallback.generateContent([
        `Analyze this plant image and respond ONLY in this exact format:

             Species Identification:
             <content>

             Plant Health:
             <content>

             Care Recommendations:
             <content>

             Characteristics:
             <content>

             Do not add extra text or formatting.`,
        {
          inlineData: {
            mimeType: req.file.mimetype,
            data: imgData,
          },
        },
      ]);
    }

    const plantInfo = result.response.text();
    const formatted = formatResult(plantInfo);

    // delete uploaded file
    await fsPromises.unlink(imgPath);

    res.render("result", {
      data: formatted,
      image: `data:${req.file.mimetype};base64,${imgData}`,
      modelName: usedModel,
    });
  } catch (e) {
    console.error("Error analyzing image:", e);
    res.status(500).json({
      error: "An error occurred while analyzing the image",
    });
  }
});

app.post(
  "/download",
  express.urlencoded({ extended: true }),
  async (req, res) => {
    const { result, image } = req.body;

    try {
      // Ensure reports folder exists
      const reportsDir = path.join(__dirname, "reports");
      await fsPromises.mkdir(reportsDir, { recursive: true });

      // File setup
      const filename = `plant_analysis_report_${Date.now()}.pdf`;
      const filePath = path.join(reportsDir, filename);
      const writestream = fs.createWriteStream(filePath);

      const doc = new PDFDocument({ margin: 50 });
      doc.pipe(writestream);

      // Clean + Split text
      const cleanText = result.replace(/\r/g, "").trim();

      const parts = cleanText.split(
        /Species Identification:|Plant Health:|Care Recommendations:|Characteristics:/,
      );

      const species = parts[1]?.trim();
      const health = parts[2]?.trim();
      const care = parts[3]?.trim();
      const characteristics = parts[4]?.trim();

      // Title
      doc.fontSize(20).text("Plant Analysis Report", { align: "center" });

      doc.moveDown();

      //  Date
      doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);

      doc.moveDown();

      // Image (optional)
      if (image) {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        doc.image(buffer, {
          fit: [400, 250],
          align: "center",
        });

        doc.moveDown();
      }

      function addSection(title, content) {
        if (!content) return;

        doc.moveDown();

        doc.fontSize(14).text(title, { underline: true });

        doc.moveDown(0.5);

        doc.fontSize(12).text(content, {
          lineGap: 4,
        });
      }

      addSection("Species Identification", species);
      addSection("Plant Health", health);
      addSection("Care Recommendations", care);
      addSection("Characteristics", characteristics);

      doc.end();

      // Wait for file creation
      await new Promise((resolve, reject) => {
        writestream.on("finish", resolve);
        writestream.on("error", reject);
      });

      // Send file
      res.download(filePath, (err) => {
        if (err) {
          res.status(500).json({ error: "Error downloading the PDF report" });
        }
        fsPromises.unlink(filePath);
      });
    } catch (error) {
      console.error("Error generating PDF report:", error);
      res.status(500).json({
        error: "An error occurred while generating the PDF report",
      });
    }
  },
);

app.listen(4000, () =>
  console.log("The app is running on http://localhost:4000"),
);
