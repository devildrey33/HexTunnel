// Constructor
var HexTunnel = function() {
    // Llamo al constructor del ObjetoBanner
    if (ObjetoCanvas.call(this, { 
        'Tipo'                      : 'THREE',
        'Ancho'                     : 'Auto',
        'Alto'                      : 'Auto',
        'Entorno'                   : 'Normal',
        'MostrarFPS'                : true,
        'BotonLogo'                 : true,
        'BotonPantallaCompleta'     : true,
        'ElementoRaiz'              : "",
        'Pausar'                    : false,             // Pausa el canvas si la pestaña no tiene el foco del teclado
        'ColorFondo'                : 0xCCCCCC,
        'CapturaEjemplo'            : "HexTunnel.png"
    }) === false) { return false; }
};

// Función para obtener un valor hexadecimal aleatório.
var RandHex = function() {
    return '0x' + Math.random().toString(16).slice(2, 8).toUpperCase();
};

//ObjetoNavegador.EsMovil();
var ConfigMinimo = (ObjetoNavegador.EsMovil() || ObjetoNavegador.EsFirefox()) ? true : false;

console.log("Config al minimo : " + ConfigMinimo);
var Constantes = {
                         // Para firefox solo 4 texturas, para el resto 8
    Texturas           : (ConfigMinimo) ? 4 : 8,   // Numero de texturas distintas
    Filas              : 48,  // 48 filas de 2 columnas
    TamFuente          : 30,  // Tamaño en pixeles de la fuente (NO TOCAR)
    Lineas             : 26,  // realmente es una menos
    CaracteresPorLinea : 28,  // 8 + 2 + 8 + 2 + 8    
    MaxAnimaciones     : (ConfigMinimo) ? 50 : 100   // 100 valores hexadecimales animandose como máximo (50 para firefox..)
};

