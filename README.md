# DCB_PAD_LivingMeta

Drug-Coated Balloons in Peripheral Artery Disease: Living Meta-Analysis

_Status: Shipped (portfolio registry)._

## Tests

Deployment-integrity smoke test (no dependencies):

```
node tests/smoke.test.js
```

Verifies entry-point HTML files are BOM-free, `<script>` tags balance, every
referenced local asset exists, all shipped JS parses, and no template
placeholders ship.
