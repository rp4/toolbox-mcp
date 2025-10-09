# Swimlanes Tool Guide

## When to Use Swimlanes

Use the **swimlanes** tool when you need to visualize:
- **Process flows** with multiple participants or departments
- **Sequential workflows** with decision points
- **Cross-functional processes** showing handoffs between teams
- **System interactions** showing data flow between components

## Do NOT use swimlanes for:
- Simple linear sequences (use text list instead)
- Hierarchical relationships (use auditverse 3D graph)
- Data anomalies (use needle_finder)
- Document linking (use tickntie)

## Input Structure

The swimlanes tool requires three main components:

### 1. Lanes (Required)
Lanes represent participants, departments, systems, or roles:
```json
{
  "id": "unique_id",
  "title": "Department/Actor Name"
}
```

**Best practices:**
- Use 2-6 lanes for clarity (max 100)
- Order lanes by hierarchy or workflow sequence
- Use clear, concise titles (e.g., "Customer", "Sales Team", "System")

### 2. Nodes (Required)
Nodes represent activities, steps, or events:
```json
{
  "id": "unique_id",
  "laneId": "which_lane_this_belongs_to",
  "label": "Activity Description"
}
```

**Best practices:**
- Use action verbs (e.g., "Submit Request", "Approve", "Process Payment")
- Keep labels concise (max 500 chars)
- Distribute nodes across lanes to show responsibility

### 3. Edges (Required)
Edges show the flow between nodes:
```json
{
  "from": "node_id",
  "to": "node_id",
  "label": "Condition/Description (optional)"
}
```

**Best practices:**
- Create clear flow direction (avoid circular dependencies)
- Use edge labels for decision points ("If approved", "On error")
- Minimize crossing edges for readability

## Common Use Cases

### Example 1: Approval Workflow
```
Lanes: [Employee, Manager, HR, Finance]
Flow: Submit Request → Manager Reviews → Approves/Rejects → HR Processes
```

### Example 2: E-commerce Order Flow
```
Lanes: [Customer, Website, Warehouse, Shipping]
Flow: Place Order → Validate → Pick Items → Pack → Ship → Deliver
```

### Example 3: Software Deployment Pipeline
```
Lanes: [Developer, CI/CD, QA, Production]
Flow: Commit Code → Build → Test → Deploy → Monitor
```

## Tips for Better Diagrams

1. **Start with lanes**: Identify all actors/systems first
2. **Map the happy path**: Create the main flow first
3. **Add decision points**: Use edge labels for conditions
4. **Show error handling**: Include alternate paths for failures
5. **Keep it simple**: Break complex processes into multiple diagrams

## Limits
- Max lanes: 100
- Max nodes: 1,000
- Max edges: 2,000
