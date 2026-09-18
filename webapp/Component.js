sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"sap/ui/model/json/JSONModel",
	"MDM_QIR/model/models",
	"MDM_QIR/thirdparty/jszip-wrapper" // Added by Naveen 
], function(UIComponent, Device, JSONModel, models, JSZip) {
	"use strict";

	return UIComponent.extend("MDM_QIR.Component", {

		metadata: {
			manifest: "json"
		},

		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			var vPathImage = jQuery.sap.getModulePath("MDM_QIR") + "/Images/";
			this.setModel(new JSONModel({
				path: vPathImage
			}), "JM_ImageModel");
		
			this.getRouter().initialize();

			this._apexLoadedPromise = new Promise(function(resolve) {

				jQuery.sap.includeScript(

					jQuery.sap.getModulePath("MDM_QIR") + "/thirdparty/apexcharts.min.js",

					null,

					resolve

				);

			});

			this.setModel(models.createDeviceModel(), "device");
			this.JSZip = JSZip; // Added by srikanth 
			jQuery.sap.includeScript(
				jQuery.sap.getModulePath("MDM_QIR") + "/thirdparty/xlsx.full.min.js"
			);
		},
		getApexLoadedPromise: function() {
			return this._apexLoadedPromise;
		}
	});
});
