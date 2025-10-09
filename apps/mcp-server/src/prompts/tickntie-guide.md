# Tick'n'Tie Tool Guide

## When to Use Tick'n'Tie

Use the **tickntie** tool when you need to:
- **Create audit trails** linking spreadsheet cells to supporting documents
- **Link financial data** to source documents (invoices, receipts, contracts)
- **Establish documentation** for regulatory compliance
- **Cross-reference** data points to their evidence
- **Build audit workpapers** with proper documentation

## Do NOT use tickntie for:
- Process visualization (use swimlanes)
- Data anomaly detection (use needle_finder)
- Scheduling (use scheduler)
- General relationships (use auditverse)

## Input Structure

The tickntie tool requires three components:

### 1. Workbook (Required)
Excel workbook data in SheetJS format:
```json
{
  "workbook": {
    "SheetNames": ["Sheet1", "Summary"],
    "Sheets": {
      "Sheet1": {
        "A1": {"v": "Revenue", "t": "s"},
        "B1": {"v": 125000, "t": "n"}
      }
    }
  }
}
```

**Note**: The workbook object is flexible and follows SheetJS conventions.

### 2. Links (Required)
Array linking cells to supporting documents:
```json
{
  "links": [
    {
      "cellRef": "Sheet1!B1",
      "documentId": "invoice_001",
      "pageNumber": 1,
      "note": "Q4 revenue from invoice #12345"
    }
  ]
}
```

**Cell reference format:**
- `"Sheet1!A1"` - Single cell
- `"Sheet1!A1:B5"` - Range (links to first cell)
- `"Summary!C10"` - Different sheet

**Limits:**
- Max links: 5,000

### 3. Documents (Required)
Array of supporting document metadata:
```json
{
  "documents": [
    {
      "id": "invoice_001",
      "name": "Invoice_12345.pdf",
      "dataUrl": "data:application/pdf;base64,..." // optional
    }
  ]
}
```

**Limits:**
- Max documents: 100

## Common Use Cases

### Example 1: Financial Audit
```
Spreadsheet: Annual financial statements
Documents: Invoices, bank statements, contracts
Links:
- Revenue cell → Sales invoices
- Expense cells → Purchase orders + receipts
- Asset values → Appraisal documents
```

### Example 2: Compliance Reporting
```
Spreadsheet: Regulatory report with calculated values
Documents: Source data exports, methodology documents
Links:
- Key metrics → Data extraction scripts
- Calculations → Methodology PDFs
- Assumptions → Meeting notes
```

### Example 3: Budget Justification
```
Spreadsheet: Department budget request
Documents: Vendor quotes, staffing plans, historical data
Links:
- Equipment costs → Vendor quotes
- Personnel costs → HR projections
- Overhead → Historical expense reports
```

## Creating Effective Links

### Link Components

**cellRef** (required):
- Must be valid Excel reference
- Format: `SheetName!CellAddress`
- Examples: `"Data!A1"`, `"Summary!D10"`, `"Q4!B2:B5"`

**documentId** (required):
- Unique identifier for the document
- Should match a document in the `documents` array
- Use descriptive IDs: `"invoice_12345"`, `"contract_vendor_abc"`

**pageNumber** (optional):
- Specific page in multi-page documents
- Useful for PDFs with many pages
- Example: Link to page 3 of a 50-page contract

**note** (optional):
- Explanation of why this link exists
- Max 1,000 characters
- Example: "Supporting documentation for Q4 revenue adjustment due to customer refund"

## Best Practices

### 1. Comprehensive Coverage
- Link all material values
- Document assumptions and calculations
- Include methodology references

### 2. Clear Documentation
- Use descriptive notes
- Reference specific page numbers
- Explain non-obvious connections

### 3. Organized Structure
- Group related links together
- Use consistent document naming
- Maintain document hierarchy

### 4. Audit-Ready Format
```json
{
  "cellRef": "Revenue!Q4_Total",
  "documentId": "sales_q4_summary",
  "pageNumber": 1,
  "note": "Quarterly sales summary aggregating all Q4 invoices (Oct-Dec 2024). Total validated against accounting system export."
}
```

## Document Types

### Financial Documents
- Invoices
- Receipts
- Bank statements
- Purchase orders
- Contracts

### Supporting Evidence
- Screenshots
- Email confirmations
- Meeting notes
- Calculations
- Methodology documents

### Regulatory Documents
- Compliance certificates
- Audit reports
- Policy documents
- Legal agreements

## Link Strategy by Cell Type

### Hard-Coded Values
Link to source documents that provide the original value:
```json
{
  "cellRef": "Data!A1",
  "documentId": "source_invoice",
  "note": "Original invoice amount"
}
```

### Calculated Values
Link to methodology or supporting calculations:
```json
{
  "cellRef": "Summary!B10",
  "documentId": "calculation_methodology",
  "pageNumber": 2,
  "note": "Depreciation calculation per GAAP guidelines"
}
```

### Aggregated Values
Link to detailed breakdowns:
```json
{
  "cellRef": "Summary!Total",
  "documentId": "detailed_breakdown",
  "note": "Sum of all department budgets (see breakdown tab)"
}
```

## Quality Checklist

Before submitting tick'n'tie data:
- [ ] All material cells have links
- [ ] All referenced documentIds exist in documents array
- [ ] Cell references use correct sheet names
- [ ] Page numbers are accurate for multi-page docs
- [ ] Notes explain non-obvious connections
- [ ] Document names are descriptive
- [ ] No orphaned links (references to missing cells)

## Output Format

The UI will display:
1. **Spreadsheet view** (using Univer)
2. **Linked cells highlighted**
3. **Document preview pane**
4. **Click cell → see linked documents**
5. **Download all as audit package**

## Limits
- Max links: 5,000
- Max documents: 100
- Max note length: 1,000 characters
- Max cell reference length: 50 characters
