sap.ui.define([
	"MDM_QIR/controller/BaseController",
	"MDM_QIR/controller/ErrorHandler"
], function(BaseController, ErrorHandler) {
	"use strict";
	var i18n;
	var vMsg;
	return BaseController.extend("MDM_QIR.controller.KeyData", {
		onInit: function() {
			BaseController.prototype.onInit.apply(this, arguments);
			this.f4Cache = {};
			var oBundle = this.getOwnerComponent()
				.getModel("i18n")
				.getResourceBundle();
			i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			var oHeaderModel = new sap.ui.model.json.JSONModel({
				col1: "",
				col2: ""
			});
			// F4 Help Data Model
			var oF4Model = new sap.ui.model.json.JSONModel({
				data: []
			});
			var oConfigModel = this.getOwnerComponent().getModel("JM_Config");
			var oJsonModel = this.getOwnerComponent().getModel("JM_UserModel");
			var that = this;
			oConfigModel.read("/UsernameSet", {
				success: function(oData) {
					oJsonModel.setData(oData.results);
					that.userName = oData.results[0].Uname;
					that.getOwnerComponent().setModel(oJsonModel, "JM_UserModel");
				},
				error: function(err) {
					ErrorHandler.showCustomSnackbar(i18n.getText("userName_fetch_err"), "Error", that);
					return;
				}
			});
			this.getView().setModel(oF4Model, "JM_F4Help");
			this.getView().setModel(oHeaderModel, "F4Header");
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("KeyData").attachPatternMatched(this.fn_RouteMatched, this);
		},
		fn_RouteMatched: function(oEvent) {
			var viewStateModel = this.getOwnerComponent().getModel("JM_ViewStateModel");

			if (!viewStateModel) {
				this.getOwnerComponent().getRouter().navTo("Search");
				return;
			}
			var fromInitiator = viewStateModel.getProperty("/fromInitiator");
			if (!fromInitiator) {
				this.byId('SID_QIR_MATNR').setValue("").setEditable(true);
				this.byId('SID_QIR_LIFNR').setValue('').setEditable(true);
				this.byId('SID_QIR_WERKS').setValue("").setEditable(true);

				this.byId('SID_QIR_MATNRDES').setValue("");
				this.byId('SID_QIR_LIFNRDES').setValue('');
				this.byId('SID_QIR_WERKSDES').setValue("");
			}
			var itemsModelData = this.getOwnerComponent().getModel("JM_ItemsModel").getProperty("/data");
			if (itemsModelData) {
				this.fngetkeydata(itemsModelData);
			}
		},
		fngetkeydata: function(oPayload) {
			console.log("Payload in keydata", oPayload);
			var that = this;
			var oModel = this.getOwnerComponent().getModel();
			oModel.create("/KeyDataSet", oPayload, {
				success: function(oData) {
					var oModelData = oData.NavKeyValues.results;
					console.log("KeyData", oModelData);
					if (oPayload.AppId === "QIRX") {
						that.getView().byId('SID_QIR_MATNR').setValue(oModelData[0].Matnr).setEditable(false);
						that.getView().byId('SID_QIR_LIFNR').setValue(oModelData[0].Vendor).setEditable(false);
						that.getView().byId('SID_QIR_WERKS').setValue(oModelData[0].Werks).setEditable(false);
					} else {
						that.getView().byId('SID_QIR_MATNR').setValue(oModelData[0].Matnr);
						that.getView().byId('SID_QIR_LIFNR').setValue(oModelData[0].Vendor);
						that.getView().byId('SID_QIR_WERKS').setValue(oModelData[0].Werks);
					}
					that.getView().byId('SID_QIR_MATNRDES').setValue(oModelData[0].Matnrdes);
					that.getView().byId('SID_QIR_LIFNRDES').setValue(oModelData[0].Vendordes);
					that.getView().byId('SID_QIR_WERKSDES').setValue(oModelData[0].Werksdes);
				},
				error: function() {
					ErrorHandler.showCustomSnackbar(i18n.getText("error_on_keydata"), "Error", that);
					return;
				}
			});
		},
		fn_cancel: function() {
			this.getOwnerComponent().getRouter().navTo("Search");
		},
		fn_proceed: function() {
			var vViewstateModel = new sap.ui.model.json.JSONModel({
				fromDashboard: false,
				fromUWL: false,
				fromKeyData: true
			});
			this.getOwnerComponent().setModel(vViewstateModel, "JM_ViewStateModel");

			var vMatnr = this.byId('SID_QIR_MATNR').getValue();
			var vVendor = this.byId('SID_QIR_LIFNR').getValue();
			var vPlant = this.byId('SID_QIR_WERKS').getValue();

			this.fn_proceedtovalidate(function(isValid) {

				if (isValid) {

					this._openConfirmDialog(
						"Confirmation",
						"Are you sure you want to proceed?",
						this._executeProceed.bind(this)
					);

				}

			}.bind(this));
		},
		_openConfirmDialog: function(title, message, fnCallback) {

			if (!this._oConfirmDialog) {

				this._oConfirmDialog = sap.ui.xmlfragment(
					this.getView().getId(),
					"MDM_QIR.Fragments.Confirmation",
					this
				);

				this.getView().addDependent(this._oConfirmDialog);
			}

			this._confirmCallback = fnCallback;

			var oModel = new sap.ui.model.json.JSONModel({
				title: title,
				message: message
			});

			this._oConfirmDialog.setModel(oModel, "confirmModel");
			this._oConfirmDialog.open();

		},
		onConfirmCancel: function() {

			this._oConfirmDialog.close();

		},
		fn_proceedtovalidate: function(fnCallback) {

			sap.ui.core.BusyIndicator.show(0);

			var vMatnr = this.getView().byId('SID_QIR_MATNR').getValue();
			var vVendor = this.getView().byId('SID_QIR_LIFNR').getValue();
			var vPlant = this.getView().byId('SID_QIR_WERKS').getValue();

			var vAppid = 'QIRC';
			if (this.getOwnerComponent().getModel("JM_ItemsModel")) {
				console.log("Items Model", this.getOwnerComponent().getModel("JM_ItemsModel").getData());
				if (this.getOwnerComponent().getModel("JM_ItemsModel").getProperty("/data")) {
					vAppid = this.getOwnerComponent().getModel("JM_ItemsModel").getProperty("/data").AppId || "QIRC";
				} else if (this.getOwnerComponent().getModel("JM_ItemsModel").getData()) {
					vAppid = this.getOwnerComponent().getModel("JM_ItemsModel").getData()[6] || "QIRC";
				}
			}

			var that = this;
			var oDataModel = this.getOwnerComponent().getModel();
			var aFilters = [];

			if (vMatnr) {
				aFilters.push(new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.EQ, vMatnr));
			}
			if (vPlant) {
				aFilters.push(new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, vPlant));
			}
			if (vVendor) {
				aFilters.push(new sap.ui.model.Filter("Vendor", sap.ui.model.FilterOperator.EQ, vVendor));
			}
			if (vAppid) {
				aFilters.push(new sap.ui.model.Filter("AppId", sap.ui.model.FilterOperator.EQ, vAppid));
			}

			oDataModel.read("/KeyDataSet", {
				filters: aFilters,
				success: function(oData) {

					var sResultTyp = oData.results[0].MsgType;
					var sResultMsg = oData.results[0].Message;

					if (sResultTyp === 'M' || sResultTyp === 'V' || sResultTyp === 'W') {

						var sIdMap = {
							M: "SID_QIR_MATNR",
							V: "SID_QIR_LIFNR",
							W: "SID_QIR_WERKS"
						};

						that.fn_setValueState(
							sIdMap[sResultTyp],
							sap.ui.core.ValueState.Error,
							sResultMsg || "Invalid value"
						);

						sap.ui.core.BusyIndicator.hide();
						fnCallback(false);
						return;
					}

					that.byId("SID_QIR_MATNR").setValueState("None");
					that.byId("SID_QIR_LIFNR").setValueState("None");
					that.byId("SID_QIR_WERKS").setValueState("None");

					if (sResultTyp === '-') {
						vMsg = '-';
						fnCallback(true);
					} else if (sResultTyp === 'X') {
						vMsg = 'X';
						ErrorHandler.showCustomSnackbar(sResultMsg, "Error", that);
						fnCallback(false);
					} else if (sResultTyp === 'E') {
						vMsg = 'E';
						ErrorHandler.showCustomSnackbar(sResultMsg, "Error", that);
						fnCallback(false);
					} else if (sResultTyp === 'A') {
						vMsg = 'A';
						ErrorHandler.showCustomSnackbar(sResultMsg, "Error", that);
						fnCallback(false);
					}

					sap.ui.core.BusyIndicator.hide();
				},
				error: function() {
					ErrorHandler.showCustomSnackbar(i18n.getText("keydata_error"), "Error", that);
					sap.ui.core.BusyIndicator.hide();
					fnCallback(false);
				}
			});
		},
		fn_setValueState: function(sFieldId, sState, sMsg) {

			var oControl = this.byId(sFieldId) ||
				sap.ui.getCore().byId(this.createId(sFieldId));

			if (!oControl) return;

			if (oControl.setValueState) {
				oControl.setValueState(sState || "None");
				oControl.setValueStateText(sMsg || "");
			}
		},
		onConfirmSubmit: function() {

			this._oConfirmDialog.close();

			if (this._confirmCallback) {
				this._confirmCallback();
			}

		},
		_executeProceed: function() {
			sap.ui.core.BusyIndicator.show(0);
			var vAppId = "QIRC";
			if (this.getOwnerComponent().getModel("JM_ItemsModel")) {
				console.log("Items Model", this.getOwnerComponent().getModel("JM_ItemsModel").getData());
				if (this.getOwnerComponent().getModel("JM_ItemsModel").getProperty("/data")) {
					vAppId = this.getOwnerComponent().getModel("JM_ItemsModel").getProperty("/data").AppId || "QIRC";
				} else if (this.getOwnerComponent().getModel("JM_ItemsModel").getData()) {
					vAppId = this.getOwnerComponent().getModel("JM_ItemsModel").getData()[6] || "QIRC";
				}
			}

			var vMatnr = this.getView().byId('SID_QIR_MATNR').getValue();
			var vVendor = this.getView().byId('SID_QIR_LIFNR').getValue();
			var vPlant = this.getView().byId('SID_QIR_WERKS').getValue();
			var changeItems = [vMatnr, vVendor, vPlant];
			if (this.getOwnerComponent().getModel("JM_ItemsModel")) {
				console.log("Items Model", this.getOwnerComponent().getModel("JM_ItemsModel").getData());
				if (this.getOwnerComponent().getModel("JM_ItemsModel").getProperty("/data")) {
					vMatnr = this.getOwnerComponent().getModel("JM_ItemsModel").getProperty("/data").Matnr;
					vVendor = this.getOwnerComponent().getModel("JM_ItemsModel").getProperty("/data").Vendor;
					vPlant = this.getOwnerComponent().getModel("JM_ItemsModel").getProperty("/data").Werks;
				} else if (this.getOwnerComponent().getModel("JM_ItemsModel").getData()) {
					vMatnr = this.getOwnerComponent().getModel("JM_ItemsModel").getData()[0];
					vVendor = this.getOwnerComponent().getModel("JM_ItemsModel").getData()[1];
					vPlant = this.getOwnerComponent().getModel("JM_ItemsModel").getData()[2];
				}
			}
			var vMatnrdes = this.byId('SID_QIR_MATNRDES').getValue();
			var vVendordes = this.byId('SID_QIR_LIFNRDES').getValue();
			var vPlantdes = this.byId('SID_QIR_WERKSDES').getValue();
			var vMsgType;
			if (this.getOwnerComponent().getModel("JM_ItemsModel") && this.getOwnerComponent().getModel("JM_ItemsModel").getProperty("/data")) {
				vMsgType = this.getOwnerComponent().getModel("JM_ItemsModel").getProperty("/data").MsgType;
			} else if (this.getOwnerComponent().getModel("JM_ItemsModel") && this.getOwnerComponent().getModel("JM_ItemsModel").getData()) {
				vMsgType = this.getOwnerComponent().getModel("JM_ItemsModel").getData()[7];
			}
			var items = [vMatnr, vVendor, vPlant, vMatnrdes, vVendordes, vPlantdes, vAppId, vMsgType];
			var oModel = new sap.ui.model.json.JSONModel(items);
			if (vMsgType === "C") {
				var oChangeModel = new sap.ui.model.json.JSONModel(changeItems);
				this.getOwnerComponent().setModel(oChangeModel, "JM_ChangeItemsModel");
			}
			if (!vMatnr || !vVendor || !vPlant) {
				ErrorHandler.showCustomSnackbar(i18n.getText("keydata_field_error"), "Error", this);
				return;
			}
			this.getOwnerComponent().setModel(oModel, "JM_ItemsModel");
			if (vMsg === 'X' || vMsg === 'E' || vMsg === 'A') {
				return;
			} else if (vMsg === '-') {
				var vViewstateModel = new sap.ui.model.json.JSONModel({
					fromKeyData: true,
					fromDashboard: false,
					fromUWL: false
				});
				this.getOwnerComponent().setModel(vViewstateModel, "JM_ViewStateModel");
				var jsonData = {};
				if (vMsgType === 'C') {
					jsonData = {
						Appid: vAppId,
						Transid: "",
						Ind: "X",
						WiId: "",
						TypeLevel: "I",
						SendBack: "",
						MsgType: "C"
					};
				} else {
					jsonData = {
						Appid: vAppId,
						Transid: "",
						Ind: "X",
						WiId: "",
						TypeLevel: "I",
						SendBack: ""
					};
				}
				var vParmModel = new sap.ui.model.json.JSONModel(jsonData);
				this.getOwnerComponent().setModel(vParmModel, "JM_ContextModel");
				this.getOwnerComponent().getRouter().navTo("Initiator");

			}
			//else {
			// 	ErrorHandler.showCustomSnackbar(i18n.getText("invalid_msg"), "Error");
			// }
			sap.ui.core.BusyIndicator.hide();
		},
		fn_clearFields: function() {

			this.byId("SID_QIR_MATNR").setValue("");
			// this.byId("SID_QIR_REVLV").setValue("");
			this.byId("SID_QIR_LIFNR").setValue("");
			this.byId("SID_QIR_WERKS").setValue("");
			this.byId("SID_QIR_LIFNRDES").setValue("");
			this.byId("SID_QIR_WERKSDES").setValue("");
			this.byId("SID_QIR_MATNRDES").setValue("");
		},
		fn_NavBack: function() {
			var that = this;
			this._openConfirmDialog(
				"Confirmation",
				"Are you sure want to exit ?",
				function() {

					that.fn_clearFields();
					that.getOwnerComponent().getRouter().navTo("Search");

				}
			);

		}
	});

});