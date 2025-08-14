// ExportWord.jsx
import React, { useState } from "react";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";

const ExportWord = () => {
  // ✅ Dữ liệu đầu vào

  const [textFont, setTextFont] = useState("");
  const [strData, setStrData] = useState("");

  const parseFieldsWithFormat = () => {
    const lines = strData.split("\n");
    const result = [];

    let description = null;
    let jsonFormat = null;
    let type = null;
    let hasNotNull = false; // Thêm để theo dõi @NotNull

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Bắt @Schema
      const schemaMatch = line.match(
        /@Schema\s*\(\s*description\s*=\s*"(.+?)"\s*\)/
      );
      if (schemaMatch) {
        description = schemaMatch[1];
      }

      // Bắt @JsonFormat
      const jsonFormatMatch = line.match(
        /@JsonFormat\s*\(\s*pattern\s*=\s*(Const\.\w+)\s*\)/
      );
      if (jsonFormatMatch) {
        jsonFormat = jsonFormatMatch[1];
      }

      // Bắt @NotNull
      if (line.includes("@NotNull")) {
        hasNotNull = true;
      }

      // Bắt dòng private
      const fieldMatch = line.match(/private\s+(\w+)\s+(\w+);/);
      if (fieldMatch) {
        const dataType = fieldMatch[1];
        const name = fieldMatch[2];

        let desWithFormat = description || "";

        // Nếu có định dạng JSON format
        if (jsonFormat === "Const.DATE_FORMAT2") {
          desWithFormat += " (dd/MM/yyyy)";
        } else if (jsonFormat === "Const.DATE_TIME_FORMAT2") {
          desWithFormat += " (dd/MM/yyyy HH:mm:ss)";
        }

        // Thêm field vào kết quả
        result.push({
          name: name,
          des: desWithFormat,
          type: dataType,
          notNull: hasNotNull ? "R" : "O",
        });

        // Reset lại
        description = null;
        jsonFormat = null;
        type = null;
        hasNotNull = false;
      }
    }

    return result;
  };

  const generateWordDocument = async () => {
    var data = parseFieldsWithFormat();
    // Tiêu đề
    const title = new Paragraph({
      text: "Danh sách trường dữ liệu",
      heading: "Heading1",
      alignment: AlignmentType.CENTER,
    });

    // Header của bảng
    const tableHeaders = [
      "STT",
      "Tên trường",
      "Định dạng",
      "Length",
      "R/O",
      "Mô tả",
      "Note",
    ];

    // Tạo bảng
    const headerRow = new TableRow({
      children: tableHeaders.map(
        (header) =>
          new TableCell({
            children: [new Paragraph({ text: header, bold: true })],
          })
      ),
    });

    // Tạo data rows
    let stt = 1;
    const dataRows = [];

    for (const item of data) {
      dataRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(String(textFont + "." + stt))],
            }),
            new TableCell({ children: [new Paragraph(item.name)] }),
            new TableCell({ children: [new Paragraph(item.type || "")] }),
            new TableCell({ children: [new Paragraph("N/A")] }),
            new TableCell({ children: [new Paragraph(item.notNull)] }),
            new TableCell({ children: [new Paragraph(item.des)] }),
            new TableCell({ children: [new Paragraph("")] }),
          ],
        })
      );
      stt++;
    }

    // Tạo bảng
    const table = new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      rows: [headerRow, ...dataRows],
    });

    // Tạo Document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: {
                orientation: "portrait", // Hướng dọc
              },
            },
          },
          children: [title, table],
        },
      ],
    });

    // Generate & download file
    const blob = await Packer.toBlob(doc);
    saveAs(blob, "FieldList.docx");
  };

  const changeTextFont = (text) => {
    setTextFont(text);
  };

  const changeStrData = (text) => {
    setStrData(text);
  };

  return (
    <div>
      <div>
        <button onClick={() => generateWordDocument()}>
          📄 Xuất File Word
        </button>
      </div>

      <div>
        <input type="text" onChange={(e) => changeTextFont(e.target.value)} />
      </div>

      <div>
        <textarea
          type="text"
          onChange={(e) => changeStrData(e.target.value)}
          style={{ width: "50%", height: "1000px" }}
        />
      </div>
    </div>
  );
};

export default ExportWord;
