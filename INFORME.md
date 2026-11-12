# Informe breve — Simulador RISC-V RV32I

## Descripción

El proyecto implementa un simulador educativo del ISA base RISC-V de 32 bits (RV32I) en JavaScript y se ejecuta en el navegador, sin dependencias externas. El estado arquitectural incluye el PC, 32 registros de 32 bits y memoria plana byte-addressable de 8 MiB.

## Funcionalidades

- Decodificación y ejecución de instrucciones RV32I de carga/almacenamiento, operaciones inmediatas y de registro, saltos, ramas y valores upper-immediate.
- Acceso a memoria little-endian y carga de archivos binarios crudos en la dirección `0x00000000`.
- Ejecución paso a paso o continua, con inspección de PC, registros y memoria.
- Desensamblador para el conjunto de instrucciones soportado y consola con comandos de depuración.
- `ecall` para imprimir entero, carácter o cadena, y para finalizar el programa.
- Cuatro ejemplos ejecutables: pruebas aritméticas y de memoria, quicksort in-place, comprobación del árbol simétrico y salida por `ecall`.

## Verificación

Las pruebas automatizadas se ejecutan con `node --test tests\cpu.test.js`. Comprueban instrucciones y semántica little-endian, validación de instrucciones inválidas y los resultados esperados de los cuatro ejemplos.

## Preparación de la entrega

- Repositorio Git: agregar el enlace público del repositorio al PDF final.
- Video y código fuente en Google Drive: grabar una explicación breve y mostrar los cuatro ejemplos; agregar el enlace compartido al PDF.
- Entrega: exportar este informe a PDF, completar ambos enlaces y subirlo a Canvas.

Los enlaces y el video deben ser creados y publicados desde las cuentas del estudiante; no están incluidos en este directorio.
