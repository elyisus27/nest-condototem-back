---

# 🧩 `componentes/action-definition.md`

```markdown id="dgqvt7"
# Action Definition

Define una acción ejecutable.

## Estructura

```json
{
  "type": "tap",
  "coordinates": { "x": 120, "y": 450 },
  "validation": "VISIT_LIST_VISIBLE",
  "strategy": "retry",
  "max_retries": 5,
  "timeout": 5000
}