HexTunnel.prototype = Object.assign( Object.create(ObjetoCanvas.prototype) , {
    constructor     : HexTunnel, 
    // Función que se llama al redimensionar el documento
    Redimensionar   : function() {    },
    // Función que se llama al hacer scroll en el documento    
    Scroll          : function() {    },
    // Función que se llama al mover el mouse por el canvas
    MouseMove       : function(Evento) { },
    // Función que se llama al presionar un botón del mouse por el canvas
    MousePresionado : function(Evento) { },
    // Función que se llama al soltar un botón del mouse por el canvas
    MouseSoltado    : function(Evento) { },
    // Función que se llama al entrar con el mouse en el canvas
    MouseEnter      : function(Evento) { },
    // Función que se llama al salir con el mouse del canvas
    MouseLeave      : function(Evento) { },
    // Función que se llama al presionar una tecla
    TeclaPresionada : function(Evento) { },
    // Función que se llama al soltar una tecla
    TeclaSoltada    : function(Evento) { },
    // Función que se llama al presionar la pantalla
    TouchStart      : function(Evento) { },
    // Función que se llama al soltar el dedo de la pantalla
    TouchEnd        : function(Evento) { },    
    // Función que se llama al pausar el banner
    Pausa           : function() { },
    // Función que se llama al reanudar el banner
    Reanudar        : function() { },
    // Función que inicia el ejemplo
    Iniciar         : function() {
        // Activo el mapeado de sombras
        this.Context.shadowMap.enabled	= true;
        // Creo la escena
        this.Escena = new THREE.Scene();
        window.scene = this.Escena; // Three js inspector...
        // Creo la camara
        this.Camara = new THREE.PerspectiveCamera(75, this.Ancho / this.Alto, 0.5, 2000);
        this.Camara.position.set(0, 0, 10);        
        this.Camara.name = "Camara";
        this.Escena.add(this.Camara);
        
        // Plano para el suelo
        this.Suelo = new THREE.Mesh(    new THREE.PlaneGeometry(2000, 2000), 
                                        new THREE.MeshPhongMaterial({ color: 0x555555, specular : 0x777777 }));
        this.Suelo.name = "Suelo";
        this.Suelo.rotation.x = -Math.PI / 2;
        this.Suelo.position.y = -20;
        this.Suelo.castShadow = false;
        this.Suelo.receiveShadow = true;
        this.Escena.add(this.Suelo);
        
        this.Avance = 0;
        
        this.CrearBloques();

        this.CrearLuces();
        
        this.CrearAnimaciones();
        
        // Esconde la ventana que informa al usuario de que se está cargando la animación. (REQUERIDO)
        this.Cargando(false);
        
    },
    
    Bloques     : [], // Objeto que contiene un bloque
    Texturas    : [], // Objeto que contiene una testura para varios bloques
    Animaciones : [], // Array de datos para las animaciones
    
    CrearBloques : function() {        
        this.Texturas = []; // Objeto que contiene una testura para varios bloques
        for (var t = 0; t < Constantes.Texturas; t++) {
            this.Texturas[t] = new this.TexturaBloque();
        }
        this.Bloques = []; // Objeto que contiene un bloque
        // Creo 96 bloques 
        var TA = 0; // TexturaActual
        for (var i = 0; i < Constantes.Filas ; i++) {
            this.Bloques.push(new this.Bloque(this.Escena, -24, i * -20, this.Texturas[TA++]));
            this.Bloques.push(new this.Bloque(this.Escena, 24, i * -20, this.Texturas[TA++]));
            if (TA > Constantes.Texturas - 1) { TA = 0; }
        }        
    },

    TexturaBloque : function() {
        this.Buffer  = new BufferCanvas(512, 1024);
        this.Textura = new THREE.Texture(this.Buffer.Canvas);
        
        this.Buffer.Context.font = Constantes.TamFuente + "px nova mono";
        this.Buffer.Context.fillStyle = "rgb(0, 0, 120)";
        this.Buffer.Context.fillRect(0, 0, this.Buffer.Ancho, this.Buffer.Alto);
        this.Buffer.Context.fillStyle = "rgb(95, 95, 95)";            
        for (var l = 1; l < Constantes.Lineas; l++) {
            var HexStr = RandHex() + '  ' + RandHex() + '  ' + RandHex();
            this.Buffer.Context.fillText(HexStr, 20, l * 40);
        }
        this.Textura.needsUpdate = true;        
    },
        
    Bloque : function(Escena, X, Z, Textura) {       
        this.Buffer  = Textura.Buffer;
        this.Textura = Textura.Textura;
        this.Figura  = new THREE.Mesh(  new THREE.BoxGeometry( 20, 40, 10 ), 
                                        new THREE.MeshStandardMaterial( { map: this.Textura, transparent : true, roughness: 0.5, opacity: 0.75  } ));
        Escena.add(this.Figura);
        this.Figura.position.set(X, 0, Z);
        this.Figura.castShadow = true;
        this.Figura.name = "Bloque";        
    },
    
    CrearLuces : function() {
        // Luz direccional
        this.DirLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
        this.DirLight.name = "DirLight1";
        this.DirLight.position.set( 18, 60, -230 );
        this.DirLight.position.multiplyScalar( 20 );
        this.DirLight.target = this.Suelo;
        this.DirLight.castShadow = true;
        this.DirLight.shadow.mapSize.width = 2048;
        this.DirLight.shadow.mapSize.height = 2048;
        var d = 40;
        this.DirLight.shadow.camera.left = -d;
        this.DirLight.shadow.camera.right = d;
        this.DirLight.shadow.camera.top = d;
        this.DirLight.shadow.camera.bottom = -d;
        this.DirLight.shadow.camera.far = 4500;
        this.Escena.add( this.DirLight );
/*        this.Dlhelper = new THREE.CameraHelper(this.DirLight.shadow.camera);
        this.Escena.add(this.Dlhelper);
        this.Dlhelper.visible = true;*/

        this.DirLight2 = new THREE.DirectionalLight( 0xffffff, 1.4 );
        this.DirLight2.name = "DirLight2";
        this.DirLight2.position.set( 3, 1, 50 );
        this.DirLight2.position.multiplyScalar( 20 );
        this.DirLight2.target = this.Suelo;
        this.DirLight2.castShadow = true;
        this.DirLight2.shadow.mapSize.width = 2048;
        this.DirLight2.shadow.mapSize.height = 2048;
        this.DirLight2.shadow.camera.left = -d;
        this.DirLight2.shadow.camera.right = d;
        this.DirLight2.shadow.camera.top = d;
        this.DirLight2.shadow.camera.bottom = -d;
        this.DirLight2.shadow.camera.far = 2500; 
//        this.DirLight.target = this.Cubo;
        this.Escena.add( this.DirLight2 );
/*        this.Dlhelper2 = new THREE.CameraHelper(this.DirLight2.shadow.camera);
        this.Escena.add(this.Dlhelper2);
        this.Dlhelper2.visible = true;*/
        
        // Luz de ambiente  
        this.HemiLight = new THREE.HemisphereLight( 0xeeeeee, 0xffffff, 1.2 );
        this.HemiLight.color.setHSL( 0.6, 0.6, 0.6 );
        this.HemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
        this.HemiLight.position.set( 0, 0, 0 );
        this.Escena.add( this.HemiLight );                 
    },
    
    CrearAnimaciones : function() {
        this.Animaciones = [];
        for (var i = 0; i < Constantes.MaxAnimaciones; i++) {
            this.Animaciones.push(new this.Animacion(this.Tick));
        }
    },
    // Objeto que contiene los valores de una animación del texto hexadecimal
    Animacion : function(Tick) {
        this.Textura    = RandInt(Constantes.Texturas -1, 0);  // Número de textura
        this.Linea      = RandInt(Constantes.Lineas, 1);    // Línea
        this.Columna    = RandInt(3, 0);                    // Columna
        this.Retraso    = RandInt(900, 0);                  // añado un retraso aleatório al inicio
        this.Tiempo     = RandInt(2000, 450);               // Duración
        this.TickInicio = Tick + this.Retraso;
        this.R          = 95;                               // Color Alto
        this.B          = 95;                               // Color Bajo
        this.Texto      = RandHex();                        // Nuevo valor hexadecimal
        this.Terminado  = false;                            // Determina si se ha terminado la animación
        this.Porcentaje = 0;                                // Porcentaje de la animación completado
        this.Tipo       = Rand(1, 0);                       // Tipo de animación (5% rojo, 10% verde, 85% amarillo)
        // Calcula el color del valor hexadecimal, y lo pinta si es necesario
        this.Calcular   = function(Tick, Buffer) {
            if (this.TickInicio < Tick) {
                var ta = Tick - this.TickInicio;                
                if (ta < this.Tiempo) {
                    this.Porcentaje =  ((ta * 100) / this.Tiempo) / 100;
                }
                else {
                    this.Porcentaje = 1;
                    this.Terminado = true;
                }
                this.R = 255 - Math.floor(this.Porcentaje * 160); // de 255 a 95
                this.B = Math.floor(this.Porcentaje * 95);        // de 0 a 95
                this.PintarHex(Buffer);
            }
        },
        // Pinta el valor hexadecimal
        this.PintarHex  = function(Buffer) {
            var x2 = 16.8 * 10;
            var x1 = 20 + (this.Columna * x2);
            var y1 = this.Linea * 40;
            var y2 = y1 -Constantes.TamFuente;
            Buffer.Context.fillStyle = "rgb(0, 0, 120)";
            Buffer.Context.fillRect(x1, y2, x2, 40);
            if (this.Tipo < 0.05)                          {  Buffer.Context.fillStyle = "rgb(" + this.R + "," + this.B + "," + this.B + ")";   }
            else if (this.Tipo > 0.05 && this.Tipo < 0.15) {  Buffer.Context.fillStyle = "rgb(" + this.B + "," + this.R + "," + this.B + ")";   }
            else                                           {  Buffer.Context.fillStyle = "rgb(" + this.R + "," + this.R + "," + this.B + ")";   }
            Buffer.Context.fillText(this.Texto, x1, y1);
        };
    },
    // Función que anima los textos hexadecimales
    AnimarHex : function() {
        for (var i = 0; i < Constantes.MaxAnimaciones; i++) {
            this.Animaciones[i].Calcular(this.Tick, this.Texturas[this.Animaciones[i].Textura].Buffer);
            if (this.Animaciones[i].Terminado === true) {
                this.Animaciones[i] = new this.Animacion(this.Tick);
            }                                    
        }
        for (var i = 0; i < Constantes.Texturas; i++) {
            this.Texturas[i].Textura.needsUpdate = true;
        }

    },    
        
    AvanzarBloques : function() {         
        for (var i = 0; i < Constantes.Filas * 2; i++) {
           if (this.Bloques[i].Figura.position.z > this.Camara.position.z + 100) {
               this.Bloques[i].Figura.position.z = this.Bloques[i].Figura.position.z - (20 * Constantes.Filas);
           }
           else {
               this.Bloques[i].Figura.position.z += 0.07;
           }
        }
    },
    
    // Función que pinta cada frame de la animación
    Pintar          : function() {  
        this.AvanzarBloques();
        this.AnimarHex();
        // Actualizo las animaciones de tiempo
//        this.Animaciones.Actualizar(this.Tick);
        
        this.Context.render(this.Escena, this.Camara);  
    }
});

// Inicialización del canvas en el Load de la página
var Canvas = new HexTunnel;
//window.addEventListener('load', function() { Canvas = new HexTunnel; });