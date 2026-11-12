# RISC-V RV32I Simulator — CS3051

Simulador de arquitectura RISC-V RV32I en el navegador. Mantiene PC, 32 registros y memoria byte-addressable little-endian; permite cargar binarios crudos, ejecutar instrucciones y consultar registros, memoria y desensamblado.

## Cómo ejecutarlo

Abre `index.html` en un navegador moderno. No requiere instalar dependencias ni iniciar un servidor.

## Ejemplos integrados

Cada demo carga un programa de instrucciones RV32I que ejecuta el simulador; los datos iniciales se preparan en memoria cuando el ejemplo los necesita.

| Ejemplo | Cómo comprobarlo |
|---|---|
| `riscvtest` | Pulsa **Run** y consulta `mem 0x64`; debe contener `19 00 00 00` (25). |
| `quicksort` | Pulsa **Run** y consulta `mem 0x1000`; debe quedar `{1, 2, 3, 4, 6, 8, 9}`. |
| `árbol simétrico` | Pulsa **Run** y consulta `regs a0`; debe ser `1`. |
| `ecall / salida` | Pulsa **Run**; el programa debe imprimir `25` en la consola. |

Los programas `quicksort` y `árbol simétrico` usan las entradas del enunciado. El primero implementa quicksort in-place con partición y llamadas recursivas; el segundo compara los pares de posiciones espejo del árbol completo de siete elementos.

## Cargar un programa propio

Usa **Cargar .bin** para seleccionar un binario crudo little-endian generado para RV32I. El archivo se carga en `0x00000000`; los archivos que exceden la memoria del simulador se rechazan con un mensaje.

Controles: **F7** ejecuta una instrucción, **F8** ejecuta hasta detenerse y **F9** reinicia. Arrastra el separador entre el área central y la terminal para cambiar su ancho (también se puede ajustar con las flechas del teclado al enfocar el separador). La salida de la terminal se desplaza verticalmente. Usa **Limpiar** o el comando `clear` en la consola para borrar los mensajes sin reiniciar el simulador. La consola también admite `help`, `step [N]`, `run`, `pc`, `regs [registro...]`, `mem <dirección> [fin]`, `disasm [dirección] [N]`, `info` y `reset`.

## Pruebas

Con Node.js instalado, ejecuta desde la carpeta del proyecto:

```powershell
node --test tests\cpu.test.js
```

## Estructura del proyecto

```
riscv-simulator/
├── index.html          # Estructura HTML (markup de la UI)
├── css/
│   └── styles.css       # Estilos (tema claro con acentos azul y verde)
└── js/
    ├── cpu.js           # Núcleo del simulador: clase CPU (fetch/decode/execute, disasm)
    ├── demos.js         # Programas máquina de demostración (riscvtest, quicksort, árbol, ecall)
    ├── state.js         # Estado global compartido (instancia de CPU, registros previos, dirección de memoria)
    ├── render.js         # Funciones de renderizado (registros, desensamblado, memoria, status bar)
    ├── console.js        # Terminal de comandos (step, run, regs, mem, disasm, reset, etc.)
    ├── controls.js        # Listeners de botones, atajos de teclado (F7/F8/F9), carga de archivos .bin
    └── main.js           # Inicialización (mensajes de bienvenida y primer render)
tests/
└── cpu.test.js          # Pruebas de ISA y resultados de los ejemplos
INFORME.md               # Informe breve para preparar la entrega
```
