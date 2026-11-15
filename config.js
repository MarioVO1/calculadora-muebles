// Valores neutros. Los reales se capturan en la pantalla de Ajustes (toque largo sobre el título) y se guardan en el celular.
const CONFIG = {
  ejemploActivo: true,      // true = muestra el letrero "VALORES DE EJEMPLO". Pon false con los datos reales

  valorDiaTrabajo: 0,       // lo que vale un día de trabajo del carpintero (pesos)

  luzPorDia: 0,             // luz del taller por día de trabajo, se multiplica por los días
  pagoDiarioAbuelo: 0,       // pago por día del abuelo (pesos, se multiplica por los días)
  pagoDiarioChalan: 0,       // pago por día del chalán (pesos, se multiplica por los días)
  desgasteHerramientas: 0,  // desgaste de herramientas por mueble (pesos)

  entrega: {              // gasolina por entrega (pesos); también es la gasolina de un pedido de puertas
    No: 0,
    Cerca: 0,
    Lejos: 0,
  },

  cliente: {                // ajuste a la mano de obra según el cliente (0.10 = 10% más)
    "Fácil": 0,
    Normal: 0.10,
    Exigente: 0.25,
  },

  margenes: {               // ganancia sobre el costo (0.30 = 30%)
    normal: 0.15,           // "Precio normal"
    maximo: 0.40,           // "Máximo que puedes pedir"
  },

  colchonInterrupciones: 0.20,    // "Con otros pedidos a la vez": días del carpintero × (1 + esto)

  diasTrabajoGrande: 15,          // desde estos días es "trabajo grande"
  margenExtraTrabajoGrande: 0.10, // se suma al costo en trabajo grande (0.10 = 10% más)
  pagos: {                        // cobro por partes (sobre el precio normal)
    anticipo: 0.50,
    avance: 0.30,
    entrega: 0.20,
  },

  puertas: {                      // pantalla "Puertas de tambor"
    materialPorPuerta: 0,         // material por puerta (pesos), valor inicial en pantalla
    diasCarpinteriaPorPuerta: 2,  // días del carpintero por puerta
    diasInstalacion: 1,           // días del carpintero por pedido, si va instalada
    diasBarnizPorPuerta: 3,      // días de barniz del abuelo por puerta
    precioNormal: 0,              // precio normal por puerta (pesos)
    desdePuertasDescuento: 8,     // desde esta cantidad hay descuento
    descuentoPorPuerta: 0,      // descuento por puerta (pesos)
    margenMinimo: 0.15,           // avisa si la ganancia sobre el costo queda abajo de esto
  },

  redondeo: 50,            // redondear precios al múltiplo de (pesos)
};
