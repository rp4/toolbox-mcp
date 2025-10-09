# Needle Finder Tool Guide

## When to Use Needle Finder

Use the **needle_finder** tool when you need to:
- **Detect anomalies** in tabular data (CSV, Excel, databases)
- **Find outliers** that don't match expected patterns
- **Identify data quality issues** (duplicates, missing values, format errors)
- **Flag suspicious transactions** or unusual values
- **Audit data integrity** across datasets

## Do NOT use needle_finder for:
- Process visualization (use swimlanes)
- Hierarchical relationships (use auditverse)
- Document linking (use tickntie)
- Scheduling (use scheduler)

## Input Structure

The needle_finder tool requires two components:

### 1. Data (Required)
Array of data rows as key-value objects:
```json
{
  "data": [
    {"id": 1, "amount": 100, "date": "2024-01-01", "status": "valid"},
    {"id": 2, "amount": 999999, "date": "2024-01-02", "status": "valid"},
    ...
  ]
}
```

**Limits:**
- Min: 1 row
- Max: 10,000 rows

### 2. Findings (Required)
Array of detected anomalies with explanations:
```json
{
  "findings": [
    {
      "rowIndex": 1,
      "field": "amount",
      "value": 999999,
      "reason": "Amount exceeds typical range by 100x (expected: 50-500)",
      "severity": "high"
    }
  ]
}
```

**Severity levels:**
- `"high"`: Critical issues requiring immediate attention
- `"medium"`: Notable anomalies worth investigating
- `"low"`: Minor deviations or warnings

## Anomaly Detection Strategies

### 1. Statistical Outliers
Identify values outside expected ranges:
- **Z-score method**: Values > 3 standard deviations
- **IQR method**: Values outside 1.5 × IQR
- **Percentage deviation**: Values > 100% from mean

**Example:**
```
Field: revenue
Mean: $1,000
Std Dev: $200
Finding: Row 45 has $5,000 (2.5 std devs above mean) → severity: high
```

### 2. Pattern Violations
Detect values that break expected patterns:
- **Format errors**: Phone numbers missing digits, invalid emails
- **Business rule violations**: Negative inventory, future dates in history
- **Reference errors**: Foreign keys pointing to non-existent records

**Example:**
```
Field: email
Pattern: must contain @ and domain
Finding: Row 12 has "user.gmail.com" (missing @) → severity: high
```

### 3. Duplicates
Find identical or near-identical records:
- **Exact duplicates**: All fields match
- **Key duplicates**: Unique fields (ID, email) appear multiple times
- **Near duplicates**: Similar values with small variations

**Example:**
```
Field: customer_id
Finding: Rows 5, 8, 12 have duplicate customer_id "C-1234" → severity: medium
```

### 4. Missing or Null Values
Identify incomplete data:
- **Required fields**: Null where value expected
- **Unexpected nulls**: Fields that should always have data
- **Sparse records**: Many fields missing

**Example:**
```
Field: required_approval_date
Finding: Row 88 missing approval_date (required for status='approved') → severity: high
```

### 5. Time-based Anomalies
Detect temporal irregularities:
- **Future dates**: Dates in the future when past expected
- **Sequence breaks**: Missing sequential values
- **Timing violations**: Events out of order

**Example:**
```
Field: transaction_date
Finding: Row 99 has date "2025-12-31" (1 year in future) → severity: high
```

## Common Use Cases

### Example 1: Financial Audit
```
Data: Transaction log with amounts, dates, accounts
Findings:
- Row 156: Amount $0.00 (unusual for sales transactions) → medium
- Row 234: Date is Saturday (store closed) → high
- Row 567: Account number invalid format → high
```

### Example 2: Inventory Check
```
Data: Product inventory with SKU, quantity, warehouse
Findings:
- Row 45: Quantity -50 (negative inventory impossible) → high
- Row 89: SKU "ABC-" (incomplete code) → medium
- Row 134: Same SKU in 3 warehouses (unusual) → low
```

### Example 3: User Data Quality
```
Data: User records with email, phone, registration date
Findings:
- Row 23: Email "test@test.com" (test account in production) → high
- Row 67: Phone has 9 digits (should be 10) → medium
- Row 102: Registration date "1900-01-01" (placeholder value) → medium
```

## Best Practices

1. **Prioritize findings**: Use severity to rank issues
2. **Explain reasoning**: Always provide clear "reason" field
3. **Include context**: Reference expected values/ranges
4. **Be specific**: Point to exact field and row
5. **Limit results**: Don't flag every minor deviation (max 1,000 findings)

## Analysis Workflow

When user uploads data:
1. **Understand the data**: Identify column types, ranges, patterns
2. **Determine expected behavior**: What's normal for this dataset?
3. **Apply detection methods**: Statistical, pattern, business rules
4. **Calculate severity**: Based on impact and deviation magnitude
5. **Explain findings**: Why is this anomalous? What's the expected value?

## Output Format

Return both data and findings:
```json
{
  "data": [...original rows...],
  "findings": [
    {
      "rowIndex": 42,
      "field": "price",
      "value": -100,
      "reason": "Negative price (expected: positive number)",
      "severity": "high"
    }
  ]
}
```

## Limits
- Max data rows: 10,000
- Max findings: 1,000
- Max reason length: 1,000 characters
