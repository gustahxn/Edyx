package main

import (
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"
	"github.com/gin-gonic/gin"
	"github.com/jung-kurt/gofpdf"
)

type ExportRequest struct {
	Content string  `json:"content"`
	Title   string  `json:"title"`
	Margins Margins `json:"margins"`
}

type Margins struct {
	Top    float64 `json:"t"`
	Bottom float64 `json:"b"`
	Left   float64 `json:"l"`
	Right  float64 `json:"r"`
}

type TextChunk struct {
	Text       string
	Bold       bool
	Italic     bool
	Underline  bool
	Color      string
	Size       float64
	Font       string
	Highlight  bool
	LineHeight float64
}

type ParagraphStyle struct {
	TextAlign string
	Indent    float64
	LineHeight float64
}

func main() {
	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.POST("/export/docx", func(c *gin.Context) {
		var req ExportRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		fmt.Println("=== DOCX - HTML RECEBIDO ===")
		fmt.Println(req.Content)
		fmt.Println("=== FIM ===")

		wordHTML := convertToWordHTML(req.Content)

		fullHtml := fmt.Sprintf(`
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<style>
@page Section1 {
    size: 595.3pt 841.9pt;
    margin: %fcm %fcm %fcm %fcm;
}
div.Section1 { page: Section1; }
body { 
    font-family: Arial, sans-serif; 
    font-size: 12pt;
}
p { 
    margin: 0 0 12pt 0; 
    line-height: 1.5;
}
p[style*="text-align: center"] { text-align: center; }
p[style*="text-align: right"] { text-align: right; }
p[style*="text-align: left"] { text-align: left; }
.highlight { background-color: #ffe203; }
ul, ol { margin-left: 1.5em; }
</style>
</head>
<body>
<div class="Section1">
%s
</div>
</body>
</html>`, req.Margins.Top, req.Margins.Right, req.Margins.Bottom, req.Margins.Left, wordHTML)

		c.Header("Content-Type", "application/msword")
		c.Header("Content-Disposition", "attachment; filename=documento.doc")
		c.Data(http.StatusOK, "application/msword", []byte(fullHtml))
	})

	r.POST("/export/pdf", func(c *gin.Context) {
		var req ExportRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		fmt.Println("=== PDF - HTML RECEBIDO ===")
		fmt.Println(req.Content)
		fmt.Println("=== FIM ===")

		pdf := gofpdf.New("P", "mm", "A4", "")
		pdf.SetMargins(req.Margins.Left*10, req.Margins.Top*10, req.Margins.Right*10)
		pdf.SetAutoPageBreak(true, req.Margins.Bottom*10)
		pdf.AddPage()

		if err := renderHTMLToPDF(pdf, req.Content); err != nil {
			fmt.Println("ERRO:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.Header("Content-Type", "application/pdf")
		c.Header("Content-Disposition", "attachment; filename=documento.pdf")
		pdf.Output(c.Writer)
	})

	fmt.Println("🚀 Servidor rodando em http://localhost:8080")
	r.Run(":8080")
}

func convertToWordHTML(htmlContent string) string {
	content := htmlContent
	content = regexp.MustCompile(`<mark[^>]*>`).ReplaceAllString(content, `<span class="highlight">`)
	content = strings.ReplaceAll(content, "</mark>", "</span>")
	return content
}

func renderHTMLToPDF(pdf *gofpdf.Fpdf, htmlContent string) error {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlContent))
	if err != nil {
		return err
	}

	doc.Find("p, ul, ol").Each(func(i int, s *goquery.Selection) {
		tagName := goquery.NodeName(s)
		switch tagName {
		case "p":
			renderParagraph(pdf, s)
		case "ul":
			renderList(pdf, s, false)
		case "ol":
			renderList(pdf, s, true)
		}
	})

	return nil
}

