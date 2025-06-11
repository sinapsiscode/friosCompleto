const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function fixProfileImages() {
  console.log('🔧 === REPARANDO RUTAS DE IMÁGENES DE PERFIL ===');
  
  try {
    // 1. Obtener todos los técnicos con profileImage
    console.log('\n👨‍🔧 Procesando técnicos...');
    const tecnicos = await prisma.tecnico.findMany({
      where: {
        profileImage: {
          not: null,
          not: ""
        }
      }
    });
    
    console.log(`📊 Encontrados ${tecnicos.length} técnicos con imágenes`);
    
    for (const tecnico of tecnicos) {
      const currentImage = tecnico.profileImage;
      
      // Si ya tiene la ruta completa, saltar
      if (currentImage.includes('/')) {
        console.log(`✅ Técnico ${tecnico.id} ya tiene ruta completa: ${currentImage}`);
        continue;
      }
      
      // Buscar el archivo en las carpetas por fecha
      const uploadsDir = path.join(__dirname, '../uploads');
      const possiblePaths = [
        // Año y mes actual
        `tecnicos/avatars/2025/06/${currentImage}`,
        // Otros meses posibles
        `tecnicos/avatars/2025/05/${currentImage}`,
        `tecnicos/avatars/2025/01/${currentImage}`,
        // Sin estructura de fechas (por si acaso)
        `tecnicos/avatars/${currentImage}`
      ];
      
      let foundPath = null;
      
      for (const relativePath of possiblePaths) {
        const fullPath = path.join(uploadsDir, relativePath);
        if (fs.existsSync(fullPath)) {
          foundPath = relativePath;
          console.log(`🔍 Encontrado archivo para técnico ${tecnico.id}: ${relativePath}`);
          break;
        }
      }
      
      if (foundPath) {
        // Actualizar en la base de datos
        await prisma.tecnico.update({
          where: { id: tecnico.id },
          data: { profileImage: foundPath }
        });
        console.log(`✅ Actualizado técnico ${tecnico.id}: ${currentImage} → ${foundPath}`);
      } else {
        console.log(`❌ No se encontró archivo para técnico ${tecnico.id}: ${currentImage}`);
      }
    }
    
    // 2. Obtener todos los clientes con profileImage
    console.log('\n👥 Procesando clientes...');
    const clientes = await prisma.cliente.findMany({
      where: {
        profileImage: {
          not: null,
          not: ""
        }
      }
    });
    
    console.log(`📊 Encontrados ${clientes.length} clientes con imágenes`);
    
    for (const cliente of clientes) {
      const currentImage = cliente.profileImage;
      
      // Si ya tiene la ruta completa, saltar
      if (currentImage.includes('/')) {
        console.log(`✅ Cliente ${cliente.id} ya tiene ruta completa: ${currentImage}`);
        continue;
      }
      
      // Buscar el archivo en las carpetas por fecha
      const uploadsDir = path.join(__dirname, '../uploads');
      const possiblePaths = [
        // Año y mes actual
        `clientes/avatars/2025/06/${currentImage}`,
        // Otros meses posibles
        `clientes/avatars/2025/05/${currentImage}`,
        `clientes/avatars/2025/01/${currentImage}`,
        // Sin estructura de fechas (por si acaso)
        `clientes/avatars/${currentImage}`
      ];
      
      let foundPath = null;
      
      for (const relativePath of possiblePaths) {
        const fullPath = path.join(uploadsDir, relativePath);
        if (fs.existsSync(fullPath)) {
          foundPath = relativePath;
          console.log(`🔍 Encontrado archivo para cliente ${cliente.id}: ${relativePath}`);
          break;
        }
      }
      
      if (foundPath) {
        // Actualizar en la base de datos
        await prisma.cliente.update({
          where: { id: cliente.id },
          data: { profileImage: foundPath }
        });
        console.log(`✅ Actualizado cliente ${cliente.id}: ${currentImage} → ${foundPath}`);
      } else {
        console.log(`❌ No se encontró archivo para cliente ${cliente.id}: ${currentImage}`);
      }
    }
    
    // 3. Procesar administradores (si los hay)
    console.log('\n👨‍💼 Procesando administradores...');
    const administradores = await prisma.administrador.findMany({
      where: {
        profileImage: {
          not: null,
          not: ""
        }
      }
    });
    
    console.log(`📊 Encontrados ${administradores.length} administradores con imágenes`);
    
    for (const admin of administradores) {
      const currentImage = admin.profileImage;
      
      // Si ya tiene la ruta completa, saltar
      if (currentImage.includes('/')) {
        console.log(`✅ Admin ${admin.id} ya tiene ruta completa: ${currentImage}`);
        continue;
      }
      
      // Buscar el archivo en las carpetas por fecha
      const uploadsDir = path.join(__dirname, '../uploads');
      const possiblePaths = [
        // Año y mes actual
        `administradores/avatars/2025/06/${currentImage}`,
        // Otros meses posibles
        `administradores/avatars/2025/05/${currentImage}`,
        `administradores/avatars/2025/01/${currentImage}`,
        // Sin estructura de fechas (por si acaso)
        `administradores/avatars/${currentImage}`
      ];
      
      let foundPath = null;
      
      for (const relativePath of possiblePaths) {
        const fullPath = path.join(uploadsDir, relativePath);
        if (fs.existsSync(fullPath)) {
          foundPath = relativePath;
          console.log(`🔍 Encontrado archivo para admin ${admin.id}: ${relativePath}`);
          break;
        }
      }
      
      if (foundPath) {
        // Actualizar en la base de datos
        await prisma.administrador.update({
          where: { id: admin.id },
          data: { profileImage: foundPath }
        });
        console.log(`✅ Actualizado admin ${admin.id}: ${currentImage} → ${foundPath}`);
      } else {
        console.log(`❌ No se encontró archivo para admin ${admin.id}: ${currentImage}`);
      }
    }
    
    console.log('\n✅ === REPARACIÓN COMPLETADA ===');
    console.log('🎉 Todas las rutas de imágenes han sido actualizadas');
    
  } catch (error) {
    console.error('❌ Error durante la reparación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
fixProfileImages();