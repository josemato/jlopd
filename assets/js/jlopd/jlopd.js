/**
 * LOPD Plugin
 *
 * Copyright (c) 2013 Jose Mato (josemato.name)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

/**
 * Plugin que carga javascripts de servicios de terceros a partir de la confirmacion del usuario o
 * si el usuario continua navegando en la web.
 * La primera vez que entra se pueden cargar los scripts al cabo de X segundos definidos o solicitar permiso.
 *
 * Ejemplo 1: Mostrar aviso la primera vez que el usuario llega y cargar las cookies al cabo de 20 segundos
 * LOPD.init( { 'container': 'privacy-police',
   				'scripts': ['http://dominio.com/publicidad.js', 'http://dominio.com/tracking.js'],
   				'load': 20
   } );
 *
 * Ejemplo 2: Ademas, cargar google analytics si el usuario acepta las cookies (si pasan X segundos 
 *	o sigue navegando en la web)
 *
 * LOPD.init( { 'container': 'privacy-police',
   				'scripts': ['http://dominio.com/publicidad.js', 'http://dominio.com/tracking.js'],
   				'load': 20,
   				'callback': function(loadState) { 
					if(loadState == true) {
						// Aqui va el codigo de google analytics u otro tracking
					} else {
						// El usuario no dio permiso para instalar las cookies
					}
				}
   } );
 *
 *
 * Ejemplo 3: Modo estricto. Instalar las cookies solo si el usuario Acepta o sigue navegando.
 * 	En este modo el temporizador se deshabilita, ademas este modo nos permite modificar si queremos el texto 
 *	por defecto de los botones estableciendo las propiedades 'button_ok' y 'button_cancel'
 * 
 * LOPD.init( { 'container': 'privacy-police',
   				'scripts': ['http://dominio.com/publicidad.js', 'http://dominio.com/tracking.js'],
   				'requestPermission': true,
   				'button_ok': 'Aceptar',
   				'button_cancel': 'Cancelar',
   				'callback': function(loadState) { 
					if(loadState == true) {
						// Aqui va el codigo de google analytics u otro tracking
					} else {
						// El usuario no dio permiso para instalar las cookies
					}
				}
   } );
 */

JLOPD = function(settings) {
	// Properties
	var DEFAULT_CONTAINER = '',
		DEFAULT_CALLBACK = function(loadState) {},
		DEFAULT_SCRIPTS = [],
		DEFAULT_TIME2LOAD = 0,  // time in seconds to load scripts. 0 means disable
		BUTTON_OK = 'Aceptar',
		BUTTON_CANCEL = 'Cancelar',
		DEFAULT_COOKIE = 'jlopd',
		DEFAULT_DOMAIN = document.domain;

	return {
		init: function(conf) {
			var  conf = conf || {};

			this.settings = {
				'container': conf.container || DEFAULT_CONTAINER,
				'scripts': conf.scripts || DEFAULT_SCRIPTS,
				'callback': conf.callback || DEFAULT_CALLBACK,
				'load': conf.load * 1000 || DEFAULT_TIME2LOAD,
				'requestPermission': conf.requestPermission || false,
				'button_ok': conf.button_ok || BUTTON_OK,
				'button_cancel': conf.button_cancel || BUTTON_CANCEL
			};

			this.container = document.getElementById(this.settings.container);
			this._run();
		},
		_okClick: function() {
			this._hidePrivacy();
			this._load();
		},
		_cancelClick: function() {
			this._hidePrivacy();
			this.settings.callback(false);
		},
		_hidePrivacy: function() {
			this.container.style.display = 'none';
		},
		_addButtons: function(container) {
			var self = this, 
				wrapper = document.createElement('div'),
				buttonAccept = document.createElement('button'),
				buttonCancel = document.createElement('button');

			wrapper.setAttribute('class', 'privacy-police-buttons');
			buttonAccept.innerHTML = this.settings.button_ok;
			buttonCancel.innerHTML = this.settings.button_cancel;
			
			if(buttonAccept.addEventListener) {
				buttonAccept.addEventListener("click", self._okClick.bind(self), false);
				buttonCancel.addEventListener("click", self._cancelClick.bind(self), false);
			} else { // IE < 9
				buttonAccept.attachEvent("onclick", self._load.bind(self));
				buttonCancel.attachEvent("onclick", self._hidePrivacy.bind(self));
        	}

        	wrapper.appendChild(buttonCancel);
			wrapper.appendChild(buttonAccept);
			container.appendChild(wrapper);
		},
		_load: function() { // load script files
			var scripts = document.createDocumentFragment(),
				script = document.createElement('script'),
				s = this.settings.scripts, 
				t = s.length,
				i = -1,
				load = this.settings.load * 1000;

			
			while(++i < t) {
				script.src = s[i];
				scripts.appendChild(script);
			}

			document.getElementsByTagName('body')[0].appendChild(scripts);

			this.settings.callback(true);
		},
		_run: function() {
			var s = this.settings;

			if(this._isFirstVisit()) { // show info
				this._addVisit();

				if(!this.container) {
					// console.log('Error: Container must not be null');
					return;
				}

				// check buttons
				if(s.requestPermission) {
					// if there are buttons, disallow the timer
					this._addButtons(this.container);
					s.load = 0;
				}

				this.container.style.display = 'block';

				if(s.load > 0) {
					// console.log("WAIT: ", s.load);
					setTimeout(this._load.bind(this), s.load);
				} else if(!s.requestPermission) {
					this.settings.callback(true);
				}
			} else { // load scripts and call callback
				console.log("LOAD NOW");
				this._load();
			}
		},
		_isFirstVisit: function() {
			var isNewUser = document.referrer.indexOf(document.domain) == -1;
			
			if(isNewUser) {
				if(localStorage) {
					return localStorage.getItem(DEFAULT_COOKIE) == null;
				}
			}

			return isNewUser;
		},
		_addVisit: function() {
			if(localStorage) {
				localStorage.setItem(DEFAULT_COOKIE, 1);
			}
		}

	} // end return
}();