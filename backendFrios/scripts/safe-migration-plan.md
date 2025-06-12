# Plan de Migración Segura - Disponibilidad Técnicos

## 🎯 Objetivo
Convertir campo `disponibilidad` de String libre a ENUM sin romper nada.

## 📋 Plan paso a paso:

### Paso 1: Backup (CRÍTICO)
```bash
# Hacer backup de la base de datos ANTES de cualquier cambio
pg_dump -h localhost -U tu_usuario -d tu_database > backup_antes_enum.sql
```

### Paso 2: Verificar datos actuales
```bash
node scripts/verify-database-data.js
```
- Anotar todos los valores de disponibilidad que existen
- Confirmar que solo hay: "Disponible", "DISPONIBLE"

### Paso 3: Normalizar datos ANTES del ENUM
```bash
node scripts/fix-technician-availability-enum.js
```
- Convierte todos a "DISPONIBLE"
- NO aplica el ENUM todavía

### Paso 4: Aplicar migración gradual
```bash
# Primera migración: solo crear el ENUM
npx prisma db push --accept-data-loss
```

### Paso 5: Verificar que todo funciona
```bash
node scripts/verify-database-data.js
```

## 🚨 Si algo sale mal:
```bash
# Restaurar backup
psql -h localhost -U tu_usuario -d tu_database < backup_antes_enum.sql
```

## ✅ Señales de éxito:
- [ ] Todos los técnicos tienen disponibilidad = "DISPONIBLE"
- [ ] Frontend sigue funcionando
- [ ] Asignaciones siguen funcionando
- [ ] No hay errores 500