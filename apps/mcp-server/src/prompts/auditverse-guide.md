# AuditVerse Tool Guide

## When to Use AuditVerse

Use the **auditverse** tool when you need to visualize:
- **Hierarchical relationships** (org charts, system architectures)
- **Network connections** (dependencies, interactions, flows)
- **Risk landscapes** (risk factors and their relationships)
- **Knowledge graphs** (concepts and their connections)
- **Complex systems** where 3D spatial layout adds clarity

## DO NOT use auditverse for:
- Linear processes (use swimlanes)
- Data anomaly detection (use needle_finder)
- Document linking (use tickntie)
- Time-based scheduling (use scheduler)

## Input Structure

The auditverse tool requires two main components:

### 1. Nodes (Required)
Array of entities in the graph:
```json
{
  "nodes": [
    {
      "id": "node_001",
      "label": "CEO",
      "type": "entity",
      "metadata": {
        "department": "Executive",
        "level": "C-Suite"
      }
    }
  ]
}
```

**Node types:**
- `"entity"` - Organizations, people, systems (default)
- `"risk"` - Risk factors, threats, vulnerabilities
- `"control"` - Controls, safeguards, mitigations

**Metadata** (optional):
- Add any custom properties
- Used for filtering, coloring, sizing
- Examples: department, priority, status, owner

**Limits:**
- Min: 1 node
- Max: 5,000 nodes

### 2. Edges (Required)
Array of connections between nodes:
```json
{
  "edges": [
    {
      "from": "node_001",
      "to": "node_002",
      "label": "reports to"
    }
  ]
}
```

**Edge properties:**
- `from`: Source node ID
- `to`: Target node ID
- `label`: Relationship description (optional)

**Limits:**
- Max: 10,000 edges

## Visualization Features

The 3D visualization provides:
- **Interactive navigation**: Rotate, zoom, pan
- **Node sizing**: Based on importance/connections
- **Color coding**: By node type or metadata
- **Force-directed layout**: Automatically positions nodes
- **Hover details**: Shows node metadata
- **Click to focus**: Highlights connected nodes

## Common Use Cases

### Example 1: Organizational Hierarchy
```json
{
  "nodes": [
    {"id": "ceo", "label": "CEO", "type": "entity"},
    {"id": "cfo", "label": "CFO", "type": "entity"},
    {"id": "cto", "label": "CTO", "type": "entity"},
    {"id": "eng_team", "label": "Engineering", "type": "entity"}
  ],
  "edges": [
    {"from": "ceo", "to": "cfo", "label": "manages"},
    {"from": "ceo", "to": "cto", "label": "manages"},
    {"from": "cto", "to": "eng_team", "label": "leads"}
  ]
}
```

### Example 2: Risk and Control Mapping
```json
{
  "nodes": [
    {"id": "r1", "label": "Data Breach", "type": "risk"},
    {"id": "r2", "label": "System Downtime", "type": "risk"},
    {"id": "c1", "label": "Encryption", "type": "control"},
    {"id": "c2", "label": "Backup System", "type": "control"},
    {"id": "a1", "label": "Customer Data", "type": "entity"}
  ],
  "edges": [
    {"from": "r1", "to": "a1", "label": "threatens"},
    {"from": "c1", "to": "r1", "label": "mitigates"},
    {"from": "r2", "to": "a1", "label": "impacts"},
    {"from": "c2", "to": "r2", "label": "prevents"}
  ]
}
```

### Example 3: System Architecture
```json
{
  "nodes": [
    {"id": "web", "label": "Web App", "type": "entity"},
    {"id": "api", "label": "API Server", "type": "entity"},
    {"id": "db", "label": "Database", "type": "entity"},
    {"id": "cache", "label": "Redis Cache", "type": "entity"}
  ],
  "edges": [
    {"from": "web", "to": "api", "label": "HTTP requests"},
    {"from": "api", "to": "db", "label": "queries"},
    {"from": "api", "to": "cache", "label": "caches data"}
  ]
}
```

