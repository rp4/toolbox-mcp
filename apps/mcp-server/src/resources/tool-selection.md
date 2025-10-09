# Tool Selection Guide

## Quick Decision Tree

Use this decision tree to select the right tool for your task:

### 1. Is it **tabular data** with potential quality issues?
→ Use **needle_finder**

**Examples:**
- Transaction logs with anomalies
- Customer data with inconsistencies
- Financial records needing validation
- Inventory lists with errors

---

### 2. Is it a **process or workflow** with multiple participants?
→ Use **swimlanes**

**Examples:**
- Approval workflows across departments
- Customer journey maps
- System interaction diagrams
- Cross-functional processes

---

### 3. Need to **link documents to spreadsheet values**?
→ Use **tickntie**

**Examples:**
- Financial statements with supporting invoices
- Budget justifications with vendor quotes
- Audit workpapers with evidence
- Compliance reports with source documents

---

### 4. Need to **schedule people or resources** over time?
→ Use **scheduler**

**Examples:**
- Employee shift schedules
- Meeting room bookings
- On-call rotations
- Project resource allocation

---

### 5. Is it **hierarchical or network data** with relationships?
→ Use **auditverse**

**Examples:**
- Organizational charts
- System architecture diagrams
- Risk and control mappings
- Knowledge graphs

---

## Tool Comparison Matrix

| Feature | Swimlanes | Needle Finder | Tick'n'Tie | Scheduler | AuditVerse |
|---------|-----------|---------------|------------|-----------|------------|
| **Primary Use** | Process flows | Data quality | Documentation | Time allocation | Relationships |
| **Visualization** | 2D diagram | Table | Split-pane | Calendar/table | 3D graph |
| **Input Type** | Nodes + edges | Tabular data | Spreadsheet + docs | People + slots | Nodes + edges |
| **Best For** | Workflows | Anomaly detection | Audit trails | Resource planning | Complex systems |
| **Max Items** | 1K nodes | 10K rows | 5K links | 5K slots | 5K nodes |

---

## Common Scenarios

### Scenario: Financial Audit

**Data quality check:**
→ Use **needle_finder** to detect anomalies in transaction data

**Process documentation:**
→ Use **swimlanes** to show approval workflow

**Evidence linking:**
→ Use **tickntie** to link financial statement cells to supporting documents

**Audit team schedule:**
→ Use **scheduler** to plan audit fieldwork

**Organization structure:**
→ Use **auditverse** to visualize department relationships

---

### Scenario: IT Project Management

**System architecture:**
→ Use **auditverse** to map service dependencies

**Deployment process:**
→ Use **swimlanes** to show CI/CD pipeline

**On-call schedule:**
→ Use **scheduler** to create rotation calendar

**Log analysis:**
→ Use **needle_finder** to find errors in server logs

---

### Scenario: Compliance Reporting

**Regulatory report:**
→ Use **tickntie** to link report figures to source data

**Risk assessment:**
→ Use **auditverse** to map risks and controls

**Data validation:**
→ Use **needle_finder** to verify data completeness

**Audit schedule:**
→ Use **scheduler** to plan compliance activities

---

## When to Use Multiple Tools

Many tasks benefit from combining tools:

**Example: Complete Financial Audit**

1. **needle_finder** - Detect unusual transactions
2. **swimlanes** - Document audit methodology workflow
3. **tickntie** - Link findings to evidence
4. **scheduler** - Schedule audit fieldwork
5. **auditverse** - Map organizational structure

---

## Tool Limitations

### What these tools CANNOT do:

**All tools:**
- Real-time collaboration (single-user visualizations)
- Data storage (session-based only)
- External API integration

**Swimlanes:**
- Not for hierarchical org charts (use auditverse)
- Not for scheduling (use scheduler)

**Needle Finder:**
- Not for process mapping (use swimlanes)
- Not for relationship visualization (use auditverse)

**Tick'n'Tie:**
- Not for data analysis (use needle_finder)
- Not for process flows (use swimlanes)

**Scheduler:**
- Not for process workflows (use swimlanes)
- Not for data validation (use needle_finder)

**AuditVerse:**
- Not for linear processes (use swimlanes)
- Not for time-based allocation (use scheduler)

---

## Privacy and Data Handling

All tools:
- **Client-side processing** - Data processed in your browser
- **No persistence** - Data not stored on servers
- **No external calls** - Data stays in your session
- **Privacy-first** - No analytics or tracking

---

## Getting Help

For detailed guidance on each tool:
- Request the appropriate `_guide` prompt
- Check tool descriptions in MCP tool list
- Reference example payloads in documentation