func renderParagraph(pdf *gofpdf.Fpdf, s *goquery.Selection) {
	chunks := extractTextChunks(s)
	
	if len(chunks) == 0 {
		pdf.Ln(5)
		return
	}

	// Extrai estilos do parágrafo
	pStyle := extractParagraphStyle(s)
	
	// Aplica indent (padding-left)
	startX := pdf.GetLeftMargin()
	if pStyle.Indent > 0 {
		pdf.SetLeftMargin(startX + pStyle.Indent)
		pdf.SetX(startX + pStyle.Indent)
	}

	// Define line-height
	lineHeight := 7.0
	if pStyle.LineHeight > 0 {
		lineHeight = pStyle.LineHeight * 7.0
		fmt.Println("📏 Entrelinhas do parágrafo:", pStyle.LineHeight, "->", lineHeight, "mm")
	}

	// Calcula largura total para alinhamento
	if pStyle.TextAlign == "center" || pStyle.TextAlign == "right" {
		totalWidth := 0.0
		for _, chunk := range chunks {
			applyFontForMeasure(pdf, chunk)
			totalWidth += pdf.GetStringWidth(chunk.Text)
		}

		pageWidth, _ := pdf.GetPageSize()
		rightMargin := pdf.GetRightMargin()
		leftMargin := pdf.GetLeftMargin()
		availableWidth := pageWidth - leftMargin - rightMargin

		if pStyle.TextAlign == "center" {
			offset := (availableWidth - totalWidth) / 2
			pdf.SetX(leftMargin + offset)
		} else if pStyle.TextAlign == "right" {
			offset := availableWidth - totalWidth
			pdf.SetX(leftMargin + offset)
		}
	}

	// Renderiza chunks
	for _, chunk := range chunks {
		renderChunk(pdf, chunk, lineHeight)
	}

	pdf.Ln(lineHeight)

	// Restaura margem
	if pStyle.Indent > 0 {
		pdf.SetLeftMargin(startX)
	}
}

func extractParagraphStyle(s *goquery.Selection) ParagraphStyle {
	style := ParagraphStyle{TextAlign: "left", Indent: 0, LineHeight: 1.5}

	if styleAttr, exists := s.Attr("style"); exists {
		fmt.Println("🎨 Estilo do parágrafo:", styleAttr)

		// Text-align
		if match := regexp.MustCompile(`text-align:\s*(\w+)`).FindStringSubmatch(styleAttr); len(match) > 1 {
			style.TextAlign = match[1]
			fmt.Println("✓ Alinhamento:", style.TextAlign)
		}

		// Padding-left (indent)
		if match := regexp.MustCompile(`padding-left:\s*(\d+)px`).FindStringSubmatch(styleAttr); len(match) > 1 {
			if padding, err := strconv.ParseFloat(match[1], 64); err == nil {
				style.Indent = padding * 0.35 // Converte px para mm
				fmt.Println("✓ Indent:", padding, "px ->", style.Indent, "mm")
			}
		}

		// Line-height
		if match := regexp.MustCompile(`line-height:\s*(\d+\.?\d*)`).FindStringSubmatch(styleAttr); len(match) > 1 {
			if lh, err := strconv.ParseFloat(match[1], 64); err == nil {
				style.LineHeight = lh
			}
		}
	}

	return style
}

func applyFontForMeasure(pdf *gofpdf.Fpdf, chunk TextChunk) {
	fontStyle := ""
	if chunk.Bold {
		fontStyle += "B"
	}
	if chunk.Italic {
		fontStyle += "I"
	}
	size := chunk.Size
	if size == 0 {
		size = 12
	}
	pdf.SetFont(chunk.Font, fontStyle, size)
}

func renderList(pdf *gofpdf.Fpdf, s *goquery.Selection, ordered bool) {
	itemNum := 1
	
	s.Find("li").Each(func(i int, li *goquery.Selection) {
		marker := "• "
		if ordered {
			marker = fmt.Sprintf("%d. ", itemNum)
			itemNum++
		}

		pdf.SetFont("Arial", "", 12)
		pdf.SetTextColor(0, 0, 0)
		
		x := pdf.GetX()
		pdf.SetX(x + 5)
		pdf.Write(7, marker)
		
		chunks := extractTextChunks(li)
		for _, chunk := range chunks {
			renderChunk(pdf, chunk, 7)
		}
		
		pdf.Ln(5)
		pdf.SetX(x)
	})
	
	pdf.Ln(3)
}

func extractTextChunks(s *goquery.Selection) []TextChunk {
	var chunks []TextChunk
	
	var extract func(*goquery.Selection, TextChunk)
	extract = func(sel *goquery.Selection, baseStyle TextChunk) {
		sel.Contents().Each(func(i int, node *goquery.Selection) {
			if goquery.NodeName(node) == "#text" {
				text := node.Text()
				if strings.TrimSpace(text) != "" {
					chunks = append(chunks, TextChunk{
						Text:       text,
						Bold:       baseStyle.Bold,
						Italic:     baseStyle.Italic,
						Underline:  baseStyle.Underline,
						Color:      baseStyle.Color,
						Size:       baseStyle.Size,
						Font:       baseStyle.Font,
						Highlight:  baseStyle.Highlight,
						LineHeight: baseStyle.LineHeight,
					})
				}
			} else {
				newStyle := baseStyle
				tagName := goquery.NodeName(node)

				switch tagName {
				case "strong", "b":
					newStyle.Bold = true
				case "em", "i":
					newStyle.Italic = true
				case "u":
					newStyle.Underline = true
				case "mark":
					newStyle.Highlight = true
				case "span":
					if style, exists := node.Attr("style"); exists {
						newStyle = parseStyle(style, newStyle)
					}
				}

				extract(node, newStyle)
			}
		})
	}

	defaultStyle := TextChunk{
		Font:  "Arial",
		Size:  12,
		Color: "#000000",
	}

	if style, exists := s.Attr("style"); exists {
		defaultStyle = parseStyle(style, defaultStyle)
	}

	extract(s, defaultStyle)
	return chunks
}