### Example 4: Knowledge Graph
```json
{
  "nodes": [
    {"id": "audit", "label": "Financial Audit", "type": "entity"},
    {"id": "gaap", "label": "GAAP Standards", "type": "entity"},
    {"id": "internal", "label": "Internal Controls", "type": "entity"},
    {"id": "sox", "label": "SOX Compliance", "type": "entity"}
  ],
  "edges": [
    {"from": "audit", "to": "gaap", "label": "follows"},
    {"from": "audit", "to": "internal", "label": "evaluates"},
    {"from": "sox", "to": "internal", "label": "requires"},
    {"from": "sox", "to": "audit", "label": "mandates"}
  ]
}
```

## Best Practices

### 1. Meaningful Node Labels
```json
// Good: Clear, descriptive
{"id": "eng_lead", "label": "Engineering Team Lead"}

// Bad: Vague, unclear
{"id": "1", "label": "Person"}
```

### 2. Use Node Types Effectively
Group related nodes by type for color coding:
- **Entities**: People, systems, departments
- **Risks**: Threats, vulnerabilities
- **Controls**: Safeguards, policies, procedures

### 3. Add Rich Metadata
```json
{
  "id": "server_1",
  "label": "Production API Server",
  "type": "entity",
  "metadata": {
    "environment": "production",
    "criticality": "high",
    "owner": "Platform Team",
    "location": "US-East-1"
  }
}
```

### 4. Descriptive Edge Labels
```json
// Good: Explains relationship
{"from": "app", "to": "db", "label": "writes audit logs to"}

// OK: Generic but clear
{"from": "app", "to": "db", "label": "connects to"}

// Bad: No context
{"from": "app", "to": "db", "label": "uses"}
```

### 5. Optimize Graph Size
For large datasets:
- Focus on key relationships
- Group similar nodes
- Use hierarchical levels
- Consider multiple smaller graphs instead of one massive graph

## Graph Analysis Insights

The 3D visualization helps identify:

### Centrality
Nodes with many connections are central/important:
```
CEO has 10 edges → High centrality → Key decision maker
```

### Clustering
Groups of interconnected nodes:
```
Engineering team nodes cluster together → Org structure
```

### Bottlenecks
Single points of failure:
```
All systems connect through single API → Bottleneck risk
```

### Paths
Connection chains:
```
Risk → Asset → Control → Compliance
(Shows how controls address compliance requirements)
```

## Metadata-Driven Features

Use metadata for:

**Filtering:**
```json
{"metadata": {"status": "active"}}  // Show only active items
```

**Sizing:**
```json
{"metadata": {"importance": 10}}  // Larger nodes for higher importance
```

**Coloring:**
```json
{"metadata": {"department": "Finance"}}  // Color by department
```

**Tooltips:**
All metadata appears on hover for context.

## Layout Strategies

The 3D force-directed layout automatically:
- **Separates clusters**: Groups form naturally
- **Shows hierarchy**: Parent-child relationships emerge
- **Highlights hubs**: Highly connected nodes move to center
- **Reduces clutter**: Optimizes node spacing

## Quality Checklist

Before submitting auditverse data:
- [ ] All edge `from`/`to` IDs reference existing nodes
- [ ] Node labels are clear and descriptive
- [ ] Node types are appropriate (entity/risk/control)
- [ ] Metadata adds meaningful context
- [ ] Graph size is manageable (<1000 nodes for best performance)
- [ ] No orphaned nodes (nodes with zero edges, unless intentional)
- [ ] Edge labels explain relationships

## Output Format

The UI will display:
- **3D interactive scene** with rotatable camera
- **Node details** on hover/click
- **Legend** showing node type colors
- **Controls** for zoom, rotation, reset view
- **Export** as image or data file

## Performance Considerations

| Graph Size | Performance | Recommendation |
|------------|-------------|----------------|
| < 100 nodes | Excellent | Ideal size |
| 100-500 nodes | Good | Works well |
| 500-1000 nodes | Fair | Consider simplification |
| > 1000 nodes | Slow | Break into multiple graphs |

## Limits
- Max nodes: 5,000
- Max edges: 10,000
- Max label length: 500 characters
- Max metadata keys: Unlimited (reasonable use)
