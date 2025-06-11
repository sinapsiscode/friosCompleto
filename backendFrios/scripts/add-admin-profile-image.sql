-- Migración para agregar campo profileImage a administradores
-- Ejecutar manualmente si prisma migrate no funciona

ALTER TABLE administradores ADD COLUMN IF NOT EXISTS "profileImage" TEXT;

-- Verificar que se agregó el campo
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'administradores' 
AND column_name = 'profileImage';