func parseStyle(styleStr string, base TextChunk) TextChunk {
	style := base

	fmt.Println("🔍 Parseando estilo:", styleStr)

	// Font size - suporta várias unidades
	if match := regexp.MustCompile(`font-size:\s*(\d+\.?\d*)pt`).FindStringSubmatch(styleStr); len(match) > 1 {
		if size, err := strconv.ParseFloat(match[1], 64); err == nil {
			style.Size = size
			fmt.Println("✓ Tamanho detectado:", size, "pt")
		}
	} else if match := regexp.MustCompile(`font-size:\s*(\d+\.?\d*)px`).FindStringSubmatch(styleStr); len(match) > 1 {
		if size, err := strconv.ParseFloat(match[1], 64); err == nil {
			style.Size = size * 0.75 // Converte px para pt
			fmt.Println("✓ Tamanho detectado:", size, "px ->", style.Size, "pt")
		}
	}

	// Font family
	if match := regexp.MustCompile(`font-family:\s*["']?([^;"']+)`).FindStringSubmatch(styleStr); len(match) > 1 {
		font := strings.TrimSpace(strings.Split(match[1], ",")[0])
		font = strings.Trim(font, "\"'")
		if strings.Contains(strings.ToLower(font), "times") {
			style.Font = "Times"
		} else {
			style.Font = "Arial"
		}
		fmt.Println("✓ Fonte detectada:", style.Font)
	}

	// Color - suporta rgb() e hex
	if match := regexp.MustCompile(`color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)`).FindStringSubmatch(styleStr); len(match) > 3 {
		r, _ := strconv.Atoi(match[1])
		g, _ := strconv.Atoi(match[2])
		b, _ := strconv.Atoi(match[3])
		style.Color = fmt.Sprintf("#%02x%02x%02x", r, g, b)
		fmt.Println("✓ Cor detectada (rgb):", style.Color)
	} else if match := regexp.MustCompile(`color:\s*(#[0-9a-fA-F]{6})`).FindStringSubmatch(styleStr); len(match) > 1 {
		style.Color = match[1]
		fmt.Println("✓ Cor detectada (hex):", style.Color)
	}

	// Background (highlight)
	if strings.Contains(styleStr, "background-color") {
		style.Highlight = true
		fmt.Println("✓ Highlight detectado")
	}

	// Line height
	if match := regexp.MustCompile(`line-height:\s*(\d+\.?\d*)`).FindStringSubmatch(styleStr); len(match) > 1 {
		if lineHeight, err := strconv.ParseFloat(match[1], 64); err == nil {
			style.LineHeight = lineHeight
			fmt.Println("✓ Entrelinhas detectado:", lineHeight)
		}
	}

	return style
}

func renderChunk(pdf *gofpdf.Fpdf, chunk TextChunk, lineHeight float64) {
	fontStyle := ""
	if chunk.Bold {
		fontStyle += "B"
	}
	if chunk.Italic {
		fontStyle += "I"
	}
	if chunk.Underline {
		fontStyle += "U"
	}

	size := chunk.Size
	if size == 0 {
		size = 12
	}

	pdf.SetFont(chunk.Font, fontStyle, size)

	if chunk.Color != "" {
		r, g, b := hexToRGB(chunk.Color)
		pdf.SetTextColor(r, g, b)
	} else {
		pdf.SetTextColor(0, 0, 0)
	}

	if chunk.Highlight {
		pdf.SetFillColor(255, 226, 3)
		w := pdf.GetStringWidth(chunk.Text)
		x, y := pdf.GetXY()
		pdf.Rect(x, y, w, size*0.35, "F")
	}

	pdf.Write(lineHeight, chunk.Text)
}

func hexToRGB(hex string) (int, int, int) {
	hex = strings.TrimPrefix(hex, "#")
	if len(hex) != 6 {
		return 0, 0, 0
	}

	r, _ := strconv.ParseInt(hex[0:2], 16, 64)
	g, _ := strconv.ParseInt(hex[2:4], 16, 64)
	b, _ := strconv.ParseInt(hex[4:6], 16, 64)

	return int(r), int(g), int(b)
}